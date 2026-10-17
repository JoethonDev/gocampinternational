<?php
/**
 * API Endpoint: /api/submit-contact.php
 * Handles submission from the Contact Us page.
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../admin/includes/inquiry-handler.php';

// Simple per-IP rate limit: 5 requests/minute (file in system temp dir).
$ip = (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$rateFile = sys_get_temp_dir() . '/contact_rate_' . md5($ip) . '.json';
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
if (!is_array($input)) { $input = $_POST; }

// Honeypot: silently accept spam without saving/mailing.
if (!empty($input['website'])) { echo json_encode(['success' => true, 'message' => 'Message saved successfully']); exit; }

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

// Strip CR/LF + encoded newlines to block mail header injection.
$clean = fn($v) => trim(str_replace(["\r", "\n", "%0a", "%0d", "%0A", "%0D"], '', (string)$v));

// Assuming I fix contact_us.php to have name="name", name="email", etc.
if (empty($input['name']) || empty($input['email'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

$name = $clean($input['name'] ?? '');
$email = $clean($input['email'] ?? '');
$phone = $clean($input['phone'] ?? '');
$country = $clean($input['country'] ?? '');
$subjectInput = $clean($input['subject'] ?? '');
$messageInput = trim((string)($input['message'] ?? ''));
if (strlen($messageInput) > 5000) {
    http_response_code(400);
    echo json_encode(['error' => 'Message too long']);
    exit;
}
$messageInput = str_replace(["\r"], '', $messageInput); // keep newlines in body only

// Length + format checks
if ($name === '' || strlen($name) > 100 || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($email) > 254) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid name or email']);
    exit;
}
if (strlen($phone) > 30 || strlen($country) > 100 || strlen($subjectInput) > 200) {
    http_response_code(400);
    echo json_encode(['error' => 'Field too long']);
    exit;
}

$input['name'] = $name;
$input['email'] = $email;
$input['phone'] = $phone;
$input['country'] = $country;
$input['subject'] = $subjectInput;
$input['message'] = $messageInput;

// Save to disk
if (saveInquiry($input, 'contact')) {

    // Optional: Send email notification (fixed subject — user subject goes in body, never headers)
    $to = "zeinab@gocampinternational.net";
    $subject = "New Contact Message";
    $message = "Name: " . $name . "\n";
    $message .= "Email: " . $email . "\n";
    $message .= "Phone: " . ($phone !== '' ? $phone : 'N/A') . "\n";
    $message .= "Country: " . ($country !== '' ? $country : 'N/A') . "\n";
    if ($subjectInput !== '') $message .= "Subject: " . $subjectInput . "\n";
    $message .= "Message: \n" . $messageInput . "\n";

    $headers = "From: info@gocampinternational.com\r\n";
    $headers .= "Reply-To: " . $email;
    
    @mail($to, $subject, $message, $headers);

    echo json_encode(['success' => true, 'message' => 'Message saved successfully']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save message']);
}
