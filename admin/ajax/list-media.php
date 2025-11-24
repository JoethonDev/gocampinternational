<?php
/**
 * File: /admin/ajax/list-media.php
 * ---
 * Scans the /uploads directory and returns a JSON list of image files.
 */
require_once __DIR__ . '/../auth-check.php'; // Basic security

header('Content-Type: application/json');

$upload_dir_path = __DIR__ . '/../../images';
$upload_dir_url = '/images'; // Public URL base path

$files = [];
$allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

if (is_dir($upload_dir_path)) {
    // scandir is simple, glob is often better for filtering
    $items = scandir($upload_dir_path);
    
    foreach ($items as $item) {
        // Ignore . and .. directories, and non-files
        if ($item === '.' || $item === '..' || !is_file($upload_dir_path . '/' . $item)) {
            continue;
        }
        
        $extension = strtolower(pathinfo($item, PATHINFO_EXTENSION));
        
        if (in_array($extension, $allowed_extensions)) {
            $files[] = [
                'name' => $item,
                'url' => $upload_dir_url . '/' . $item,
                // Optional: Add more info like size or date modified
                // 'size' => filesize($upload_dir_path . '/' . $item),
                // 'modified' => filemtime($upload_dir_path . '/' . $item)
            ];
        }
    }
    // Optional: Sort files, e.g., by modification date descending
    // usort($files, function($a, $b) { return $b['modified'] <=> $a['modified']; });

} else {
    // Directory doesn't exist - return error? For now, empty list.
}

echo json_encode(['success' => true, 'files' => $files]);
exit;
?>