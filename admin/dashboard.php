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

    <div class="col-lg-6">
        <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h1 class="h3 mb-0">Destinations</h1>
                <a href="/admin/edit-destination" class="btn btn-primary btn-sm">
                    <i class="bi bi-plus-lg"></i> Create New
                </a>
            </div>
            <div class="list-group list-group-flush">
                <?php foreach ($destinations as $slug => $dest): ?>
                    <?php if ($dest['status'] !== 'trash'): ?>
                        <div class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <a class="fw-bold text-decoration-none" href="/admin/edit-destination?slug=<?= htmlspecialchars($slug) ?>">
                                    <?= htmlspecialchars($dest['name']) ?>
                                </a>
                                <br>
                                <small class="text-muted">/destinations/<?= htmlspecialchars($slug) ?></small>
                            </div>
                            <div class="dropdown">
                                <button class="btn btn-light btn-sm" type="button" id="dropdown-dest-<?= htmlspecialchars($slug) ?>" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="bi bi-three-dots-vertical"></i>
                                </button>
                                <ul class="dropdown-menu" aria-labelledby="dropdown-dest-<?= htmlspecialchars($slug) ?>">
                                    <li><a class="dropdown-item" href="/admin/edit-destination?slug=<?= htmlspecialchars($slug) ?>">Edit</a></li>
                                    <li><a class="dropdown-item" href="/admin/item-action?action=duplicate&type=dest&slug=<?= htmlspecialchars($slug) ?>">Duplicate</a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li>
                                        <a class="dropdown-item text-danger" href="/admin/item-action?action=soft-delete&type=dest&slug=<?= htmlspecialchars($slug) ?>">Delete</a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    <?php endif; ?>
                <?php endforeach; ?>
            </div>
        </div>
    </div>

    <div class="col-lg-6">
        <div class="card h-100">
            <div class="card-header d-flex justify-content-between align-items-center">
                <h1 class="h3 mb-0">Program Categories</h1>
                <a href="/admin/edit-program-category" class="btn btn-primary btn-sm">
                    <i class="bi bi-plus-lg"></i> Create New
                </a>
            </div>
            <div class="list-group list-group-flush">
                <?php foreach ($programs as $slug => $prog): ?>
                    <?php if ($prog['status'] !== 'trash'): ?>
                        <div class="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <a class="fw-bold text-decoration-none" href="/admin/edit-program-category?slug=<?= htmlspecialchars($slug) ?>">
                                    <?= htmlspecialchars($prog['name']) ?>
                                </a>
                                <br>
                                <small class="text-muted">/programs/<?= htmlspecialchars($slug) ?></small>
                            </div>
                            <div class="dropdown">
                                <button class="btn btn-light btn-sm" type="button" id="dropdown-prog-<?= htmlspecialchars($slug) ?>" data-bs-toggle="dropdown" aria-expanded="false">
                                    <i class="bi bi-three-dots-vertical"></i>
                                </button>
                                <ul class="dropdown-menu" aria-labelledby="dropdown-prog-<?= htmlspecialchars($slug) ?>">
                                    <li><a class="dropdown-item" href="/admin/edit-program-category?slug=<?= htmlspecialchars($slug) ?>">Edit</a></li>
                                    <li><a class="dropdown-item" href="/admin/item-action?action=duplicate&type=prog&slug=<?= htmlspecialchars($slug) ?>">Duplicate</a></li>
                                    <li><hr class="dropdown-divider"></li>
                                    <li>
                                        <a class="dropdown-item text-danger" href="/admin/item-action?action=soft-delete&type=prog&slug=<?= htmlspecialchars($slug) ?>">Delete</a>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    <?php endif; ?>
                <?php endforeach; ?>
            </div>
        </div>
    </div>
    
    <div class="col-12">
        <div class="card">
            <div class="card-header">
                <h1 class="h3 mb-0">Global Content</h1>
            </div>
            <div class="list-group list-group-flush">
                <a href="/admin/edit-faq" class="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                    Global FAQs
                    <span class="badge bg-secondary rounded-pill"><?= count($faqData) ?> items</span>
                </a>
            </div>
        </div>
    </div>
    
</div>
<?php
// 3. Include Footer
require_once 'includes/admin-footer.php';
?>