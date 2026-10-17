<?php
// Router for PHP built-in server: serve existing files directly, else use app router.
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
$file = __DIR__ . $path;
if ($path !== '/' && is_file($file)) {
    return false; // let built-in server serve static file
}
require __DIR__ . '/index.php';
