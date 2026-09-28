<?php
/**
 * API Endpoint: /api/submit-lead.php
 * Handles submission from the Booking/Lead Modal.
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../admin/includes/inquiry-handler.php';

// Simple per-IP rate limit: 5 requests/minute (file in system temp dir).
$ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$rateFile = sys_get_temp_dir() . '/lead_rate_' . md5($ip) . '.json';
$now = time();
$hits = [];
if (is_file($rateFile)) {
    $decoded = json_decode((string)@file_get_contents($rateFile), true);
    if (is_array($decoded)) {
        $hits = array_values(array_filter($decoded, fn($t) => is_int($t) && ($now - $t) < 60));
    }
}
if (count($hits) >= 5) {
    http_response_code(429);
    echo json_encode(['error' => 'Too many requests, try again later']);
    exit;
}
$hits[] = $now;
@file_put_contents($rateFile, json_encode($hits), LOCK_EX);

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

// Strip CR/LF + encoded newlines to block mail header injection.
$clean = fn($v) => trim(str_replace(["\r", "\n", "%0a", "%0d", "%0A", "%0D"], '', (string)$v));

// Basic validation
if (empty($input['name']) || empty($input['email']) || empty($input['phone'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

$name = $clean($input['name'] ?? '');
$email = $clean($input['email'] ?? '');
$phone = $clean($input['phone'] ?? '');
$interest = $clean($input['interest'] ?? '');
$source = $clean($input['source'] ?? '');

// Length + format checks
if ($name === '' || strlen($name) > 100 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid name or email']);
    exit;
}
if ($phone === '' || strlen($phone) > 30) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid phone']);
    exit;
}
if (strlen($interest) > 5000 || strlen($source) > 5000) {
    http_response_code(400);
    echo json_encode(['error' => 'Field too long']);
    exit;
}

$input['name'] = $name;
$input['email'] = $email;
$input['phone'] = $phone;
$input['interest'] = $interest;
$input['source'] = $source;

// Save to disk
if (saveInquiry($input, 'booking')) {

    // Optional: Send email notification (fixed subject — name goes in body, never subject/headers)
    $to = "zeinab@gocampinternational.net";
    $subject = "New Booking Inquiry";
    $message = "Name: " . $name . "\n";
    $message .= "Email: " . $email . "\n";
    $message .= "Phone: " . $phone . "\n";
    if ($interest !== '') $message .= "Interest: " . $interest . "\n";
    if ($source !== '') $message .= "Source: " . $source . "\n";

    $headers = "From: info@gocampinternational.com\r\n";
    $headers .= "Reply-To: " . $email;
    
    // Suppress errors for mail to avoid breaking JSON response
    @mail($to, $subject, $message, $headers);

    echo json_encode(['success' => true, 'message' => 'Inquiry saved successfully']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save inquiry']);
}
