<?php
/**
 * File: /admin/item-action.php
 * ---
 * --- MODIFIED (Phase 7) ---
 * - Added 'master_prog' type to handle all_programs.php.
 */

// 1. AT THE VERY TOP: Check if user is logged in
require_once 'helpers.php';
require_once 'auth-check.php';

// 2. Get and validate parameters
$action = $_GET['action'] ?? null;
$type = $_GET['type'] ?? null;
$slug = $_GET['slug'] ?? null; // 'slug' is used as the key (even if it's an 'id')

if (!$action || !$type || !$slug) {
    header('Location: /admin/dashboard'); // Invalid request
    exit;
}

// 3. Define file paths and variable names
$file_path = '';
$variable_name = '';
$data = [];
$redirect_to = 'dashboard.php'; 

if ($type === 'dest') {
    $file_path = __DIR__ . '/../data/destinations.php';
    $variable_name = 'destinations';
    require $file_path;
    $data = $destinations;
} elseif ($type === 'prog') {
    $file_path = __DIR__ . '/../data/programs.php';
    $variable_name = 'programs';
    require $file_path;
    $data = $programs;
} 
// --- NEW (Phase 7) ---
elseif ($type === 'master_prog') {
    $file_path = __DIR__ . '/../data/all_programs.php';
    $variable_name = 'all_programs';
    require $file_path;
    $data = $all_programs;
    $redirect_to = 'programs.php'; // Redirect to the program list
}
// --- END NEW ---
else {
    header('Location: /admin/dashboard'); // Invalid type
    exit;
}

// 4. Perform the action
switch ($action) {
    case 'duplicate':
        if (!isset($data[$slug])) break;
        
        $original_data = $data[$slug];
        
        // --- MODIFIED (Phase 7) ---
        if ($type === 'master_prog') {
            $new_slug_base = $slug . '-copy';
            $new_slug = generate_unique_slug($new_slug_base, array_keys($data));
            $new_data = $original_data;
            $new_data['id'] = $new_slug; // Master programs use 'id' as key
            $new_data['name'] = $original_data['name'] . ' (Copy)';
            $new_data['status'] = 'active';
        } else {
            // Logic for 'dest' and 'prog'
            $new_slug_base = $slug . '-copy';
            $new_slug = generate_unique_slug($new_slug_base, array_keys($data));
            $new_data = $original_data;
            $new_data['slug'] = $new_slug;
            $new_data['name'] = $original_data['name'] . ' (Copy)';
            $new_data['status'] = 'active';
            if ($type === 'dest' && isset($original_data['program_ids'])) {
                $new_data['program_ids'] = $original_data['program_ids'];
            }
        }
        // --- END MODIFICATION ---
        
        $data[$new_slug] = $new_data;
        save_php_file($file_path, $variable_name, $data);
        break;

    case 'soft-delete':
        if (!isset($data[$slug])) break;
        $data[$slug]['status'] = 'trash';
        save_php_file($file_path, $variable_name, $data);
        break;

    case 'restore':
        if (!isset($data[$slug])) break;
        $data[$slug]['status'] = 'active'; 
        save_php_file($file_path, $variable_name, $data);
        $redirect_to = 'trash.php'; // Always redirect to trash page
        break;

    case 'perm-delete':
        if (!isset($data[$slug])) break;
        unset($data[$slug]);
        save_php_file($file_path, $variable_name, $data);
        $redirect_to = 'trash.php'; // Always redirect to trash page
        break;
}

// 5. Redirect back
header("Location: $redirect_to");
exit;
?>