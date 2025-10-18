<?php
/**
 * File: /router.php (FIXED & IMPROVED with DEBUGGING)
 * This file is the central controller for the entire application.
 * It intercepts all requests (thanks to .htaccess) and decides which page/template to render.
 */

// --- DEBUGGING ---
// Set to true to display routing information at the top of the page.
// Set to false for production.
define('DEBUG_MODE', false);

if (DEBUG_MODE) {
    echo '<div style="background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; margin: 15px; font-family: monospace; z-index: 9999; position: relative;">';
    echo '<strong>ROUTER DEBUG INFORMATION:</strong><br>';
    echo '<strong>Request URI (from server):</strong> ' . htmlspecialchars($_SERVER['REQUEST_URI']) . '<br>';
    $path_for_debug = trim(parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH), '/');
    echo '<strong>Processed Path (used for matching):</strong> ' . htmlspecialchars($path_for_debug) . '<br>';
    echo '</div>';
}

// 1. Load All Data Sources
require_once __DIR__ . '/data/destinations.php';
require_once __DIR__ . '/data/programs.php';

// 2. Get the clean URL path
$requestUri = $_SERVER['REQUEST_URI'];
$path = trim(parse_url($requestUri, PHP_URL_PATH), '/');

// --- ROUTING LOGIC using a more robust if/elseif structure ---

// Handle static pages first
if ($path === '' || $path === 'index' || $path === 'home') {
    include __DIR__ . '/home.php';
    exit;
}
if ($path === 'about') {
    include __DIR__ . '/about_us.php';
    exit;
}
if ($path === 'contact') {
    include __DIR__ . '/contact_us.php';
    exit;
}
if ($path === 'faq') {
    include __DIR__ . '/faq.php';
    exit;
}
if ($path === 'programs') {
    include __DIR__ . '/program/index.php';
    exit;
}
if ($path === 'landing') {
    include __DIR__ . '/landing.php';
    exit;
}

// Handle dynamic destination pages (e.g., /destination/italy)
if (preg_match('/^destinations\/([a-zA-Z0-9_-]+)$/', $path, $matches)) {
    $slug = $matches[1];
    $destinationData = null;
    foreach ($destinations as $dest) {
        if ($dest['slug'] === $slug) {
            $destinationData = $dest;
            break;
        }
    }

    if ($destinationData) {
        include __DIR__ . '/destination/index.php';
    } else {
        http_response_code(404);
        include __DIR__ . '/404.php';
    }
    exit;
}

// Handle dynamic program category pages (e.g., /program/soccer-camps)
if (preg_match('/^programs\/([a-zA-Z0-9_-]+)$/', $path, $matches)) {
    $slug = $matches[1];
    $programData = null;
    foreach ($programs as $prog) {
        if ($prog['slug'] === $slug) {
            $programData = $prog;
            break;
        }
    }

    if ($programData) {
        include __DIR__ . '/program/category.php';
    } else {
        http_response_code(404);
        include __DIR__ . '/404.php';
    }
    exit;
}

// If no route was matched by the end, it's a 404
http_response_code(404);
include __DIR__ . '/404.php';
exit;

