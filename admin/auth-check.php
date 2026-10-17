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
require_once __DIR__ . '/helpers.php';

// Define DEBUG_MODE if not already defined
if (!defined('DEBUG_MODE')) {
    define('DEBUG_MODE', false);
}

// Idle timeout: log out admins idle for more than 30 minutes.
if (!empty($_SESSION['is_admin']) && $_SESSION['is_admin'] === true
    && isset($_SESSION['login_time']) && (time() - (int)$_SESSION['login_time']) > 1800) {
    $_SESSION = [];
    if (ini_get('session.use_cookies')) {
        setcookie(session_name(), '', time() - 42000, '/');
    }
    if (session_status() === PHP_SESSION_ACTIVE) {
        session_destroy();
    }
    header('Location: /admin/');
    exit;
}

// Basic session-hijack check: bind session to user-agent.
$currentUaHash = hash('sha256', (string)($_SERVER['HTTP_USER_AGENT'] ?? ''));
if (!empty($_SESSION['is_admin']) && $_SESSION['is_admin'] === true) {
    if (isset($_SESSION['ua_hash'])) {
        if (!hash_equals((string)$_SESSION['ua_hash'], $currentUaHash)) {
            $_SESSION = [];
            if (ini_get('session.use_cookies')) {
                setcookie(session_name(), '', time() - 42000, '/');
            }
            if (session_status() === PHP_SESSION_ACTIVE) {
                session_destroy();
            }
            header('Location: /admin/');
            exit;
        }
    } else {
        $_SESSION['ua_hash'] = $currentUaHash;
    }
}

// Revoke sessions created with a previous admin credential after password rotation.
$activeAdminHash = (string)(getenv('GC_ADMIN_PASSWORD_HASH') ?: '');
$activeAdminUser = (string)(getenv('GC_ADMIN_USERNAME') ?: 'admin');
$expectedCredentialVersion = $activeAdminHash !== '' ? hash('sha256', $activeAdminUser . ':' . $activeAdminHash) : '';

// If the admin session variable isn't set or is not true
if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] !== true
    || $expectedCredentialVersion === ''
    || !hash_equals($expectedCredentialVersion, (string)($_SESSION['admin_credential_version'] ?? ''))) {
    // Redirect them back to the login page
    header('Location: /admin/');
    exit;
}
$TINY_MCE_API_KEY = getenv('TINY_MCE_API_KEY') ?: ($_ENV['TINY_MCE_API_KEY'] ?? '');
// If they are logged in, the script continues.
?>