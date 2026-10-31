<?php
/**
 * Admin image library: preview all available uploads and rename images safely.
 */
require_once __DIR__ . '/auth-check.php';
require_once __DIR__ . '/media-library-helpers.php';

$siteRoot = dirname(__DIR__);
if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'POST') {
    require_post();
    if (!csrf_check($_POST['csrf'] ?? null)) {
        $result = ['success' => false, 'message' => 'Invalid security token. Reload the page and try again.'];
    } else {
        $result = gocamp_media_rename(
            $siteRoot,
            is_string($_POST['old_path'] ?? null) ? $_POST['old_path'] : '',
            is_string($_POST['new_name'] ?? null) ? trim($_POST['new_name']) : ''
        );
    }
    $_SESSION['media_library_notice'] = $result;
    header('Location: /admin/media-library', true, 303);
    exit;
}

$notice = $_SESSION['media_library_notice'] ?? null;
unset($_SESSION['media_library_notice']);
$images = gocamp_media_list($siteRoot);
$filter = (string)($_GET['folder'] ?? 'all');
if (!in_array($filter, ['all', 'images', 'uploads'], true)) {
    $filter = 'all';
}
$query = trim((string)($_GET['q'] ?? ''));
if ($filter !== 'all') {
    $images = array_values(array_filter($images, static fn(array $file): bool => $file['folder'] === $filter));
}
if ($query !== '') {
    $images = array_values(array_filter($images, static fn(array $file): bool => stripos($file['name'], $query) !== false));
}

$totalImages = count($images);
$perPage = 24;
$totalPages = max(1, (int)ceil($totalImages / $perPage));
$page = max(1, (int)($_GET['page'] ?? 1));
$page = min($page, $totalPages);
$offset = ($page - 1) * $perPage;
$images = array_slice($images, $offset, $perPage);

function media_library_page_url(int $targetPage, string $filter, string $query): string {
    $params = ['page' => $targetPage];
    if ($filter !== 'all') $params['folder'] = $filter;
    if ($query !== '') $params['q'] = $query;
    return '/admin/media-library?' . http_build_query($params);
}

$pageTitle = 'Image Library';
require_once __DIR__ . '/includes/admin-header.php';
?>

<div class="d-flex flex-wrap justify-content-between gap-3 align-items-center mb-4">
    <div>
        <h1 class="h2 fw-bold mb-1"><i class="bi bi-images me-2"></i>Image Library</h1>
        <p class="text-muted mb-0">View uploaded and site images, then rename them without breaking saved program or destination references.</p>
    </div>
    <span class="badge bg-secondary rounded-pill fs-6"><?= $totalImages ?> images</span>
</div>

