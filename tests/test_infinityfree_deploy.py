"""No-network checks for InfinityFree FTP deployment rules."""
from __future__ import annotations

from ftplib import error_perm
from pathlib import Path
import importlib.util
import sys
import unittest

path = Path(__file__).resolve().parents[1] / 'deploy' / 'infinityfree-deploy.py'
spec = importlib.util.spec_from_file_location('infinityfree_deploy', path)
mod = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = mod
spec.loader.exec_module(mod)


class FakeFTP:
    def __init__(self):
        self.directories = {'/htdocs', '/htdocs/data', '/htdocs/images'}
        self.files = {
            '/htdocs/data/faq.json': b'LIVE FAQ',
            '/htdocs/data/all_programs.php': b'LIVE PHP DATA',
            '/htdocs/images/banner.webp': b'LIVE ADMIN IMAGE',
            '/htdocs/index.php': b'OLD CODE',
            '/htdocs/data/inquiries/lead.json': b'LEAD RECORD',
            '/htdocs/uploads/private.webp': b'USER UPLOAD',
        }
        self.dirs = '/htdocs'
        self.sent = []

    def pwd(self):
        return self.dirs

    def cwd(self, path):
        p = path.rstrip('/') if path.startswith('/') else self.dirs.rstrip('/') + '/' + path
        if p not in self.directories:
            raise error_perm('550 Directory does not exist')
        self.dirs = p

    def mkd(self, path):
        self.directories.add(self.dirs.rstrip('/') + '/' + path)

    def nlst(self):
        found = [p.rsplit('/', 1)[-1] for p in self.files
                 if p.rsplit('/', 1)[0] == self.dirs]
        found += [d.rsplit('/', 1)[-1] for d in self.directories
                  if d.rsplit('/', 1)[0] == self.dirs]
        return found

    def storbinary(self, command, handle, blocksize=8192):
        name = command.removeprefix('STOR ')
        target = self.dirs.rstrip('/') + '/' + name
        self.files[target] = handle.read()
        self.sent.append(target)


class ProtectRuntimeData(unittest.TestCase):
    def test_allowlist_blocks_all_private_paths(self):
        uploads = mod.build_uploads()
        paths = {u.relpath.as_posix() for u in uploads}
        for required in ('index.php', 'data/faq.json', 'data/all_programs.php', 'images/banner.webp'):
            self.assertIn(required, paths)
        self.assertFalse(any(
            p.startswith(('uploads/', 'data/inquiries/', '.git/', '.github/', 'tests/', 'docs/', 'deploy/'))
            for p in paths
        ))
        for item in uploads:
            if item.relpath.as_posix().startswith(('data/', 'images/')):
                self.assertFalse(item.overwrite)

    def test_uploads_code_but_preserves_data_and_existing_images(self):
        ftp = FakeFTP()
        uploaded, skipped = mod.deploy(ftp, mod.build_uploads(), '/htdocs/', False)
        self.assertGreater(uploaded, 0)
        self.assertGreaterEqual(skipped, 3)
        self.assertEqual(b'LIVE FAQ', ftp.files['/htdocs/data/faq.json'])
        self.assertEqual(b'LIVE PHP DATA', ftp.files['/htdocs/data/all_programs.php'])
        self.assertEqual(b'LIVE ADMIN IMAGE', ftp.files['/htdocs/images/banner.webp'])
        self.assertEqual(b'LEAD RECORD', ftp.files['/htdocs/data/inquiries/lead.json'])
        self.assertEqual(b'USER UPLOAD', ftp.files['/htdocs/uploads/private.webp'])
        self.assertEqual((mod.REPO_ROOT / 'index.php').read_bytes(), ftp.files['/htdocs/index.php'])
        self.assertTrue(all('/data/inquiries/' not in name and '/uploads/' not in name for name in ftp.sent))

    def test_dry_run_never_writes(self):
        ftp = FakeFTP()
        before = dict(ftp.files)
        uploaded, skipped = mod.deploy(ftp, mod.build_uploads(), '/htdocs/', True)
        self.assertEqual((0, 0), (uploaded, skipped))
        self.assertEqual(before, ftp.files)
        self.assertEqual([], ftp.sent)

    def test_traversal_rejected(self):
        with self.assertRaises(ValueError):
            mod.deploy(FakeFTP(), [], '/htdocs/../other', False)


if __name__ == '__main__':
    unittest.main()
