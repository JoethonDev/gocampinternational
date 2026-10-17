<?php
/**
 * Authenticated media selector: show assets in both image stores.
 */
require_once __DIR__ . '/../auth-check.php';
require_once __DIR__ . '/../media-library-helpers.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: private, no-store');
echo json_encode(['success' => true, 'files' => gocamp_media_list(dirname(__DIR__, 2))],
    JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE);
exit;
