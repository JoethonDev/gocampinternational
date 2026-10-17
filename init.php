<?php
/**
 * File: /init.php
 * This file handles global initialization tasks.
 * - Starts the session for form validation or future user login.
 * - Defines a base URL constant for consistent asset linking.
 */

// Start the session with secure cookie params if it's not already started.
if (session_status() == PHP_SESSION_NONE) {
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'httponly' => true,
        'samesite' => 'Lax',
        'secure' => !empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off',
    ]);
    session_start();
}

// Idle timeout: log out admins idle for more than 30 minutes.
if (!empty($_SESSION['is_admin']) && $_SESSION['is_admin'] === true
    && isset($_SESSION['login_time']) && (time() - (int)$_SESSION['login_time']) > 1800) {
    $_SESSION = [];
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
}

// Define the base URL of the site.
// This ensures links and assets work correctly even if the site is in a subfolder.
// Automatically detects http vs https.
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || (($_SERVER['SERVER_PORT'] ?? 80) == 443)) ? "https" : "http";
// Sanitize host to prevent header/host poisoning via HTTP_HOST.
$host = $_SERVER['HTTP_HOST'] ?? 'localhost';
$host = preg_replace('/[^a-zA-Z0-9.\-:]/', '', $host);
if ($host === '' || $host === null) {
    $host = 'localhost';
}
if (!defined('BASE_URL')) {
    define('BASE_URL', $protocol . '://' . $host);
}

?>
