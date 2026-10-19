<?php
require_once __DIR__ . '/auth-check.php';
require_once __DIR__ . '/../includes/camp-memories.php';
$settingsFile = __DIR__ . '/../data/camp_memories.php';
$config = gocamp_load_memories();
$error_message = '';
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    try {
        if (!csrf_check($_POST['csrf'] ?? '')) throw new InvalidArgumentException('Invalid CSRF token. Reload and retry.');
        if (!is_string($_POST['revision'] ?? null) || !hash_equals(hash_file('sha256', $settingsFile), $_POST['revision'])) {
            throw new InvalidArgumentException('Memories were changed in another editor. Reload before saving.');
        }
        $updated = gocamp_validate_memories($_POST);
        if (!save_php_file($settingsFile, 'camp_memories', $updated)) throw new RuntimeException('Unable to save. Check write permissions on data/.');
        header('Location: /admin/memories?saved=1');
        exit;
    } catch (InvalidArgumentException | RuntimeException $error) {
        $error_message = $error->getMessage();
        $rows = is_array($_POST['memories'] ?? null) ? array_values($_POST['memories']) : [];
        $rows = array_map(static function ($row) {
            $row = is_array($row) ? $row : [];
            $row['is_active'] = ($row['is_active'] ?? '') === '1';
            $row['in_slider'] = ($row['in_slider'] ?? '') === '1';
            return $row;
        }, $rows);
        $config = ['title' => $_POST['title'] ?? '', 'show_facebook' => ($_POST['show_facebook'] ?? '') === '1', 'items' => $rows];
    }
}
function memory_escape($value) { return htmlspecialchars(is_string($value) ? $value : '', ENT_QUOTES, 'UTF-8'); }
function memory_editor_card($index, $item) {
    $item = is_array($item) ? $item : [];
    $image = is_string($item['image'] ?? null) ? $item['image'] : '';
    $filename = gocamp_memory_image($image);
    if ($filename !== false) $image = '/images/' . $filename;
    ?>
    <div class="card mb-3" data-memory-row>
        <div class="card-body">
            <div class="row g-3">
                <div class="col-md-4">
                    <div class="border rounded p-3">
                        <button type="button" class="btn btn-outline-primary w-100 mb-2" data-bs-toggle="media-modal" data-bs-target-input="memory-image-<?= $index ?>">Choose / upload photo</button>
                        <input type="text" readonly required class="form-control form-control-sm" id="memory-image-<?= $index ?>" name="memories[<?= $index ?>][image]" value="<?= memory_escape($image) ?>" placeholder="No photo selected" aria-label="Memory image">
                    </div>
                </div>
                <div class="col-md-8">
                    <label class="form-label" for="memory-caption-<?= $index ?>">Caption</label>
                    <textarea class="form-control mb-2" id="memory-caption-<?= $index ?>" name="memories[<?= $index ?>][caption]" rows="2" maxlength="1000" required><?= memory_escape($item['caption'] ?? '') ?></textarea>
                    <label for="memory-country-<?= $index ?>" class="form-label">Country</label>
                    <input class="form-control mb-2" id="memory-country-<?= $index ?>" name="memories[<?= $index ?>][country]" value="<?= memory_escape($item['country'] ?? '') ?>" list="memory-countries" maxlength="80" placeholder="Leave blank if unknown">
                    <label class="form-check mb-2"><input type="checkbox" class="form-check-input" name="memories[<?= $index ?>][is_active]" value="1" <?= ($item['is_active'] ?? true) ? 'checked' : '' ?>> Show on website</label>
                    <label class="form-check mb-3"><input type="checkbox" class="form-check-input" name="memories[<?= $index ?>][in_slider]" value="1" <?= ($item['in_slider'] ?? true) ? 'checked' : '' ?>> Also show in memories slider</label>
                    <div class="d-flex flex-wrap gap-2">
                        <button type="button" class="btn btn-sm btn-outline-secondary" data-memory-action="up" aria-label="Move memory earlier">&uarr; Move earlier</button>
                        <button type="button" class="btn btn-sm btn-outline-secondary" data-memory-action="down" aria-label="Move memory later">&darr; Move later</button>
                        <button type="button" class="btn btn-sm btn-outline-danger" data-memory-action="remove">Remove memory</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    <?php
}
$pageTitle = 'Go Campers Memories';
require __DIR__ . '/includes/admin-header.php';
?>
<h1 class="h3">Go Campers Memories</h1>
<p>Manage the country gallery and shared memories slider. Photos without a country appear under More camp moments. Removing a memory keeps its photo in the media library. Changes take effect after saving.</p>
<datalist id="memory-countries"><option value="Germany"><option value="Italy"><option value="Switzerland"><option value="United Kingdom"></datalist>
<?php if (isset($_GET['saved'])): ?><div class="alert alert-success" role="status">Memories saved.</div><?php endif; ?>
<?php if ($error_message): ?><div class="alert alert-danger" role="alert"><?= memory_escape($error_message) ?></div><?php endif; ?>
<form method="post" action="/admin/memories" id="memories-editor">
    <input type="hidden" name="csrf" value="<?= memory_escape(csrf_token()) ?>">
    <input type="hidden" name="revision" value="<?= memory_escape(is_string($_POST['revision'] ?? null) ? $_POST['revision'] : hash_file('sha256', $settingsFile)) ?>">
    <label for="memories-title" class="form-label">Section heading</label>
    <input id="memories-title" class="form-control mb-3" name="title" value="<?= memory_escape($config['title']) ?>" maxlength="240" required>
    <label class="form-check mb-4"><input type="checkbox" class="form-check-input" name="show_facebook" value="1" <?= !empty($config['show_facebook']) ? 'checked' : '' ?>> Show Facebook panel alongside the slider</label>
    <div id="memory-rows">
        <?php foreach ($config['items'] as $index => $item) memory_editor_card($index, $item); ?>
    </div>
    <div class="d-flex gap-2 flex-wrap">
        <button type="button" id="add-memory" class="btn btn-outline-primary">Add memory</button>
        <button type="submit" class="btn btn-primary">Save memories</button>
        <a class="btn btn-outline-secondary" href="/" target="_blank" rel="noopener">Preview website</a>
        <a class="btn btn-outline-secondary" href="/gallery" target="_blank" rel="noopener">Preview gallery</a>
    </div>
</form>
<template id="memory-template"><?php memory_editor_card('__INDEX__', ['is_active' => true]); ?></template>
<script src="/admin/js/memories-editor.js" defer></script>
<?php require __DIR__ . '/includes/admin-footer.php'; ?>