<?php if ($notice): ?>
<div class="alert <?= !empty($notice['success']) ? 'alert-success' : 'alert-danger' ?>" role="alert">
    <?= htmlspecialchars((string)$notice['message'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>
    <?php if (!empty($notice['success']) && !empty($notice['files'])): ?>
        <div class="small mt-1">Updated files: <?= htmlspecialchars(implode(', ', $notice['files']), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></div>
    <?php endif; ?>
</div>
<?php endif; ?>

<div class="alert alert-info border-0">
    <?php if (gc_external()): ?>Renaming changes the image display name in PostgreSQL. The object key and all URLs stay unchanged, so existing references remain valid.<?php else: ?>Renaming updates local data references, and is blocked for hardcoded template references.<?php endif; ?>
</div>

<form method="GET" action="/admin/media-library" class="row g-2 mb-4" role="search">
    <div class="col-md-6">
        <label for="image-search" class="form-label">Find image</label>
        <input id="image-search" class="form-control" type="search" name="q" value="<?= htmlspecialchars($query, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>" placeholder="Search filenames">
    </div>
    <div class="col-md-3">
        <label for="image-folder" class="form-label">Folder</label>
        <select id="image-folder" class="form-select" name="folder">
            <option value="all" <?= $filter === 'all' ? 'selected' : '' ?>>All images</option>
            <option value="images" <?= $filter === 'images' ? 'selected' : '' ?>>/images</option>
            <option value="uploads" <?= $filter === 'uploads' ? 'selected' : '' ?>>/uploads</option>
        </select>
    </div>
    <div class="col-md-3 d-flex align-items-end">
        <button class="btn btn-primary w-100" type="submit"><i class="bi bi-search me-1"></i>Search</button>
    </div>
</form>

<?php if (!$images): ?>
    <div class="alert alert-light border">No images match the current filters.</div>
<?php else: ?>
<div class="row g-3">
    <?php foreach ($images as $image): ?>
        <?php
        try {
            $uses = gocamp_media_data_usage($siteRoot, $image['path']);
            $useCount = array_sum($uses);
        } catch (Throwable $error) {
            error_log('GoCamp image library usage: ' . $error->getMessage());
            $uses = [];
            $useCount = null;
        }
        $ext = strtolower(pathinfo($image['name'], PATHINFO_EXTENSION));
        ?>
        <div class="col-12 col-sm-6 col-lg-4 col-xl-3">
            <article class="card border-0 shadow-sm h-100">
                <a href="<?= htmlspecialchars($image['url'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>" target="_blank" rel="noopener" aria-label="Open <?= htmlspecialchars($image['name'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>">
                    <img src="<?= htmlspecialchars($image['url'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>" alt="<?= htmlspecialchars($image['name'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>" loading="lazy" class="w-100 rounded-top" style="height: 165px; object-fit: contain; background: #eef0f2;">
                </a>
                <div class="card-body d-flex flex-column">
                    <p class="fw-bold small mb-1 text-break"><?= htmlspecialchars($image['name'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></p>
                    <div class="small text-muted text-break mb-2">
                        <?= htmlspecialchars($image['folder'], ENT_QUOTES, 'UTF-8') ?> · <?= number_format($image['size'] / 1024, 1) ?> KB
                    </div>
                    <?php if ($useCount !== null): ?>
                        <details class="mb-3">
                            <summary class="small"><?= $useCount ?> saved reference<?= $useCount === 1 ? '' : 's' ?></summary>
                            <?php if ($uses): ?>
                                <ul class="small ps-3 mt-2">
                                <?php foreach ($uses as $path => $count): ?>
                                    <li class="text-break"><?= htmlspecialchars($path, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?> (<?= $count ?>)</li>
                                <?php endforeach; ?>
                                </ul>
                            <?php else: ?>
                                <p class="small text-muted mt-2 mb-0">No references in data files.</p>
                            <?php endif; ?>
                        </details>
                    <?php else: ?>
                        <p class="small text-warning">Reference count unavailable</p>
                    <?php endif; ?>
                    <form method="POST" action="/admin/media-library" class="mt-auto media-rename-form">
                        <input type="hidden" name="csrf" value="<?= htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8') ?>">
                        <input type="hidden" name="old_path" value="<?= htmlspecialchars($image['path'], ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>">
                        <label class="form-label small fw-bold" for="rename-<?= md5($image['path']) ?>">Rename to</label>
                        <div class="input-group input-group-sm mb-2">
                            <input class="form-control" id="rename-<?= md5($image['path']) ?>" type="text" name="new_name" minlength="1" maxlength="100" pattern="[a-zA-Z0-9][a-zA-Z0-9_-]*" placeholder="new-image-name" required aria-label="New image filename without extension">
                            <span class="input-group-text">.<?= htmlspecialchars($ext) ?></span>
                        </div>
                        <button type="submit" class="btn btn-outline-primary btn-sm w-100">
                            <i class="bi bi-pencil-square me-1"></i>Rename image
                        </button>
                    </form>
                </div>
            </article>
        </div>
    <?php endforeach; ?>
</div>

<?php if ($totalPages > 1): ?>
<nav class="mt-4" aria-label="Image library pages">
    <ul class="pagination justify-content-center flex-wrap">
        <li class="page-item <?= $page <= 1 ? 'disabled' : '' ?>">
            <a class="page-link" href="<?= htmlspecialchars(media_library_page_url(max(1, $page - 1), $filter, $query), ENT_QUOTES, 'UTF-8') ?>" aria-label="Previous page">&laquo;</a>
        </li>
        <?php
        $startPage = max(1, $page - 2);
        $endPage = min($totalPages, $page + 2);
        if ($startPage > 1): ?>
            <li class="page-item"><a class="page-link" href="<?= htmlspecialchars(media_library_page_url(1, $filter, $query), ENT_QUOTES, 'UTF-8') ?>">1</a></li>
            <?php if ($startPage > 2): ?><li class="page-item disabled"><span class="page-link">&hellip;</span></li><?php endif; ?>
        <?php endif; ?>
        <?php for ($p = $startPage; $p <= $endPage; $p++): ?>
            <li class="page-item <?= $p === $page ? 'active' : '' ?>">
                <a class="page-link" href="<?= htmlspecialchars(media_library_page_url($p, $filter, $query), ENT_QUOTES, 'UTF-8') ?>" <?= $p === $page ? 'aria-current="page"' : '' ?>><?= $p ?></a>
            </li>
        <?php endfor; ?>
        <?php if ($endPage < $totalPages): ?>
            <?php if ($endPage < $totalPages - 1): ?><li class="page-item disabled"><span class="page-link">&hellip;</span></li><?php endif; ?>
            <li class="page-item"><a class="page-link" href="<?= htmlspecialchars(media_library_page_url($totalPages, $filter, $query), ENT_QUOTES, 'UTF-8') ?>"><?= $totalPages ?></a></li>
        <?php endif; ?>
        <li class="page-item <?= $page >= $totalPages ? 'disabled' : '' ?>">
            <a class="page-link" href="<?= htmlspecialchars(media_library_page_url(min($totalPages, $page + 1), $filter, $query), ENT_QUOTES, 'UTF-8') ?>" aria-label="Next page">&raquo;</a>
        </li>
    </ul>
    <p class="text-center text-muted small">Page <?= $page ?> of <?= $totalPages ?> · showing <?= count($images) ?> of <?= $totalImages ?> images</p>
</nav>
<?php endif; ?>
<?php endif; ?>

<script>
document.querySelectorAll('.media-rename-form').forEach(form => {
    form.addEventListener('submit', event => {
        const oldPath = form.elements.old_path.value;
        const newName = form.elements.new_name.value.trim();
        if (!window.confirm('Rename ' + oldPath + ' to ' + newName + '? All saved data references will be updated.')) {
            event.preventDefault();
        }
    });
});
</script>

<?php require_once __DIR__ . '/includes/admin-footer.php'; ?>
