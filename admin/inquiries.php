<?php
require_once 'auth-check.php';
$pageTitle = 'Inquiries';
require_once 'includes/admin-header.php';

$dir = __DIR__ . '/../data/inquiries/';
$inquiries = [];
if (is_dir($dir)) {
    $files = glob($dir . '*.json');
    foreach ($files as $file) {
        $data = json_decode(file_get_contents($file), true);
        if ($data) {
            $data['filename'] = basename($file);
            $inquiries[] = $data;
        }
    }
}

// Sort by timestamp desc
usort($inquiries, function($a, $b) {
    return $b['timestamp'] - $a['timestamp'];
});

// Pagination Logic
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$perPage = 10;
$totalItems = count($inquiries);
$totalPages = ceil($totalItems / $perPage);
$offset = ($page - 1) * $perPage;

// Slice the array for current page
$displayInquiries = array_slice($inquiries, $offset, $perPage);
?>

<div class="card border-0 shadow-sm animate-fade-in">
    <div class="card-header bg-transparent border-bottom-0 pt-4 pb-2 px-4">
        <h2 class="h4 mb-1 fw-bold">Inquiries & Leads</h2>
        <p class="text-muted small mb-0">View messages from contact forms and booking requests</p>
    </div>
    <div class="card-body p-0">
        <div class="table-responsive">
            <table class="table table-hover align-middle mb-0">
                <thead class="bg-light">
                    <tr>
                        <th class="px-4 py-3">Date</th>
                        <th class="px-4 py-3">Type</th>
                        <th class="px-4 py-3">Name</th>
                        <th class="px-4 py-3">Email</th>
                        <th class="px-4 py-3">Action</th>
                        <th class="px-4 py-3">Status</th>
                    </tr>
                </thead>
                <tbody>
                    <?php if (empty($displayInquiries)): ?>
                        <tr>
                            <td colspan="6" class="text-center py-5 text-muted">No inquiries found.</td>
                        </tr>
                    <?php else: ?>
                        <?php foreach ($displayInquiries as $inquiry): ?>
                            <tr onclick="window.location.href='/admin/view-inquiry.php?file=<?= urlencode($inquiry['filename']) ?>';" style="cursor: pointer;">
                                <td class="px-4 text-nowrap"><?= htmlspecialchars($inquiry['date']) ?></td>
                                <td class="px-4">
                                    <span class="badge bg-<?= $inquiry['type'] === 'booking' ? 'success' : ($inquiry['type'] === 'landing' ? 'info' : 'primary') ?>">
                                        <?= ucfirst(htmlspecialchars($inquiry['type'])) ?>
                                    </span>
                                </td>
                                <td class="px-4 fw-bold"><?= htmlspecialchars($inquiry['data']['name'] ?? 'N/A') ?></td>
                                <td class="px-4"><?= htmlspecialchars($inquiry['data']['email'] ?? 'N/A') ?></td>
                                <td class="px-4">
                                    <a href="/admin/view-inquiry.php?file=<?= urlencode($inquiry['filename']) ?>" class="btn btn-sm btn-outline-primary">
                                        View Details
                                    </a>
                                </td>
                                <td class="px-4">
                                    <span class="badge bg-<?= $inquiry['status'] === 'new' ? 'warning' : 'secondary' ?>"><?= htmlspecialchars($inquiry['status']) ?></span>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    <?php endif; ?>
                </tbody>
            </table>
        </div>
    </div>
    
    <!-- Pagination Controls -->
    <?php if ($totalPages > 1): ?>
    <div class="card-footer bg-transparent border-top-0 py-3">
        <nav aria-label="Inquiries pagination">
            <ul class="pagination justify-content-center mb-0">
                <li class="page-item <?= ($page <= 1) ? 'disabled' : '' ?>">
                    <a class="page-link" href="?page=<?= $page - 1 ?>" tabindex="-1">Previous</a>
                </li>
                
                <?php for ($i = 1; $i <= $totalPages; $i++): ?>
                    <li class="page-item <?= ($page == $i) ? 'active' : '' ?>">
                        <a class="page-link" href="?page=<?= $i ?>"><?= $i ?></a>
                    </li>
                <?php endfor; ?>
                
                <li class="page-item <?= ($page >= $totalPages) ? 'disabled' : '' ?>">
                    <a class="page-link" href="?page=<?= $page + 1 ?>">Next</a>
                </li>
            </ul>
        </nav>
    </div>
    <?php endif; ?>
</div>

<?php require_once 'includes/admin-footer.php'; ?>
