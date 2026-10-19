<?php
/**
 * File: /router.php (FIXED & IMPROVED with DEBUGGING)
 * This file is the central controller for the entire application.
 * It intercepts all requests (thanks to .htaccess) and decides which page/template to render.
 */

// --- Global init (guarded: only start session / define BASE_URL once) ---
if (session_status() === PHP_SESSION_NONE) {
    require_once __DIR__ . '/init.php';
}

// --- DEBUGGING ---
// Set to true to display routing information at the top of the page.
// Set to false for production.
if (!defined('DEBUG_MODE')) {
    define('DEBUG_MODE', false);
}

if (DEBUG_MODE) {
    echo '<div style="background-color: #fff3cd; border: 1px solid #ffeeba; color: #856404; padding: 15px; margin: 15px; font-family: monospace; z-index: 9999; position: relative;">';
    echo '<strong>ROUTER DEBUG INFORMATION:</strong><br>';
    echo '<strong>Request URI (from server):</strong> ' . htmlspecialchars($_SERVER['REQUEST_URI'] ?? '/') . '<br>';
    $path_for_debug = trim(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH), '/');
    echo '<strong>Processed Path (used for matching):</strong> ' . htmlspecialchars($path_for_debug) . '<br>';
    echo '</div>';
}

// 1. Load All Data Sources (guarded)
$destinations_file = __DIR__ . '/data/destinations.php';
$programs_file = __DIR__ . '/data/programs.php';
if (!file_exists($destinations_file) || !file_exists($programs_file)) {
    http_response_code(500);
    echo 'Server error: missing data files.';
    exit;
}
require_once $destinations_file;
require_once $programs_file;

// NOTE: Do NOT wrap page includes in a function. Includes must run in global
// scope so $destinations / $programs stay visible inside the page. A function
// wrapper hides globals and causes array_filter(null) / foreach(null) fatals.

// 2. Get the clean URL path
$requestUri = $_SERVER['REQUEST_URI'] ?? '/';
$path = trim(parse_url($requestUri, PHP_URL_PATH), '/');

// --- ROUTING LOGIC using a more robust if/elseif structure ---

// Handle static pages first
if ($path === '' || $path === 'index' || $path === 'home') {
    $page = __DIR__ . '/home.php';
    if (!file_exists($page)) { http_response_code(500); echo 'Server error: missing page.'; exit; }
    include $page;
    exit;
}
if ($path === 'about') {
    $page = __DIR__ . '/about_us.php';
    if (!file_exists($page)) { http_response_code(500); echo 'Server error: missing page.'; exit; }
    include $page;
    exit;
}
if ($path === 'contact') {
    $page = __DIR__ . '/contact_us.php';
    if (!file_exists($page)) { http_response_code(500); echo 'Server error: missing page.'; exit; }
    include $page;
    exit;
}
if ($path === 'faq') {
    $page = __DIR__ . '/faq.php';
    if (!file_exists($page)) { http_response_code(500); echo 'Server error: missing page.'; exit; }
    include $page;
    exit;
}
if ($path === 'programs') {
    $page = __DIR__ . '/program/index.php';
    if (!file_exists($page)) { http_response_code(500); echo 'Server error: missing page.'; exit; }
    include $page;
    exit;
}
if ($path === 'gallery') {
    include __DIR__ . '/gallery.php';
    exit;
}
if ($path === 'landing') {
    $page = __DIR__ . '/landing.php';
    if (!file_exists($page)) { http_response_code(500); echo 'Server error: missing page.'; exit; }
    include $page;
    exit;
}
// Handle admin area (login + dashboard + all admin pages).
// Forward EVERYTHING under /admin to admin/index.php — its internal router
// serves dashboard/programs/trash/edit pages. Matching only exact 'admin'
// 404s /admin/dashboard right after login.
if ($path === 'admin' || str_starts_with($path, 'admin/')) {
    $page = __DIR__ . '/admin/index.php';
    if (!file_exists($page)) { http_response_code(500); echo 'Server error: missing page.'; exit; }
    include $page;
    exit;
}
// Handle dynamic destination pages (e.g., /destinations/italy + singular alias /destination/italy)
if (preg_match('/^destinations\/([a-zA-Z0-9_-]+)$/', $path, $matches) || preg_match('/^destination\/([a-zA-Z0-9_-]+)$/', $path, $matches)) {
    $slug = $matches[1];
    if (!preg_match('/^[a-zA-Z0-9_-]+$/', $slug)) {
        http_response_code(404);
        $page = __DIR__ . '/404.php';
        if (!file_exists($page)) { echo 'Not found.'; exit; }
        include $page;
        exit;
    }
    $destinationData = null;
    foreach (($destinations ?? []) as $dest) {
        if (($dest['slug'] ?? null) === $slug && ($dest['status'] ?? null) !== 'trash') {
            $destinationData = $dest;
            break;
        }
    }

    if ($destinationData) {
        $page = __DIR__ . '/destination/index.php';
        if (!file_exists($page)) { http_response_code(500); echo 'Server error: missing page.'; exit; }
        include $page;
        exit;
    } else {
        http_response_code(404);
        $page = __DIR__ . '/404.php';
        if (!file_exists($page)) { echo 'Not found.'; exit; }
        include $page;
        exit;
    }
}

// Handle dynamic program category pages (e.g., /programs/soccer-camps)
if (preg_match('/^programs\/([a-zA-Z0-9_-]+)$/', $path, $matches)) {
    $slug = $matches[1];
    if (!preg_match('/^[a-zA-Z0-9_-]+$/', $slug)) {
        http_response_code(404);
        $page = __DIR__ . '/404.php';
        if (!file_exists($page)) { echo 'Not found.'; exit; }
        include $page;
        exit;
    }
    // Redirect to the new query parameter style for consistency (permanent)
    header('Location: /program/category?category=' . urlencode($slug), true, 301);
    exit;
}

// Handle pretty URL for category page (no .php)
if ($path === 'program/category') {
    $page = __DIR__ . '/program/category.php';
    if (!file_exists($page)) { http_response_code(500); echo 'Server error: missing page.'; exit; }
    include $page;
    exit;
}

// Optionally, redirect /program/category.php to /program/category for consistency
if ($path === 'program/category.php') {
    $query = !empty($_SERVER['QUERY_STRING']) ? ('?' . $_SERVER['QUERY_STRING']) : '';
    header('Location: /program/category' . $query, true, 301);
    exit;
}

// If no route was matched by the end, it's a 404
http_response_code(404);
$page = __DIR__ . '/404.php';
if (!file_exists($page)) { echo 'Not found.'; exit; }
include $page;
exit;
