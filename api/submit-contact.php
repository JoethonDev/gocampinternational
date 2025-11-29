<?php
/**
 * API Endpoint: /api/submit-contact.php
 * Handles submission from the Contact Us page.
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

// Basic validation (Contact form fields might differ slightly, checking common ones)
// contact_us.php form has: contact-name, contact-email, contact-phone, contact-country, contact-subject, contact-message
// BUT js/main.js uses Utils.getFormData(form). 
// The inputs in contact_us.php have IDs but NO NAME attributes! 
// I need to fix contact_us.php to have name attributes first.

// Assuming I fix contact_us.php to have name="name", name="email", etc.
if (empty($input['name']) || empty($input['email'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields']);
    exit;
}

// Save to disk
if (saveInquiry($input, 'contact')) {
    
    // Optional: Send email notification
    $to = "zeinab@gocampinternational.net";
    $subject = "New Contact Message: " . ($input['subject'] ?? 'No Subject');
    $message = "Name: " . $input['name'] . "\n";
    $message .= "Email: " . $input['email'] . "\n";
    $message .= "Phone: " . ($input['phone'] ?? 'N/A') . "\n";
    $message .= "Country: " . ($input['country'] ?? 'N/A') . "\n";
    $message .= "Message: \n" . ($input['message'] ?? '') . "\n";
    
    $headers = "From: info@gocampinternational.com";
    
    @mail($to, $subject, $message, $headers);

    echo json_encode(['success' => true, 'message' => 'Message saved successfully']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save message']);
}
