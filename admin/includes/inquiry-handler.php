<?php
/**
 * File: /admin/includes/inquiry-handler.php
 * Helper function to save inquiries to disk.
 */

function saveInquiry($data, $type = 'general') {
    $dir = __DIR__ . '/../../data/inquiries/';

    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }

    // Block direct web access to stored inquiries.
    $htaccess = $dir . '.htaccess';
    if (!is_file($htaccess)) {
        @file_put_contents($htaccess, "Require all denied\nDeny from all\n", LOCK_EX);
    }

    // Sanitize: truncate every string field to 5KB to bound disk/memory use.
    if (is_array($data)) {
        foreach ($data as $k => $v) {
            if (is_string($v) && strlen($v) > 5120) {
                $data[$k] = substr($v, 0, 5120);
            }
        }
    }

    $type = is_string($type) ? preg_replace('/[^a-zA-Z0-9_-]/', '', $type) : 'general';
    if ($type === '' || $type === null) {
        $type = 'general';
    }

    $timestamp = time();
    $date = date('Y-m-d', $timestamp);
    $filename = $dir . $date . '_' . $timestamp . '_' . $type . '_' . uniqid() . '.json';

    $record = [
        'id' => uniqid(),
        'timestamp' => $timestamp,
        'date' => date('Y-m-d H:i:s', $timestamp),
        'type' => $type,
        'data' => $data,
        'status' => 'new' // new, read, replied
    ];

    $bytes = file_put_contents($filename, json_encode($record, JSON_PRETTY_PRINT), LOCK_EX);
    return $bytes !== false;
}
