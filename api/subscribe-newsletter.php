<?php
/**
 * API Endpoint: /api/subscribe-newsletter.php
 * Minimal newsletter subscription: validate email, rate-limit, save via inquiry-handler type 'newsletter'.
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../admin/includes/inquiry-handler.php';

// --- Simple rate-limit: max 5 requests / 10 min per IP ---
$ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
$rl_dir = sys_get_temp_dir() . '/gocamp_newsletter_rl/';
if (!is_dir($rl_dir)) {
    @mkdir($rl_dir, 0755, true);
}
$rl_file = $rl_dir . preg_replace('/[^a-zA-Z0-9_.-]/', '_', $ip) . '.json';
$window = 600; // 10 minutes
$max = 5;
$now = time();
$hits = [];
if (file_exists($rl_file)) {
    $raw = @file_get_contents($rl_file);
    $decoded = json_decode($raw, true);
    if (is_array($decoded)) {
        $hits = array_filter($decoded, function ($t) use ($now, $window) {
            return ($now - (int)$t) < $window;
        });
    }
}
if (count($hits) >= $max) {
    http_response_code(429);
    echo json_encode(['error' => 'Too many requests. Please try again later.']);
    exit;
}
$hits[] = $now;
@file_put_contents($rl_file, json_encode(array_values($hits)));

// --- Get input (JSON or form-encoded) ---
$input = json_decode(file_get_contents('php://input'), true);
if (!is_array($input) || empty($input['email'])) {
    $input = $_POST;
}

// Honeypot: silently accept spam without saving.
if (!empty($input['website'])) { echo json_encode(['success' => true, 'message' => 'Subscribed successfully']); exit; }

$email = trim($input['email'] ?? '');
if ($email === '' || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid email address']);
    exit;
}

// --- Save via inquiry-handler ---
$data = ['email' => $email];
if (saveInquiry($data, 'newsletter')) {
    echo json_encode(['success' => true, 'message' => 'Subscribed successfully']);
    exit;
}

http_response_code(500);
echo json_encode(['error' => 'Failed to save subscription']);
