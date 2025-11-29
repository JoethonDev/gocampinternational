<?php
/**
 * File: /admin/trash.php
 * ---
 * --- MODIFIED (Phase 7) ---
 * - Added new section to show trashed Master Programs from all_programs.php.
 */

// 1. AT THE VERY TOP: Check if user is logged in
require_once 'auth-check.php';

// 2. Load all site data
require_once __DIR__ . '/../data/destinations.php';
require_once __DIR__ . '/../data/programs.php';
require_once __DIR__ . '/../data/all_programs.php'; // <-- NEW

// 3. Set Page Title and Include Header
$pageTitle = 'Trash';
require_once 'includes/admin-header.php';
?>

<div class="container-fluid py-4 animate-fade-in">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <a href="/admin/dashboard.php" class="text-decoration-none text-secondary mb-2 d-inline-block">
                <i class="bi bi-arrow-left"></i> Back to Dashboard
            </a>
            <h1 class="h3 mb-0 fw-bold text-gray-800">Trash Can</h1>
            <p class="text-muted mb-0">Items in the trash are hidden from the public site but can be restored.</p>
        </div>
        <button class="btn btn-outline-danger" onclick="return confirm('Emptying trash is not implemented yet, but you can delete items individually.');">
            <i class="bi bi-trash"></i> Empty Trash
        </button>
    </div>

    <div class="row g-4">
        <!-- Master Programs Trash -->
        <div class="col-12">
            <div class="card border-0 shadow-sm">
                <div class="card-header bg-transparent border-0 pt-4 pb-2 px-4">
                    <h5 class="card-title fw-bold text-danger mb-0"><i class="bi bi-journal-x me-2"></i>Trashed Master Programs</h5>
                </div>
                <div class="card-body p-4">
                    <div class="list-group list-group-flush rounded-3 border">
                        <?php
                        $trash_count = 0;
                        foreach ($all_programs as $id => $prog):
                            if ($prog['status'] === 'trash'):
                                $trash_count++;
                        ?>
                            <div class="list-group-item d-flex justify-content-between align-items-center p-3">
                                <div>
                                    <h6 class="mb-0 fw-bold"><?= htmlspecialchars($prog['name']) ?></h6>
                                    <small class="text-muted">ID: <?= htmlspecialchars($id) ?></small>
                                </div>
                                <div class="btn-group">
                                    <a href="/admin/item-action?action=restore&type=master_prog&slug=<?= htmlspecialchars($id) ?>" class="btn btn-outline-success btn-sm" title="Restore">
                                        <i class="bi bi-arrow-counterclockwise"></i> Restore
                                    </a>
                                    <a href="/admin/item-action?action=perm-delete&type=master_prog&slug=<?= htmlspecialchars($id) ?>" 
                                       class="btn btn-outline-danger btn-sm"
                                       onclick="return confirm('Are you sure you want to PERMANENTLY DELETE this item? This cannot be undone.');"
                                       title="Delete Permanently">
                                        <i class="bi bi-x-lg"></i>
                                    </a>
                                </div>
                            </div>
                        <?php
                            endif;
                        endforeach;
                        if ($trash_count === 0) {
                            echo '<div class="text-center py-4 text-muted"><i class="bi bi-check-circle display-6 d-block mb-2 opacity-25"></i>No master programs in trash.</div>';
                        }
                        ?>
                    </div>
                </div>
            </div>
        </div>

        <!-- Destinations Trash -->
        <div class="col-md-6">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-header bg-transparent border-0 pt-4 pb-2 px-4">
                    <h5 class="card-title fw-bold text-danger mb-0"><i class="bi bi-geo-alt me-2"></i>Trashed Destinations</h5>
                </div>
                <div class="card-body p-4">
                    <div class="list-group list-group-flush rounded-3 border">
                        <?php
                        $trash_count = 0;
                        foreach ($destinations as $slug => $dest):
                            if ($dest['status'] === 'trash'):
                                $trash_count++;
                        ?>
                            <div class="list-group-item d-flex justify-content-between align-items-center p-3">
                                <span class="fw-medium"><?= htmlspecialchars($dest['name']) ?></span>
                                <div class="btn-group">
                                    <a href="/admin/item-action?action=restore&type=dest&slug=<?= htmlspecialchars($slug) ?>" class="btn btn-outline-success btn-sm">
                                        <i class="bi bi-arrow-counterclockwise"></i>
                                    </a>
                                    <a href="/admin/item-action?action=perm-delete&type=dest&slug=<?= htmlspecialchars($slug) ?>" 
                                       class="btn btn-outline-danger btn-sm"
                                       onclick="return confirm('Are you sure you want to PERMANENTLY DELETE this item? This cannot be undone.');">
                                        <i class="bi bi-x-lg"></i>
                                    </a>
                                </div>
                            </div>
                        <?php
                            endif;
                        endforeach;
                        if ($trash_count === 0) {
                            echo '<div class="text-center py-4 text-muted"><i class="bi bi-check-circle display-6 d-block mb-2 opacity-25"></i>No destinations in trash.</div>';
                        }
                        ?>
                    </div>
                </div>
            </div>
        </div>

        <!-- Program Categories Trash -->
        <div class="col-md-6">
            <div class="card border-0 shadow-sm h-100">
                <div class="card-header bg-transparent border-0 pt-4 pb-2 px-4">
                    <h5 class="card-title fw-bold text-danger mb-0"><i class="bi bi-tags me-2"></i>Trashed Categories</h5>
                </div>
                <div class="card-body p-4">
                    <div class="list-group list-group-flush rounded-3 border">
                        <?php
                        $trash_count = 0;
                        foreach ($programs as $slug => $prog):
                            if ($prog['status'] === 'trash'):
                                $trash_count++;
                        ?>
                            <div class="list-group-item d-flex justify-content-between align-items-center p-3">
                                <span class="fw-medium"><?= htmlspecialchars($prog['name']) ?></span>
                                <div class="btn-group">
                                    <a href="/admin/item-action?action=restore&type=prog&slug=<?= htmlspecialchars($slug) ?>" class="btn btn-outline-success btn-sm">
                                        <i class="bi bi-arrow-counterclockwise"></i>
                                    </a>
                                    <a href="/admin/item-action?action=perm-delete&type=prog&slug=<?= htmlspecialchars($slug) ?>" 
                                       class="btn btn-outline-danger btn-sm"
                                       onclick="return confirm('Are you sure you want to PERMANENTLY DELETE this item? This cannot be undone.');">
                                        <i class="bi bi-x-lg"></i>
                                    </a>
                                </div>
                            </div>
                        <?php
                            endif;
                        endforeach;
                        if ($trash_count === 0) {
                            echo '<div class="text-center py-4 text-muted"><i class="bi bi-check-circle display-6 d-block mb-2 opacity-25"></i>No categories in trash.</div>';
                        }
                        ?>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<?php
// 3. Include Footer
require_once 'includes/admin-footer.php';
?>