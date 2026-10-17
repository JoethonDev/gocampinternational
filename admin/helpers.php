<?php
/**
 * File: /admin/helpers.php
 * ---
 * Contains reusable helper functions for the admin panel.
 *
 * --- NEW (Phase 4) ---
 * - Added handle_image_upload() function.
 */

// We must include this for auth-check.php to work in item-action.php
require_once __DIR__ . '/../init.php';

/**
 * Returns the current session CSRF token, generating one if missing.
 *
 * @return string
 */
function csrf_token() {
    if (empty($_SESSION['csrf'])) {
        $_SESSION['csrf'] = bin2hex(random_bytes(32));
    }
    return (string)$_SESSION['csrf'];
}

/**
 * Timing-safe CSRF token comparison.
 *
 * @param mixed $token Token supplied with the request.
 * @return bool
 */
function csrf_check($token) {
    if (!is_string($token) || empty($_SESSION['csrf']) || !is_string($_SESSION['csrf'])) {
        return false;
    }
    return hash_equals((string)$_SESSION['csrf'], $token);
}

/**
 * Enforces POST requests; sends 405 otherwise.
 *
 * @return void
 */
function require_post() {
    if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'POST') {
        http_response_code(405);
        header('Allow: POST');
        exit('Method Not Allowed');
    }
}

/**
 * Re-encodes an image upload as compressed WebP (max 1920px, quality 82).
 * Strips EXIF, downsizes large photos. Returns true on success.
 * Falls back gracefully when GD/WebP is unavailable.
 *
 * @param string $src_tmp  Path to the uploaded temp file.
 * @param string $dest_webp Full destination path (must end .webp).
 * @param string $real_mime Verified MIME from finfo.
 * @return bool
 */
function compress_to_webp($src_tmp, $dest_webp, $real_mime, $max_dim = 1920, $quality = 82) {
    if (!function_exists('imagewebp')) {
        return false;
    }
    switch ($real_mime) {
        case 'image/jpeg': $img = @imagecreatefromjpeg($src_tmp); break;
        case 'image/png': $img = @imagecreatefrompng($src_tmp); break;
        case 'image/webp': $img = @imagecreatefromwebp($src_tmp); break;
        default: return false; // GIFs keep original (preserve animation)
    }
    if ($img === false) {
        return false;
    }
    $w = imagesx($img);
    $h = imagesy($img);
    if ($w <= 0 || $h <= 0) {
        imagedestroy($img);
        return false;
    }
    if (max($w, $h) > $max_dim) {
        $ratio = $max_dim / max($w, $h);
        $nw = max(1, (int)($w * $ratio));
        $nh = max(1, (int)($h * $ratio));
        $resized = imagecreatetruecolor($nw, $nh);
        imagealphablending($resized, false);
        imagesavealpha($resized, true);
        imagecopyresampled($resized, $img, 0, 0, 0, 0, $nw, $nh, $w, $h);
        imagedestroy($img);
        $img = $resized;
    } elseif ($real_mime === 'image/png' || $real_mime === 'image/webp') {
        imagealphablending($img, false);
        imagesavealpha($img, true);
    }
    $ok = @imagewebp($img, $dest_webp, $quality);
    imagedestroy($img);
    return (bool)$ok;
}

/**
 * Handles a file upload, validates it, and moves it to the /uploads directory.
 *
 * @param string $file_input_name The 'name' attribute of the <input type="file">.
 * @param string $current_image_path The path of the image currently saved (from the hidden field).
 * @return string The path to the new file, or the $current_image_path if no new file was uploaded.
 */
