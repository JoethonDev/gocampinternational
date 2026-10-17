<?php
/**
 * File: /admin/logout.php
 * ---
 * Destroys the admin session and logs the user out.
 */

// We must include init.php to start/access the session
require_once __DIR__ . '/../init.php';

// Unset all session variables
$_SESSION = [];

// Clear the session cookie
if (ini_get('session.use_cookies')) {
    setcookie(session_name(), '', time() - 42000, '/');
}

// Destroy the session
session_destroy();

// Redirect to the login page
header('Location: /admin/');
exit;
?>