# Security and deployment notes

## Mandatory configuration before deployment

1. Rotate the old administrator password. A prior password hash and password hint were committed to the public repository; deleting them from current files **does not** erase Git history.
2. Generate a fresh hash locally, without committing the plaintext or hash:
   `php -r 'echo password_hash(readline("New admin password: "), PASSWORD_BCRYPT, ["cost" => 12]), PHP_EOL;'`
   Avoid entering a password on a shell command line. Use a secure secret-management workflow.
3. Set `GC_ADMIN_PASSWORD_HASH` in the **PHP process environment**, and optionally `GC_ADMIN_USERNAME` (defaults to `admin`). Verify that these variables are visible to PHP-FPM/Apache, not just the interactive shell. Without a configured hash, admin authentication intentionally fails closed.
4. Force HTTPS for administrative access. Verify PHP session cookies have Secure, HttpOnly and SameSite attributes in production.
5. Confirm Apache honors the root `.htaccess` directives and that `/data/inquiries/` is not reachable from outside. The recommended stronger deployment is to move inquiry records outside the document root.
6. Configure encrypted backups for inquiry records and rotate/revoke any exposed credentials or other secrets.

## Smoke tests

- With `GC_ADMIN_PASSWORD_HASH` unset, admin login must fail.
- Verify an authorized login with the newly configured password and an invalid login with a wrong password.
- `GET /admin/item-action.php?action=soft-delete&type=dest&slug=...` must return HTTP 405 and must not mutate data.
- An authorized POST mutation without CSRF must return 403; the same request through the admin UI should succeed.
- Upload requests missing a CSRF token must return 403; valid JPEG/PNG/WebP/GIF files should still upload with an authorized session.
- Verify `/data/inquiries/<record>.json` cannot be downloaded publicly.
- Submit a contact and booking form and verify inquiry persistence, email delivery, and the admin listing.

## Further hardening

- Add a global rate limiter in front of both admin login and public lead endpoints; PHP session-only lockout is insufficient against distributed attackers.
- Sanitize admin-authored rich HTML with a tested allowlist before rendering public pages.
- Move content and inquiries to transactional storage and put immutable/auditable history around edits.
- Test on the production web server: GitHub CI lint alone does not cover routing or Apache/FPM configuration.
