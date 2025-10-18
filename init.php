<?php
/**
 * File: /init.php
 * This file handles global initialization tasks.
 * - Starts the session for form validation or future user login.
 * - Defines a base URL constant for consistent asset linking.
 */

// Start the session if it's not already started.
if (session_status() == PHP_SESSION_NONE) {
    session_start();
}

// Define the base URL of the site.
// This ensures links and assets work correctly even if the site is in a subfolder.
// Automatically detects http vs https.
$protocol = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' || $_SERVER['SERVER_PORT'] == 443) ? "https" : "http";
$host = $_SERVER['HTTP_HOST'];
define('BASE_URL', $protocol . '://' . $host);

?>
