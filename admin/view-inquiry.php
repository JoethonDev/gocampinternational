<?php
/**
 * File: /admin/view-inquiry.php
 * View details of a specific inquiry/lead.
 */

require_once 'auth-check.php';

$filename = filter_input(INPUT_GET, 'file', FILTER_SANITIZE_FULL_SPECIAL_CHARS);
$dir = __DIR__ . '/../data/inquiries/';
$filePath = $dir . basename($filename);

if (!$filename || !file_exists($filePath)) {
    // Redirect or show error
    header('Location: /admin/inquiries.php');
    exit;
}

$inquiry = json_decode(file_get_contents($filePath), true);
if (!$inquiry) {
    die('Error decoding inquiry data.');
}

// Mark as read if status is new (optional feature for later, but good to have structure)
if (isset($inquiry['status']) && $inquiry['status'] === 'new') {
    $inquiry['status'] = 'read';
    file_put_contents($filePath, json_encode($inquiry, JSON_PRETTY_PRINT));
}

$pageTitle = 'View Inquiry';
require_once 'includes/admin-header.php';
?>

<div class="container py-5 animate-fade-in">
    <!-- Header Section -->
    <div class="row mb-4 align-items-center">
        <div class="col">
            <nav aria-label="breadcrumb" class="mb-2">
                <a href="/admin/inquiries.php" class="text-decoration-none text-muted small hover-primary">
                    <i class="bi bi-arrow-left me-1"></i> Back to Inquiries
                </a>
            </nav>
            <h1 class="h2 fw-bold mb-0">Inquiry Details</h1>
        </div>
        <div class="col-auto">
            <div class="d-flex gap-3">
                <a href="mailto:<?= htmlspecialchars($inquiry['data']['email'] ?? '') ?>" class="btn btn-primary px-4 d-inline-flex align-items-center">
                    <i class="bi bi-reply-fill me-2"></i> Reply via Email
                </a>
                <button class="btn btn-light border text-danger d-inline-flex align-items-center" onclick="if(confirm('Delete this inquiry?')) { window.location.href='/admin/item-action.php?action=delete-inquiry&file=<?= urlencode($filename) ?>'; }" title="Delete Inquiry">
                    <i class="bi bi-trash me-2"></i> Delete
                </button>
            </div>
        </div>
    </div>

    <div class="row g-4">
        <!-- Main Details -->
        <div class="col-lg-8">
            <div class="card border-0 shadow-sm mb-4 overflow-hidden">
                <div class="card-header bg-body border-bottom py-3 px-4">
                    <h5 class="card-title mb-0 fw-bold text-primary"><i class="bi bi-person-lines-fill me-2"></i>Submission Data</h5>
                </div>
                <div class="card-body p-4">
                    <div class="row g-4">
                        <?php 
                        // Define fields to exclude from the main list or handle specially
                        $exclude = ['source', 'message', 'name', 'email', 'phone', 'subject'];
                        
                        // Helper function for rows
                        function renderDetailRow($label, $value, $isBadge = false) {
                            echo '<div class="col-sm-6 col-md-4 text-muted small text-uppercase fw-bold">' . $label . '</div>';
                            echo '<div class="col-sm-6 col-md-8 mb-3">';
                            if ($isBadge) {
                                echo '<span class="badge bg-light text-dark border">' . $value . '</span>';
                            } else {
                                echo '<span class="fw-medium">' . $value . '</span>';
                            }
                            echo '</div>';
                            echo '<div class="col-12 d-block d-sm-none mb-2"></div>'; // Spacer for mobile
                        }

                        // Standard Fields
                        renderDetailRow('Name', htmlspecialchars($inquiry['data']['name'] ?? 'N/A'));
                        renderDetailRow('Email', htmlspecialchars($inquiry['data']['email'] ?? 'N/A'));

                        if (!empty($inquiry['data']['phone'])) {
                            renderDetailRow('Phone', htmlspecialchars($inquiry['data']['phone']));
                        }
                        if (!empty($inquiry['data']['subject'])) {
                            renderDetailRow('Subject', htmlspecialchars($inquiry['data']['subject']));
                        }
                        if (!empty($inquiry['data']['source'])) {
                            renderDetailRow('Source', htmlspecialchars($inquiry['data']['source']), true);
                        }

                        // Dynamic Fields
                        foreach ($inquiry['data'] as $key => $value) {
                            if (in_array($key, $exclude)) continue;
                            
                            $label = ucwords(str_replace(['_', '-'], ' ', $key));
                            $displayValue = is_array($value) ? implode(', ', array_map('htmlspecialchars', $value)) : htmlspecialchars($value);
                            
                            renderDetailRow($label, $displayValue);
                        }
                        ?>
                    </div>
                </div>
            </div>

            <?php if (!empty($inquiry['data']['message'])): ?>
            <div class="card border-0 shadow-sm overflow-hidden">
                <div class="card-header bg-body border-bottom py-3 px-4">
                    <h5 class="card-title mb-0 fw-bold text-primary"><i class="bi bi-chat-quote-fill me-2"></i>Message Content</h5>
                </div>
                <div class="card-body p-4">
                    <div class="p-4 rounded-3 border bg-light bg-opacity-10">
                        <p class="mb-0 lead fs-6" style="white-space: pre-wrap; font-family: inherit; line-height: 1.6;"><?= htmlspecialchars($inquiry['data']['message']) ?></p>
                    </div>
                </div>
            </div>
            <?php endif; ?>
        </div>

        <!-- Sidebar / Meta Info -->
        <div class="col-lg-4">
            <div class="card border-0 shadow-sm sticky-top" style="top: 90px; z-index: 1;">
                <div class="card-header bg-body border-bottom py-3 px-4">
                    <h5 class="card-title mb-0 fw-bold text-primary"><i class="bi bi-info-circle-fill me-2"></i>Meta Information</h5>
                </div>
                <div class="card-body p-4">
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item bg-transparent px-0 pt-0">
                            <small class="text-muted d-block text-uppercase fw-bold mb-1" style="font-size: 0.75rem;">Date Received</small>
                            <div class="d-flex align-items-center">
                                <i class="bi bi-calendar3 me-2 text-muted"></i>
                                <strong><?= htmlspecialchars($inquiry['date']) ?></strong>
                            </div>
                        </li>
                        <li class="list-group-item bg-transparent px-0">
                            <small class="text-muted d-block text-uppercase fw-bold mb-1" style="font-size: 0.75rem;">Type</small>
                            <span class="badge bg-<?= $inquiry['type'] === 'booking' ? 'success' : ($inquiry['type'] === 'landing' ? 'info' : 'primary') ?> rounded-pill px-3 py-2">
                                <?= ucfirst(htmlspecialchars($inquiry['type'])) ?>
                            </span>
                        </li>
                        <li class="list-group-item bg-transparent px-0">
                            <small class="text-muted d-block text-uppercase fw-bold mb-1" style="font-size: 0.75rem;">Status</small>
                            <span class="badge bg-<?= $inquiry['status'] === 'new' ? 'warning' : 'secondary' ?> rounded-pill px-3 py-2">
                                <?= ucfirst(htmlspecialchars($inquiry['status'])) ?>
                            </span>
                        </li>
                        <li class="list-group-item bg-transparent px-0 pb-0">
                            <small class="text-muted d-block text-uppercase fw-bold mb-1" style="font-size: 0.75rem;">Reference ID</small>
                            <code class="text-muted bg-light px-2 py-1 rounded d-block text-truncate" title="<?= htmlspecialchars($inquiry['id']) ?>"><?= htmlspecialchars($inquiry['id']) ?></code>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    </div>
</div>

<?php require_once 'includes/admin-footer.php'; ?>
