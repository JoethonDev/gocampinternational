<?php
require_once __DIR__ . '/auth-check.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/../includes/section-visibility.php';

$settingsFile = __DIR__ . '/../data/site_settings.php';
$site_settings = [];
if (is_file($settingsFile)) {
    require $settingsFile;
}
$site_settings = is_array($site_settings) ? $site_settings : [];
$success_message = '';
$error_message = '';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    if (!csrf_check($_POST['csrf'] ?? '')) {
        $error_message = 'Invalid CSRF token. Please reload and retry.';
    } else {
        $site_settings['section_visibility'] = gocamp_read_visibility(
            $_POST['section_visibility'] ?? [],
            'home',
            $site_settings['section_visibility'] ?? []
        );
        if (save_php_file($settingsFile, 'site_settings', $site_settings)) {
            $success_message = 'Homepage visibility saved.';
        } else {
            $error_message = 'Unable to save settings. Verify write permissions on data/.';
        }
    }
}
$pageTitle = 'Homepage Visibility';
require __DIR__ . '/includes/admin-header.php';
?>
<div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-3">
        <h1 class="h3">Homepage Visibility</h1>
        <a href="/admin/dashboard" class="btn btn-outline-secondary">Back to Dashboard</a>
    </div>
    <form method="POST" action="/admin/site-visibility">
        <input type="hidden" name="csrf" value="<?= htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8') ?>">
        <?php if ($success_message): ?><div class="alert alert-success"><?= htmlspecialchars($success_message) ?></div><?php endif; ?>
        <?php if ($error_message): ?><div class="alert alert-danger"><?= htmlspecialchars($error_message) ?></div><?php endif; ?>
        <?php $visibilityEntity = 'home'; $visibilityRecord = $site_settings; require __DIR__ . '/includes/visibility-controls.php'; ?>
        <button class="btn btn-primary" type="submit"><i class="bi bi-save me-2"></i>Save Homepage Visibility</button>
    </form>
</div>
<?php require __DIR__ . '/includes/admin-footer.php'; ?>
