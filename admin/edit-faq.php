<?php
/**
 * File: /admin/edit-faq.php
 * ---
 * --- MODIFIED (Phase 9 Feedback) ---
 * - Moved "Save Changes" button from header to the bottom of the form.
 */

// 1. AT THE VERY TOP: Check if user is logged in
require_once 'auth-check.php';
require_once 'helpers.php'; // Include our save functions

// 2. Define file path
$faq_file_path = __DIR__ . '/../data/faq.json';
$success_message = '';
$error_message = '';

// 3. --- SAVE LOGIC ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $questions = $_POST['question'] ?? [];
    $answers = $_POST['answer'] ?? [];
    
    $new_faq_data = [];
    
    foreach ($questions as $index => $question_text) {
        if (!empty(trim($question_text)) && isset($answers[$index]) && !empty(trim($answers[$index]))) {
            $new_faq_data[] = [
                'question' => trim($question_text),
                'answer' => $answers[$index] 
            ];
        }
    }

    if (save_json_file($faq_file_path, $new_faq_data)) {
        $success_message = 'Successfully saved FAQ data!';
    } else {
        $error_message = 'Error saving FAQ data. Check file permissions.';
    }
}

// 4. Load the data (or re-load after saving)
$faqData = json_decode(file_get_contents($faq_file_path), true);
if ($faqData === null) $faqData = []; 

// 5. Set Page Title and Include Header
$pageTitle = 'Edit Global FAQs';
require_once 'includes/admin-header.php';
?>

<template id="faq-template">
    <div class="accordion-item repeater-item border-0 mb-3 shadow-sm rounded">
        <h2 class="accordion-header" id="heading-NEW_ID">
            <button class="accordion-button collapsed bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-NEW_ID" aria-expanded="false" aria-controls="collapse-NEW_ID">
                <span class="fw-bold text-primary me-2">New Question</span>
                <small class="text-muted ms-auto me-3">Expand to edit</small>
            </button>
        </h2>
        <div id="collapse-NEW_ID" class="accordion-collapse collapse show" aria-labelledby="heading-NEW_ID">
            <div class="accordion-body bg-white">
                <div class="row g-3">
                    <div class="col-md-12">
                        <label class="form-label fw-bold text-secondary small text-uppercase">Question</label>
                        <input type="text" class="form-control form-control-lg" name="question[]" placeholder="e.g. What is the refund policy?">
                    </div>
                    <div class="col-md-12">
                        <label class="form-label fw-bold text-secondary small text-uppercase">Answer</label>
                        <textarea class="form-control tinymce-init-on-add" name="answer[]" rows="5"></textarea> 
                    </div>
                    <div class="col-12 text-end">
                        <button class="btn btn-outline-danger btn-sm" type="button" data-action="remove-item">
                            <i class="bi bi-trash"></i> Remove FAQ
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<div class="container-fluid py-4 animate-fade-in">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <a href="/admin/dashboard.php" class="text-decoration-none text-secondary mb-2 d-inline-block">
                <i class="bi bi-arrow-left"></i> Back to Dashboard
            </a>
            <h1 class="h3 mb-0 fw-bold text-gray-800">Global FAQs</h1>
            <p class="text-muted mb-0">Manage the Frequently Asked Questions displayed on the public site.</p>
        </div>
        <button type="submit" class="btn btn-primary px-4" form="faqForm">
            <i class="bi bi-save"></i> Save Changes
        </button>
    </div>

    <form id="faqForm" action="edit-faq.php" method="POST">
        <div class="card border-0 shadow-sm">
            <div class="card-header bg-transparent border-0 pt-4 pb-2 px-4 d-flex justify-content-between align-items-center">
                <h5 class="card-title fw-bold text-primary mb-0"><i class="bi bi-question-circle me-2"></i>FAQ Items</h5>
                <button class="btn btn-sm btn-primary rounded-pill px-3" type="button" data-action="add-item">
                    <i class="bi bi-plus-lg me-1"></i> Add FAQ
                </button>
            </div>

            <div class="card-body p-4">
                
                <?php if ($success_message): ?>
                    <div class="alert alert-success alert-dismissible fade show shadow-sm border-0 border-start border-success border-4" role="alert">
                        <i class="bi bi-check-circle-fill me-2"></i> <?= $success_message ?>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                <?php endif; ?>
                <?php if ($error_message): ?>
                    <div class="alert alert-danger alert-dismissible fade show shadow-sm border-0 border-start border-danger border-4" role="alert">
                        <i class="bi bi-exclamation-triangle-fill me-2"></i> <?= $error_message ?>
                        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
                    </div>
                <?php endif; ?>

                <div id="faq-list" class="repeater-container accordion" id="faqAccordion" data-template-id="faq-template">
                    <?php if (!empty($faqData)): ?>
                        <?php foreach ($faqData as $index => $item): 
                            $collapseId = 'collapse-' . $index . '-' . uniqid();
                            $headingId = 'heading-' . $index . '-' . uniqid();
                        ?>
                            <div class="accordion-item repeater-item border-0 mb-3 shadow-sm rounded">
                                <h2 class="accordion-header" id="<?= $headingId ?>">
                                    <button class="accordion-button collapsed bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#<?= $collapseId ?>" aria-expanded="false" aria-controls="<?= $collapseId ?>">
                                        <span class="fw-bold text-primary me-2"><?= !empty($item['question']) ? htmlspecialchars($item['question']) : 'New Question' ?></span>
                                        <small class="text-muted ms-auto me-3">Expand to edit</small>
                                    </button>
                                </h2>
                                <div id="<?= $collapseId ?>" class="accordion-collapse collapse" aria-labelledby="<?= $headingId ?>" data-bs-parent="#faqAccordion">
                                    <div class="accordion-body bg-white">
                                        <div class="row g-3">
                                            <div class="col-md-12">
                                                <label for="question-<?= $index ?>" class="form-label fw-bold text-secondary small text-uppercase">Question</label>
                                                <input type="text" class="form-control form-control-lg" id="question-<?= $index ?>" name="question[]" value="<?= htmlspecialchars($item['question']) ?>">
                                            </div>
                                            <div class="col-md-12">
                                                <label for="answer-<?= $index ?>" class="form-label fw-bold text-secondary small text-uppercase">Answer</label>
                                                <textarea class="form-control tinymce-editor" id="answer-<?= $index ?>" name="answer[]" rows="5"><?= htmlspecialchars($item['answer']) ?></textarea>
                                            </div>
                                            <div class="col-12 text-end">
                                                <button class="btn btn-outline-danger btn-sm" type="button" data-action="remove-item">
                                                    <i class="bi bi-trash"></i> Remove FAQ
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        <?php endforeach; ?>
                    <?php else: ?>
                        <div class="text-center py-5 text-muted empty-state-message">
                            <i class="bi bi-chat-square-text display-4 mb-3 d-block opacity-25"></i>
                            <p>No FAQs found. Click "Add FAQ" to create one.</p>
                        </div>
                    <?php endif; ?>
                </div>
            </div> 
        </div> 
    </form> 
</div> 
<?php
// 6. Include Footer
require_once 'includes/admin-footer.php';
?>