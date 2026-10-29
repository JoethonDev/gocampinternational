"""Offline checks for the cPanel staging FTPS deployment configuration."""
from __future__ import annotations

import importlib.util
import os
from pathlib import Path
import sys
import unittest
from unittest.mock import patch


ROOT = Path(__file__).resolve().parents[1]


def load_script(name: str, module_name: str):
    spec = importlib.util.spec_from_file_location(module_name, ROOT / "deploy" / name)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


cpanel = load_script("cpanel-staging-deploy.py", "cpanel_staging")


class CPanelStagingTests(unittest.TestCase):
    def test_requires_distinct_cpanel_credentials(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(RuntimeError, "Missing cPanel staging"):
                cpanel.staging_config()

    def test_validates_server_hostname_and_credentials(self):
        settings = {
            "CPANEL_STAGING_FTP_HOST": "server123.example.net",
            "CPANEL_STAGING_FTP_USERNAME": "deploy@example.com",
            "CPANEL_STAGING_FTP_PASSWORD": "test-value",
        }
        with patch.dict(os.environ, settings, clear=True):
            self.assertEqual(cpanel.staging_config(), (
                "server123.example.net", "deploy@example.com", "test-value"
            ))
            os.environ["CPANEL_STAGING_FTP_HOST"] = "https://example.com/"
            with self.assertRaisesRegex(RuntimeError, "Invalid staging FTP host"):
                cpanel.staging_config()

    def test_reuses_safe_upload_allowlist(self):
        rules = cpanel.load_deployment_rules()
        uploads = rules.build_uploads()
        names = {item.relpath.as_posix() for item in uploads}
        self.assertIn("index.php", names)
        self.assertIn(".htaccess", names)
        self.assertIn("data/programs.php", names)
        self.assertFalse(any(n.startswith(("uploads/", "data/inquiries/", ".github/", ".git/")) for n in names))
        self.assertFalse(any(item.overwrite for item in uploads if item.relpath.parts[0] in ("data", "images")))

    def test_cpanel_reconcile_uses_scoped_data_path(self):
        with patch.dict(os.environ, {
            "GOCAMP_FTPS_TARGET": "cpanel-staging",
            "GOCAMP_CATALOG_MIGRATION": "reconcile",
        }):
            merge = load_script("apply-uk-content-migration.py", "cpanel_reconcile")
            self.assertEqual(merge.DIRECTORY, "/data")
            self.assertEqual(merge.FTPS_TARGET, "cpanel-staging")
            self.assertEqual(merge.MIGRATION_SCOPE, "reconcile")


if __name__ == "__main__":
    unittest.main()
