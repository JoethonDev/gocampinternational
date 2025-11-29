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

    return file_put_contents($filename, json_encode($record, JSON_PRETTY_PRINT));
}
