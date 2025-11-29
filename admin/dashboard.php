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
$faqData = json_decode(file_get_contents(__DIR__ . '/../data/faq.json'), true);

// 3. Set Page Title and Include Header
$pageTitle = 'Dashboard';
require_once 'includes/admin-header.php';
?>

<div class="row gy-4">

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
                <div class="list-group list-group-flush">
                    <?php foreach ($destinations as $slug => $dest): ?>
                        <?php if ($dest['status'] !== 'trash'): ?>
                            <div class="list-group-item border-0 px-4 py-3 d-flex justify-content-between align-items-center">
                                <div class="d-flex align-items-center">
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
                                    <a href="/admin/item-action?action=duplicate&type=dest&slug=<?= htmlspecialchars($slug) ?>" class="btn btn-sm btn-light border rounded p-1" title="Duplicate"><i class="bi bi-files"></i></a>
                                    <a href="/admin/item-action?action=soft-delete&type=dest&slug=<?= htmlspecialchars($slug) ?>" class="btn btn-sm btn-light border rounded p-1 text-danger" title="Delete"><i class="bi bi-trash"></i></a>
                                </div>
                            </div>
                        <?php endif; ?>
                    <?php endforeach; ?>
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
                <div class="list-group list-group-flush">
                    <?php foreach ($programs as $slug => $prog): ?>
                        <?php if ($prog['status'] !== 'trash'): ?>
                            <div class="list-group-item border-0 px-4 py-3 d-flex justify-content-between align-items-center">
                                <div class="d-flex align-items-center">
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
                                    <a href="/admin/item-action?action=duplicate&type=prog&slug=<?= htmlspecialchars($slug) ?>" class="btn btn-sm btn-light border rounded p-1" title="Duplicate"><i class="bi bi-files"></i></a>
                                    <a href="/admin/item-action?action=soft-delete&type=prog&slug=<?= htmlspecialchars($slug) ?>" class="btn btn-sm btn-light border rounded p-1 text-danger" title="Delete"><i class="bi bi-trash"></i></a>
                                </div>
                            </div>
                        <?php endif; ?>
                    <?php endforeach; ?>
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
<?php
// 3. Include Footer
require_once 'includes/admin-footer.php';
?>