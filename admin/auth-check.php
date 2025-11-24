<?php
/**
 * File: /admin/auth-check.php
 * ---
 * This is the security gatekeeper for the entire admin area.
 * It checks if an admin session exists and is valid.
 * If not, it redirects the user to the login page.
 */

// We include init.php to ensure the session is started.
require_once __DIR__ . '/../init.php';

// Define DEBUG_MODE if not already defined
if (!defined('DEBUG_MODE')) {
    define('DEBUG_MODE', false);
}

// Debugging: Check session status
if (DEBUG_MODE) {
    echo '<div style="background-color: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; margin: 15px; font-family: monospace;">';
    echo '<strong>AUTH DEBUG:</strong><br>';
    echo '<strong>Session ID:</strong> ' . session_id() . '<br>';
    echo '<strong>Session Status:</strong> ' . session_status() . '<br>';
    echo '<strong>is_admin:</strong> ' . (isset($_SESSION['is_admin']) ? ($_SESSION['is_admin'] ? 'true' : 'false') : 'not set') . '<br>';
    echo '<strong>All Session Data:</strong> ' . print_r($_SESSION, true) . '<br>';
    echo '</div>';
}

// If the admin session variable isn't set or is not true
if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true) {
    // Redirect them back to the login page
    header('Location: /admin/');
    exit;
}
$TINY_MCE_API_KEY = 'cuo6c70r1i8ep83qialu22a4lysbdohgv4xohlh0pdusa78d';
// If they are logged in, the script continues.
?>