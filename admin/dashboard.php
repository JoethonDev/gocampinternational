<?php
/**
 * File: /admin/dashboard.php
 * ---
 * The main homepage for the admin panel.
 * Lists all "active" content and provides management links.
 */

// 1. AT THE VERY TOP: Check if user is logged in
require_once 'auth-check.php';

// 2. Load all site data
require_once __DIR__ . '/../data/destinations.php';
require_once __DIR__ . '/../data/programs.php';
$faqData = gc_external() ? gc_catalog('faq') : json_decode(file_get_contents(__DIR__ . '/../data/faq.json'), true);

// 3. Set Page Title and Include Header
$pageTitle = 'Dashboard';
require_once 'includes/admin-header.php';
?>

<div class="row gy-4">

    <?php if (isset($_GET['bulk-updated'])): ?>
    <div class="col-12"><div class="alert alert-success" role="status"><?= max(0, (int)$_GET['bulk-updated']) ?> item(s) updated.</div></div>
    <?php endif; ?>
    <div class="col-lg-6 animate-fade-in delay-1">
        <div class="card h-100 border-0 shadow-sm">
            <div class="card-header bg-transparent border-bottom-0 pt-4 pb-2 px-4 d-flex justify-content-between align-items-center">
                <div>
                    <h2 class="h4 mb-1 fw-bold">Destinations</h2>
                    <p class="text-muted small mb-0">Manage travel destinations</p>
                </div>
                <a href="/admin/edit-destination" class="btn btn-primary btn-sm rounded-pill px-3">
                    <i class="bi bi-plus-lg me-1"></i> Create
                </a>
            </div>
            <div class="card-body p-0">
                <div data-bulk-list data-bulk-form="bulkDestinationForm">
          <form id="bulkDestinationForm" method="POST" action="/admin/bulk-action" class="border-bottom px-3 py-3 d-flex flex-wrap gap-2 align-items-center">
            <input type="hidden" name="csrf" value="<?= htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8') ?>">
            <input type="hidden" name="type" value="destination">
            <label class="form-check d-flex gap-2 align-items-center mb-0 me-2">
                <input type="checkbox" class="form-check-input bulk-select-visible">
                <span class="form-check-label small">Select all</span>
            </label>
            <span class="bulk-selected-count small text-muted" aria-live="polite">0 selected</span>
            <label class="visually-hidden" for="bulkDestinationFormStatus">Bulk action</label>
            <select class="form-select form-select-sm" id="bulkDestinationFormStatus" name="status" required style="width:auto;max-width:200px;">
                <option value="">Choose action</option>
                <option value="active">Activate</option>
                <option value="coming-soon">Coming Soon</option>
                <option value="trash">Move to Trash</option>
            </select>
            <button type="submit" class="btn btn-primary btn-sm" disabled>Apply</button>
          </form>

                <div class="list-group list-group-flush">
                    <?php foreach ($destinations as $slug => $dest): ?>
                        <?php if ($dest['status'] !== 'trash'): ?>
                            <div data-bulk-row class="list-group-item border-0 px-4 py-3 d-flex justify-content-between align-items-center">
                                <div class="d-flex align-items-center">
                                    <label class="me-2 position-relative" style="z-index:3" aria-label="Select <?= htmlspecialchars($dest['name'], ENT_QUOTES, 'UTF-8') ?>">
                                        <input class="form-check-input bulk-item-select" type="checkbox" name="ids[]"
                                            form="bulkDestinationForm" value="<?= htmlspecialchars($slug, ENT_QUOTES, 'UTF-8') ?>">
                                    </label>
                                    <div class="icon-box bg-light text-primary rounded-circle me-3 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                        <i class="bi bi-geo-alt"></i>
                                    </div>
                                    <div>
                                        <a class="fw-bold text-decoration-none text-reset stretched-link" href="/admin/edit-destination?slug=<?= htmlspecialchars($slug) ?>">
                                            <?= htmlspecialchars($dest['name']) ?>
                                        </a>
                                        <div class="small text-muted">/destinations/<?= htmlspecialchars($slug) ?></div>
                                    </div>
                                </div>
                                <div class="d-flex gap-2 position-relative" style="z-index: 2;">
                                    <a href="/admin/edit-destination?slug=<?= htmlspecialchars($slug) ?>" class="btn btn-sm btn-light border rounded p-1" title="Edit"><i class="bi bi-pencil"></i></a>
                                    <a href="/admin/item-action?action=duplicate&type=dest&slug=<?= htmlspecialchars($slug) ?>&csrf=<?= urlencode(csrf_token()) ?>" class="btn btn-sm btn-light border rounded p-1" title="Duplicate"><i class="bi bi-files"></i></a>
                                    <a href="/admin/item-action?action=soft-delete&type=dest&slug=<?= htmlspecialchars($slug) ?>&csrf=<?= urlencode(csrf_token()) ?>" class="btn btn-sm btn-light border rounded p-1 text-danger" title="Delete"><i class="bi bi-trash"></i></a>
                                </div>
                            </div>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </div>
                </div>
            </div>
        </div>
    </div>

    <div class="col-lg-6 animate-fade-in delay-2">
        <div class="card h-100 border-0 shadow-sm">
            <div class="card-header bg-transparent border-bottom-0 pt-4 pb-2 px-4 d-flex justify-content-between align-items-center">
                <div>
                    <h2 class="h4 mb-1 fw-bold">Program Categories</h2>
                    <p class="text-muted small mb-0">Organize programs by type</p>
                </div>
                <a href="/admin/edit-program-category" class="btn btn-primary btn-sm rounded-pill px-3">
                    <i class="bi bi-plus-lg me-1"></i> Create
                </a>
            </div>
            <div class="card-body p-0">
                <div data-bulk-list data-bulk-form="bulkCategoryForm">
          <form id="bulkCategoryForm" method="POST" action="/admin/bulk-action" class="border-bottom px-3 py-3 d-flex flex-wrap gap-2 align-items-center">
            <input type="hidden" name="csrf" value="<?= htmlspecialchars(csrf_token(), ENT_QUOTES, 'UTF-8') ?>">
            <input type="hidden" name="type" value="category">
            <label class="form-check d-flex gap-2 align-items-center mb-0 me-2">
                <input type="checkbox" class="form-check-input bulk-select-visible">
                <span class="form-check-label small">Select all</span>
            </label>
            <span class="bulk-selected-count small text-muted" aria-live="polite">0 selected</span>
            <label class="visually-hidden" for="bulkCategoryFormStatus">Bulk action</label>
            <select class="form-select form-select-sm" id="bulkCategoryFormStatus" name="status" required style="width:auto;max-width:200px;">
                <option value="">Choose action</option>
                <option value="active">Activate</option>
                <option value="inactive">Deactivate</option>
                <option value="trash">Move to Trash</option>
            </select>
            <button type="submit" class="btn btn-primary btn-sm" disabled>Apply</button>
          </form>

                <div class="list-group list-group-flush">
                    <?php foreach ($programs as $slug => $prog): ?>
                        <?php if ($prog['status'] !== 'trash'): ?>
                            <div data-bulk-row class="list-group-item border-0 px-4 py-3 d-flex justify-content-between align-items-center">
                                <div class="d-flex align-items-center">
                                    <label class="me-2 position-relative" style="z-index:3" aria-label="Select <?= htmlspecialchars($prog['name'], ENT_QUOTES, 'UTF-8') ?>">
                                        <input class="form-check-input bulk-item-select" type="checkbox" name="ids[]"
                                            form="bulkCategoryForm" value="<?= htmlspecialchars($slug, ENT_QUOTES, 'UTF-8') ?>">
                                    </label>
                                    <div class="icon-box bg-light text-success rounded-circle me-3 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                        <i class="bi bi-tags"></i>
                                    </div>
                                    <div>
                                        <a class="fw-bold text-decoration-none text-reset stretched-link" href="/admin/edit-program-category?slug=<?= htmlspecialchars($slug) ?>">
                                            <?= htmlspecialchars($prog['name']) ?>
                                        </a>
                                        <div class="small text-muted">/programs/<?= htmlspecialchars($slug) ?></div>
                                    </div>
                                </div>
                                <div class="d-flex gap-2 position-relative" style="z-index: 2;">
                                    <a href="/admin/edit-program-category?slug=<?= htmlspecialchars($slug) ?>" class="btn btn-sm btn-light border rounded p-1" title="Edit"><i class="bi bi-pencil"></i></a>
                                    <a href="/admin/item-action?action=duplicate&type=prog&slug=<?= htmlspecialchars($slug) ?>&csrf=<?= urlencode(csrf_token()) ?>" class="btn btn-sm btn-light border rounded p-1" title="Duplicate"><i class="bi bi-files"></i></a>
                                    <a href="/admin/item-action?action=soft-delete&type=prog&slug=<?= htmlspecialchars($slug) ?>&csrf=<?= urlencode(csrf_token()) ?>" class="btn btn-sm btn-light border rounded p-1 text-danger" title="Delete"><i class="bi bi-trash"></i></a>
                                </div>
                            </div>
                        <?php endif; ?>
                    <?php endforeach; ?>
                </div>
                </div>
            </div>
        </div>
    </div>
    
    <div class="col-12 animate-fade-in delay-3">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-transparent border-bottom-0 pt-4 pb-2 px-4">
                <h2 class="h4 mb-1 fw-bold">Global Content</h2>
                <p class="text-muted small mb-0">Manage site-wide settings and content</p>
            </div>
            <div class="card-body p-0">
                <div class="list-group list-group-flush">
                    <a href="/admin/media-library" class="list-group-item list-group-item-action border-0 px-4 py-3 d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <div class="icon-box bg-light text-primary rounded-circle me-3 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                <i class="bi bi-images"></i>
                            </div>
                            <div>
                                <span class="fw-bold">Image Library</span>
                                <div class="small text-muted">Browse and rename photos while keeping content references updated</div>
                            </div>
                        </div>
                        <i class="bi bi-chevron-right text-muted"></i>
                    </a>
                    <a href="/admin/memories" class="list-group-item list-group-item-action border-0 px-4 py-3">
                        <span class="fw-bold">Go Campers Memories</span>
                        <div class="small text-muted">Manage slider photos, captions, order and visibility</div>
                    </a>
                    <a href="/admin/edit-faq" class="list-group-item list-group-item-action border-0 px-4 py-3 d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center">
                            <div class="icon-box bg-light text-info rounded-circle me-3 d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;">
                                <i class="bi bi-question-circle"></i>
                            </div>
                            <div>
                                <span class="fw-bold">Global FAQs</span>
                                <div class="small text-muted">Manage frequently asked questions</div>
                            </div>
                        </div>
                        <span class="badge bg-secondary rounded-pill"><?= count($faqData) ?> items</span>
                    </a>
                </div>
            </div>
        </div>
    </div>
    
</div>
<script src="/admin/includes/bulk-select.js" defer></script>
<?php
// 3. Include Footer
require_once 'includes/admin-footer.php';
?>
