<?php
require_once __DIR__ . '/auth-check.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/../includes/section-visibility.php';
$settingsFile = __DIR__ . '/../data/site_settings.php';
$site_settings = [];
if (is_file($settingsFile)) require $settingsFile;
$site_settings = is_array($site_settings) ? $site_settings : [];
$success_message = '';
$error_message = '';
$scopeLabels = [
    'home' => 'Homepage',
    'destination' => 'Destinations',
    'category' => 'Program Categories',
    'program' => 'Individual Programs',
];
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    $scope = (string)($_POST['scope'] ?? '');
    if (!csrf_check($_POST['csrf'] ?? '')) {
        $error_message = 'Invalid CSRF token. Please reload and try again.';
    } elseif (!isset($scopeLabels[$scope])) {
        $error_message = 'Invalid visibility scope.';
    } else {
        if ($scope === 'home') {
            $site_settings['section_visibility'] = gocamp_read_visibility(
                $_POST['section_visibility'] ?? [], 'home',
                $site_settings['section_visibility'] ?? []
            );
        } else {
            $submitted = $_POST['global_visibility'] ?? [];
            $submitted = is_array($submitted) ? $submitted : [];
            $previous = $site_settings['global_visibility'][$scope] ?? [];
            $next = is_array($previous) ? $previous : [];
            foreach (gocamp_visibility_options($scope) as $key => $definition) {
                if (gocamp_gallery_disabled_by_policy($scope, $key)) continue;
                if (!array_key_exists($key, $submitted) ||
                    !in_array((string)$submitted[$key], ['0', '1'], true)) {
                    $error_message = 'All visibility switches must have a valid value.';
                    break;
                }
                $next[$key] = (string)$submitted[$key] === '1';
            }
            if ($error_message === '') {
                $site_settings['global_visibility'][$scope] = $next;
            }
        }
        if ($error_message === '') {
            if (save_php_file($settingsFile, 'site_settings', $site_settings)) {
                $success_message = $scopeLabels[$scope] . ' visibility saved.';
            } else {
                $error_message = 'Unable to save settings. Verify write permissions on data/.';
            }
        }
    }
}
$pageTitle = 'Site Visibility';
require __DIR__ . '/includes/admin-header.php';
?>
<div class="container py-4">
    <div class="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-3">
        <div>
            <h1 class="h3 mb-1">Site Visibility</h1>
            <p class="text-muted mb-0">Global rules affect only items without an individual Show/Hide override.</p>
        </div>
        <a href="/admin/dashboard" class="btn btn-outline-secondary">Back to Dashboard</a>
    </div>
    <?php if ($success_message): ?><div class="alert alert-success" role="status"><?= htmlspecialchars($success_message, ENT_QUOTES, 'UTF-8') ?></div><?php endif; ?>
    <?php if ($error_message): ?><div class="alert alert-danger" role="alert"><?= htmlspecialchars($error_message, ENT_QUOTES, 'UTF-8') ?></div><?php endif; ?>
    <nav class="d-flex flex-wrap gap-2 mb-4" aria-label="Visibility sections">
        <?php foreach ($scopeLabels as $scope => $label): ?>
            <a class="btn btn-outline-primary btn-sm" href="#visibility-<?= htmlspecialchars($scope) ?>"><?= htmlspecialchars($label) ?></a>
        <?php endforeach; ?>
    </nav>
    <?php foreach ($scopeLabels as $scope => $label): ?>
    <section class="card border-0 shadow-sm mb-4" id="visibility-<?= htmlspecialchars($scope) ?>">
        <div class="card-body px-4 py-4">
            <h2 class="h4 mb-2"><?= htmlspecialchars($label) ?> Visibility</h2>
            <p class="text-muted small">
                <?= $scope === 'home'
                  ? 'Control the homepage sections directly.'
                  : 'These are default visibility settings; individual pages and records may override them using their own editor.' ?>
            </p>
            <form method="POST" action="/admin/site-visibility#visibility-<?= htmlspecialchars($scope) ?>">
                <input type="hidden" name="csrf" value="<?= htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8') ?>">
                <input type="hidden" name="scope" value="<?= htmlspecialchars($scope) ?>">
                <div class="row g-3 mb-4">
                <?php foreach (gocamp_visibility_options($scope) as $key => $option): ?>
                    <?php if (gocamp_gallery_disabled_by_policy($scope, $key)) continue; ?>
                    <?php $defaultValue = (bool)$option[1];
                          $shown = $scope === 'home'
                              ? gocamp_section_visible($site_settings, $key, $defaultValue)
                              : filter_var($site_settings['global_visibility'][$scope][$key] ?? $defaultValue, FILTER_VALIDATE_BOOLEAN);
                          $inputId = 'global-' . $scope . '-' . $key;
                          $inputName = $scope === 'home' ? 'section_visibility' : 'global_visibility';
                    ?>
                    <div class="col-md-6">
                        <div class="form-check form-switch border rounded p-3 ps-5 h-100">
                            <input type="hidden" name="<?= $inputName ?>[<?= htmlspecialchars($key) ?>]" value="0">
                            <input class="form-check-input" type="checkbox" role="switch" id="<?= htmlspecialchars($inputId) ?>"
                                name="<?= $inputName ?>[<?= htmlspecialchars($key) ?>]" value="1" <?= $shown ? 'checked' : '' ?>>
                            <label class="form-check-label" for="<?= htmlspecialchars($inputId) ?>"><?= htmlspecialchars($option[0], ENT_QUOTES, 'UTF-8') ?></label>
                        </div>
                    </div>
                <?php endforeach; ?>
                </div>
                <button class="btn btn-primary" type="submit"><i class="bi bi-save me-2"></i>Save <?= htmlspecialchars($label) ?> Visibility</button>
            </form>
        </div>
    </section>
    <?php endforeach; ?>
</div>
<?php require __DIR__ . '/includes/admin-footer.php'; ?>
