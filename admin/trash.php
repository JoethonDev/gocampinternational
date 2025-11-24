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

<style>
html, body {
    height: 100%;
}
body {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}
#main-content {
    flex: 1 0 auto;
}
.admin-footer {
    flex-shrink: 0;
}
</style>

<div id="main-content" style="max-width:100%;padding:0 2vw;">
    <h1 class="h3 mb-2 mt-4">Trash</h1>
    <p class="text-muted mb-4">Items in the trash are hidden from the public site but can be restored.</p>

    <h2 class="h4">Trashed Master Programs</h2>
    <div class="list-group mb-4">
        <?php
        $trash_count = 0;
        foreach ($all_programs as $id => $prog):
            if ($prog['status'] === 'trash'):
                $trash_count++;
        ?>
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <span><?= htmlspecialchars($prog['name']) ?> <small class="text-muted">(ID: <?= htmlspecialchars($id) ?>)</small></span>
                <div>
                    <a href="/admin/item-action?action=restore&type=master_prog&slug=<?= htmlspecialchars($id) ?>" class="btn btn-outline-secondary btn-sm">
                        <i class="bi bi-arrow-counterclockwise"></i> Restore
                    </a>
                    <a href="/admin/item-action?action=perm-delete&type=master_prog&slug=<?= htmlspecialchars($id) ?>" 
                       class="btn btn-danger btn-sm"
                       onclick="return confirm('Are you sure you want to PERMANENTLY DELETE this item? This cannot be undone.');">
                        <i class="bi bi-x-octagon"></i> Delete Permanently
                    </a>
                </div>
            </div>
        <?php
            endif;
        endforeach;
        if ($trash_count === 0) {
            echo '<p class="text-muted fst-italic">No master programs in the trash.</p>';
        }
        ?>
    </div>
    <h2 class="h4">Trashed Destinations</h2>
    <div class="list-group mb-4">
        <?php
        $trash_count = 0;
        foreach ($destinations as $slug => $dest):
            if ($dest['status'] === 'trash'):
                $trash_count++;
        ?>
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <span><?= htmlspecialchars($dest['name']) ?></span>
                <div>
                    <a href="/admin/item-action?action=restore&type=dest&slug=<?= htmlspecialchars($slug) ?>" class="btn btn-outline-secondary btn-sm">
                        <i class="bi bi-arrow-counterclockwise"></i> Restore
                    </a>
                    <a href="/admin/item-action?action=perm-delete&type=dest&slug=<?= htmlspecialchars($slug) ?>" 
                       class="btn btn-danger btn-sm"
                       onclick="return confirm('Are you sure you want to PERMANENTLY DELETE this item? This cannot be undone.');">
                        <i class="bi bi-x-octagon"></i> Delete Permanently
                    </a>
                </div>
            </div>
        <?php
            endif;
        endforeach;
        if ($trash_count === 0) {
            echo '<p class="text-muted fst-italic">No destinations in the trash.</p>';
        }
        ?>
    </div>

    <h2 class="h4">Trashed Program Categories</h2>
    <div class="list-group mb-5">
        <?php
        $trash_count = 0;
        foreach ($programs as $slug => $prog):
            if ($prog['status'] === 'trash'):
                $trash_count++;
        ?>
            <div class="list-group-item d-flex justify-content-between align-items-center">
                <span><?= htmlspecialchars($prog['name']) ?></span>
                <div>
                    <a href="/admin/item-action?action=restore&type=prog&slug=<?= htmlspecialchars($slug) ?>" class="btn btn-outline-secondary btn-sm">
                        <i class="bi bi-arrow-counterclockwise"></i> Restore
                    </a>
                    <a href="/admin/item-action?action=perm-delete&type=prog&slug=<?= htmlspecialchars($slug) ?>" 
                       class="btn btn-danger btn-sm"
                       onclick="return confirm('Are you sure you want to PERMANENTLY DELETE this item? This cannot be undone.');">
                        <i class="bi bi-x-octagon"></i> Delete Permanently
                    </a>
                </div>
            </div>
        <?php
            endif;
        endforeach;
        if ($trash_count === 0) {
            echo '<p class="text-muted fst-italic">No program categories in the trash.</p>';
        }
        ?>
    </div>
</div>
<?php
// 3. Include Footer
?><div class="admin-footer"><?php require_once 'includes/admin-footer.php'; ?></div>