function handle_image_upload($file_input_name, $current_image_path) {
    // Check if a new file was actually uploaded
    if (isset($_FILES[$file_input_name]) && $_FILES[$file_input_name]['error'] === UPLOAD_ERR_OK) {

        $file = $_FILES[$file_input_name];
        $tmp_name = $file['tmp_name'];
        $size = $file['size'];

        // --- Size cap: 5MB ---
        if ($size > 5 * 1024 * 1024) {
            return $current_image_path;
        }

        // --- Verify real MIME via finfo (never trust client type) ---
        $allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        if ($finfo === false) {
            return $current_image_path;
        }
        $real = finfo_file($finfo, $tmp_name);
        finfo_close($finfo);
        if (!in_array($real, $allowed_types, true)) {
            return $current_image_path;
        }

        // --- Image content must parse ---
        if (@getimagesize($tmp_name) === false) {
            return $current_image_path;
        }

        // --- Extension allowlist (lowercased), block executables ---
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        $allowed_ext = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
        $blocked_ext = ['php', 'phtml', 'phar', 'htaccess', 'cgi', 'pl'];
        if (!in_array($ext, $allowed_ext, true) || in_array($ext, $blocked_ext, true)) {
            return $current_image_path;
        }

        // --- Generate Safe, Unique, Randomized Filename (always .webp, except GIF) ---
        $safe_base = preg_replace('/[^a-z0-9_-]/i', '_', pathinfo($file['name'], PATHINFO_FILENAME));
        $safe_base = substr($safe_base !== '' ? $safe_base : 'upload', 0, 50);
        $out_ext = ($real === 'image/gif') ? 'gif' : 'webp';
        try {
            $rand = bin2hex(random_bytes(8));
        } catch (Exception $e) {
            $rand = uniqid();
        }
        $new_filename = $safe_base . '_' . $rand . '.' . $out_ext;

        // --- Define Upload Path (ensure dir exists) ---
        // __DIR__ is /admin, so we go up one, then into /uploads/
        $upload_dir = __DIR__ . '/../uploads/';
        if (!is_dir($upload_dir)) {
            if (!mkdir($upload_dir, 0755, true)) {
                return $current_image_path;
            }
        }
        $upload_path = $upload_dir . $new_filename;
        $counter = 1;
        while (file_exists($upload_path)) {
            try {
                $rand = bin2hex(random_bytes(8));
            } catch (Exception $e) {
                $rand = uniqid() . $counter;
            }
            $new_filename = $safe_base . '_' . $rand . '.' . $out_ext;
            $upload_path = $upload_dir . $new_filename;
            $counter++;
            if ($counter > 50) {
                return $current_image_path;
            }
        }

        // --- Compress to WebP (except GIF); fallback to original on failure ---
        if ($out_ext === 'webp' && compress_to_webp($tmp_name, $upload_path, $real)) {
            return '/uploads/' . $new_filename;
        }

        // --- Move the File (GIF path, or WebP-unavailable fallback) ---
        if ($out_ext !== 'webp') {
            if (move_uploaded_file($tmp_name, $upload_path)) {
                // Success! Return the *public* path for the database.
                return '/uploads/' . $new_filename;
            }
            return $current_image_path;
        }
        // WebP conversion failed: store original extension instead.
        $new_filename = $safe_base . '_' . $rand . '.' . $ext;
        $upload_path = $upload_dir . $new_filename;
        if (move_uploaded_file($tmp_name, $upload_path)) {
            // Success! Return the *public* path for the database.
            return '/uploads/' . $new_filename;
        } else {
            // Failed to move file (check permissions on /uploads/)
            return $current_image_path;
        }
    }

    // No new file was uploaded, so just return the existing path.
    return $current_image_path;
}


/**
 * Safely writes a PHP array to a .php file using var_export and file locking.
 *
 * @param string $filepath Full path to the target .php file.
 * @param string $variable_name The name of the variable to write (e.g., "destinations").
 * @param array $data_array The PHP array to save.
 * @return bool True on success, false on failure.
 */
function save_php_file($filepath, $variable_name, $data_array) {
    // Re-build the PHP file content
    $php_code = "<?php\n/**\n * This file is auto-generated by the Go Camp Admin Panel.\n * Do not edit this file manually.\n */\n\n";
    $php_code .= "\$" . $variable_name . " = " . var_export($data_array, true) . ";\n";

    // Atomic write: temp file + flock + rename (avoids truncate-then-lock race)
    $tmp_path = $filepath . '.tmp.' . uniqid('', true);
    $file_handle = fopen($tmp_path, 'w');
    if (!$file_handle) {
        return false; // Could not open temp file
    }

    if (flock($file_handle, LOCK_EX)) {
        fwrite($file_handle, $php_code);
        fflush($file_handle);
        flock($file_handle, LOCK_UN);
        fclose($file_handle);
        // Atomic replace
        if (!rename($tmp_path, $filepath)) {
            @unlink($tmp_path);
            return false;
        }
        return true;
    }

    fclose($file_handle);
    @unlink($tmp_path);
    return false; // Could not get lock
}

/**
 * Safely writes a PHP array to a .json file using json_encode and file locking.
 *
 * @param string $filepath Full path to the target .json file.
 * @param array $data_array The PHP array to save.
 * @return bool True on success, false on failure.
 */
function save_json_file($filepath, $data_array) {
    // Convert array to formatted JSON
    $json_string = json_encode($data_array, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);
    if ($json_string === false) {
        return false;
    }

    // Atomic write: temp file + flock + rename (avoids truncate-then-lock race)
    $tmp_path = $filepath . '.tmp.' . uniqid('', true);
    $file_handle = fopen($tmp_path, 'w');
    if (!$file_handle) {
        return false; // Could not open temp file
    }

    if (flock($file_handle, LOCK_EX)) {
        fwrite($file_handle, $json_string);
        fflush($file_handle);
        flock($file_handle, LOCK_UN);
        fclose($file_handle);
        // Atomic replace
        if (!rename($tmp_path, $filepath)) {
            @unlink($tmp_path);
            return false;
        }
        return true;
    }

    fclose($file_handle);
    @unlink($tmp_path);
    return false; // Could not get lock
}

/**
 * Generates a unique slug for a new item (e.g., "italy-copy-1", "italy-copy-2").
 *
 * @param string $base_slug The starting slug (e.g., "italy-copy").
 * @param array $existing_keys The array of existing slugs to check against.
 * @return string A unique slug.
 */
function generate_unique_slug($base_slug, $existing_keys) {
    if (!in_array($base_slug, $existing_keys)) {
        return $base_slug;
    }

    $counter = 1;
    while (in_array($base_slug . '-' . $counter, $existing_keys)) {
        $counter++;
    }
    return $base_slug . '-' . $counter;
}
?>