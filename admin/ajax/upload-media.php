<?php
/**
 * File: /admin/ajax/upload-media.php
 * ---
 * Handles file uploads from the media modal via AJAX.
 * Supports multiple file uploads.
 */
require_once __DIR__ . '/../auth-check.php'; // Basic security

header('Content-Type: application/json');
if (gc_external()) {
    $files=$_FILES['media_file'] ?? null;
    $results=[];
    if (!$files) { http_response_code(400); echo json_encode(['success'=>false,'message'=>'No file received']); exit; }
    $names=is_array($files['name'])?$files['name']:[$files['name']];
    foreach ($names as $i=>$name) {
        $get=static fn($key)=>is_array($files[$key])?$files[$key][$i]:$files[$key];
        try {
            if ($get('error')!==UPLOAD_ERR_OK) throw new RuntimeException('Upload failed');
            $mime=(new finfo(FILEINFO_MIME_TYPE))->file($get('tmp_name'));
            $image=gc_media_upload($get('tmp_name'),$name,$mime);
            $results[]=['success'=>true,'message'=>'Uploaded to Tigris','file'=>['name'=>$image['name'],'url'=>$image['url']]];
        } catch (Throwable $e) {
            error_log('Tigris media upload failed: '.$e->getMessage());
            $results[]=['success'=>false,'message'=>'Unable to store image','name'=>$name];
        }
    }
    $complete=count(array_filter($results,static fn($r)=>!$r['success']))===0;
    http_response_code($complete?200:422);
    echo json_encode(['success'=>$complete,'results'=>$results]);exit;
}


$response = ['success' => false, 'message' => 'An unknown error occurred.'];
$upload_dir_path = __DIR__ . '/../../images';
$upload_dir_url = '/images';

function processFileUpload($name, $type, $tmp_name, $error, $size, $allowed_types, $upload_dir_path, $upload_dir_url) {
    if ($error !== UPLOAD_ERR_OK) {
        return [
            'success' => false,
            'message' => 'Upload error for file: ' . htmlspecialchars($name),
            'name' => $name
        ];
    }

    // --- Size cap: 5MB ---
    if ($size > 5 * 1024 * 1024) {
        return [
            'success' => false,
            'message' => 'File too large (max 5MB): ' . htmlspecialchars($name),
            'name' => $name
        ];
    }

    // --- Verify real MIME via finfo (never trust client $type) ---
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    if ($finfo === false) {
        return ['success' => false, 'message' => 'Server error: cannot verify file type.', 'name' => $name];
    }
    $real = finfo_file($finfo, $tmp_name);
    finfo_close($finfo);
    if (!in_array($real, $allowed_types, true)) {
        return [
            'success' => false,
            'message' => 'Invalid file type for ' . htmlspecialchars($name) . '. Only JPG, PNG, GIF, WEBP allowed.',
            'name' => $name
        ];
    }

    // --- Image content must parse ---
    if (@getimagesize($tmp_name) === false) {
        return [
            'success' => false,
            'message' => 'Invalid image content for ' . htmlspecialchars($name) . '.',
            'name' => $name
        ];
    }

    // --- Extension allowlist (lowercased), block executables ---
    $ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
    $allowed_ext = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    $blocked_ext = ['php', 'phtml', 'phar', 'htaccess', 'cgi', 'pl'];
    if (!in_array($ext, $allowed_ext, true) || in_array($ext, $blocked_ext, true)) {
        return [
            'success' => false,
            'message' => 'Invalid file extension for ' . htmlspecialchars($name) . '.',
            'name' => $name
        ];
    }

    // --- Randomized filename: safe_base + '_' + random 8 bytes hex (always .webp, except GIF) ---
    $safe_base = preg_replace('/[^a-z0-9_-]/i', '_', pathinfo($name, PATHINFO_FILENAME));
    $safe_base = substr($safe_base !== '' ? $safe_base : 'upload', 0, 50);
    $out_ext = ($real === 'image/gif') ? 'gif' : 'webp';
    try {
        $rand = bin2hex(random_bytes(8));
    } catch (Exception $e) {
        $rand = uniqid();
    }
    $final_filename = $safe_base . '_' . $rand . '.' . $out_ext;
    $upload_path = $upload_dir_path . '/' . $final_filename;
    $counter = 1;
    while (file_exists($upload_path)) {
        try {
            $rand = bin2hex(random_bytes(8));
        } catch (Exception $e) {
            $rand = uniqid() . $counter;
        }
        $final_filename = $safe_base . '_' . $rand . '.' . $out_ext;
        $upload_path = $upload_dir_path . '/' . $final_filename;
        $counter++;
        if ($counter > 50) {
            return ['success' => false, 'message' => 'Could not generate unique filename.', 'name' => $name];
        }
    }

    // --- Compress to WebP (except GIF preserves animation); fallback to original ---
    if ($out_ext === 'webp' && function_exists('compress_to_webp') && compress_to_webp($tmp_name, $upload_path, $real)) {
        return [
            'success' => true,
            'message' => 'File uploaded successfully!',
            'file' => [
                'name' => $final_filename,
                'url' => $upload_dir_url . '/' . $final_filename
            ]
        ];
    }
    if ($out_ext !== 'webp') {
        if (move_uploaded_file($tmp_name, $upload_path)) {
            return [
                'success' => true,
                'message' => 'File uploaded successfully!',
                'file' => [
                    'name' => $final_filename,
                    'url' => $upload_dir_url . '/' . $final_filename
                ]
            ];
        }
        return [
            'success' => false,
            'message' => 'Failed to move uploaded file: ' . htmlspecialchars($name) . '. Check server permissions.',
            'name' => $name
        ];
    }
    // WebP conversion failed: store original extension instead.
    $final_filename = $safe_base . '_' . $rand . '.' . $ext;
    $upload_path = $upload_dir_path . '/' . $final_filename;

    if (move_uploaded_file($tmp_name, $upload_path)) {
        return [
            'success' => true,
            'message' => 'File uploaded successfully!',
            'file' => [
                'name' => $final_filename,
                'url' => $upload_dir_url . '/' . $final_filename
            ]
        ];
    } else {
        return [
            'success' => false,
            'message' => 'Failed to move uploaded file: ' . htmlspecialchars($name) . '. Check server permissions.',
            'name' => $name
        ];
    }
}

// Support multiple uploads
if (isset($_FILES['media_file'])) {
    $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $files = $_FILES['media_file'];
    $results = [];

    // Handle both single and multiple file uploads
    if (is_array($files['name'])) {
        // Multiple files
        $file_count = count($files['name']);
        for ($i = 0; $i < $file_count; $i++) {
            $name = $files['name'][$i];
            $type = $files['type'][$i];
            $tmp_name = $files['tmp_name'][$i];
            $error = $files['error'][$i];
            $size = $files['size'][$i];

            $result = processFileUpload($name, $type, $tmp_name, $error, $size, $allowed_types, $upload_dir_path, $upload_dir_url);
            $results[] = $result;
        }
    } else {
        // Single file
        $result = processFileUpload($files['name'], $files['type'], $files['tmp_name'], $files['error'], $files['size'], $allowed_types, $upload_dir_path, $upload_dir_url);
        $results[] = $result;
    }

    $response = [
        'success' => true,
        'results' => $results
    ];
} else {
    $response['message'] = 'No file received.';
}

echo json_encode($response);
exit;
