<?php
// Router for PHP built-in server: serve existing files directly, else use app router.
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH);
// Match production route restrictions before serving existing PHP files directly.
if (in_array($path, ['/gallery', '/gallery.php', '/memories'], true)) {
    http_response_code(404);
    require __DIR__ . '/404.php';
    return true;
}
$file = __DIR__ . $path;
if ($path !== '/' && is_file($file)) {
    return false; // let built-in server serve static file
}
require __DIR__ . '/index.php';
