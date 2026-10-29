"""No-network safety tests for the production cPanel FTPS deployer."""
from __future__ import annotations

import importlib.util
import os
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch

SCRIPT = Path(__file__).resolve().parents[1] / "deploy/cpanel-production-deploy.py"
spec = importlib.util.spec_from_file_location("gocamp_production_deploy", SCRIPT)
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


class CPanelProductionSafety(unittest.TestCase):
    def test_allowlist_blocks_runtime_uploads_and_private_paths(self):
        items = deploy.uploads()
        names = {name for name, _, _ in items}
        self.assertTrue({".htaccess", "index.php", "data/programs.php"} <= names)
        self.assertFalse(any(name.startswith((
            "uploads/", "data/inquiries/", ".github/", ".git/", "deploy/", "tests/",
        )) for name in names))
        self.assertTrue(any(name.startswith("images/") for name in names))

    def test_ensures_admin_catalog_and_existing_images_never_overwritten(self):
        items = deploy.uploads()
        for name, _, overwrite in items:
            if name.startswith(("data/", "images/")):
                self.assertFalse(overwrite, name)
            if name in (".htaccess", "index.php"):
                self.assertTrue(overwrite, name)

    def test_missing_credentials_and_invalid_hostname_block_deployment(self):
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaisesRegex(RuntimeError, "Missing production FTPS"):
                deploy.configuration()
        with patch.dict(os.environ, {
            "CPANEL_PRODUCTION_FTP_HOST": "https://example.net",
            "CPANEL_PRODUCTION_FTP_USERNAME": "prod@example.net",
            "CPANEL_PRODUCTION_FTP_PASSWORD": "test",
        }, clear=True):
            with self.assertRaisesRegex(RuntimeError, "Invalid FTP"):
                deploy.configuration()

    def test_missing_backup_blocks_apply(self):
        with TemporaryDirectory() as tmp:
            with patch.object(deploy, "STAGE", Path(tmp)):
                with self.assertRaisesRegex(RuntimeError, "Missing manifest or encrypted backup"):
                    deploy.apply([])

    def test_backup_hashes_existing_code_and_marks_missing_code(self):
        items = [("index.php", Path("/unused"), True),
                 ("new.php", Path("/unused"), True),
                 ("data/programs.php", Path("/unused"), False)]
        def fake_read(ftp, name):
            return b"existing" if name == "index.php" else None
        with patch.object(deploy, "remote_read", fake_read):
            hashes, originals = deploy.original_hashes(object(), items)
        self.assertEqual(hashes["index.php"], deploy.hashlib.sha256(b"existing").hexdigest())
        self.assertIsNone(hashes["new.php"])
        self.assertNotIn("data/programs.php", hashes)
        self.assertEqual(originals, {"index.php": b"existing"})

    def test_encrypted_backup_roundtrip(self):
        try:
            from cryptography.hazmat.primitives.ciphers.aead import AESGCM
        except ImportError:
            self.skipTest("GitHub workflow installs cryptography before production prepare")
        data = deploy.encrypted_backup({"index.php": b"hello"}, "test-password")
        self.assertNotIn(b"hello", data)
        offset = len(b"GOCAMPPROD1")
        salt, nonce = data[offset:offset + 16], data[offset + 16:offset + 28]
        plaintext = AESGCM(deploy.derive_key("test-password", salt)).decrypt(
            nonce, data[offset + 28:], deploy.AAD)
        self.assertIn(b"hello", plaintext)


if __name__ == "__main__":
    unittest.main()
