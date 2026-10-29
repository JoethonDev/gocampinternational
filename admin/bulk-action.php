<?php
declare(strict_types=1);
require_once __DIR__ . '/auth-check.php';
require_once __DIR__ . '/helpers.php';
require_once __DIR__ . '/includes/bulk-operations.php';

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
    http_response_code(405);
    header('Allow: POST');
    exit('Method not allowed.');
}
if (!csrf_check($_POST['csrf'] ?? '')) {
    http_response_code(403);
    exit('Invalid CSRF token.');
}
$type = $_POST['type'] ?? '';
$status = $_POST['status'] ?? '';
$ids = $_POST['ids'] ?? [];
$config = [
    'program' => ['all_programs.php', 'all_programs', '/admin/programs.php'],
    'destination' => ['destinations.php', 'destinations', '/admin/dashboard'],
    'category' => ['programs.php', 'programs', '/admin/dashboard'],
];
if (!is_string($type) || !isset($config[$type]) || !is_string($status)
    || !is_array($ids)) {
    http_response_code(400);
    exit('Invalid request.');
}
[$filename, $variable, $returnTo] = $config[$type];
$dataFile = __DIR__ . '/../data/' . $filename;
require $dataFile;
$records = $$variable ?? null;
try {
    if (!is_array($records)) throw new RuntimeException('Catalog unavailable.');
    [$updated, $count] = gocamp_bulk_status($records, $type, $status, $ids);
    if ($count > 0 && !save_php_file($dataFile, $variable, $updated)) {
        throw new RuntimeException('Could not save changes.');
    }
} catch (InvalidArgumentException $error) {
    http_response_code(400);
    exit(htmlspecialchars($error->getMessage(), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8'));
} catch (RuntimeException $error) {
    http_response_code(500);
    error_log('GoCamp bulk operation failed: ' . $error->getMessage());
    exit('Bulk update failed. Check server permissions.');
}
header('Location: ' . $returnTo . '?bulk-updated=' . $count, true, 303);
exit;
