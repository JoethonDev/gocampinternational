<?php
/**
 * API Endpoint: /api/submit-lead.php
 * Handles submission from the Booking/Lead Modal.
 */

header('Content-Type: application/json');
require_once __DIR__ . '/../admin/includes/inquiry-handler.php';

// Get JSON input
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid input']);
    exit;
}

// Basic validation
if (empty($input['name']) || empty($input['email']) || empty($input['phone'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

// Save to disk
if (saveInquiry($input, 'booking')) {
    
    // Optional: Send email notification
    $to = "zeinab@gocampinternational.net";
    $subject = "New Booking Inquiry: " . $input['name'];
    $message = "Name: " . $input['name'] . "\n";
    $message .= "Email: " . $input['email'] . "\n";
    $message .= "Phone: " . $input['phone'] . "\n";
    if (!empty($input['interest'])) $message .= "Interest: " . $input['interest'] . "\n";
    if (!empty($input['source'])) $message .= "Source: " . $input['source'] . "\n";
    
    $headers = "From: info@gocampinternational.com";
    
    // Suppress errors for mail to avoid breaking JSON response
    @mail($to, $subject, $message, $headers);

    echo json_encode(['success' => true, 'message' => 'Inquiry saved successfully']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save inquiry']);
}
