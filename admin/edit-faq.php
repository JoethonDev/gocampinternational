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
    <div class="card p-3 mb-3 repeater-item">
        <div class="mb-2">
            <label class="form-label fw-bold">Question</label>
            <input type="text" class="form-control" name="question[]">
        </div>
        <div class="mb-2">
            <label class="form-label fw-bold">Answer</label>
            <textarea class="form-control tinymce-init-on-add" name="answer[]" rows="5"></textarea> 
        </div>
        <button class="btn btn-danger btn-sm align-self-end mt-2" type="button" data-action="remove-item">
            <i class="bi bi-trash"></i> Remove FAQ
        </button>
    </div>
</template>

<form action="edit-faq.php" method="POST">
    <div class="card">
        <div class="card-header">
            <h1 class="h3 mb-0">Edit Global FAQs</h1>
        </div>

        <div class="card-body">
            
            <?php if ($success_message): ?>
                <div class="alert alert-success"><?= $success_message ?></div>
            <?php endif; ?>
            <?php if ($error_message): ?>
                <div class="alert alert-danger"><?= $error_message ?></div>
            <?php endif; ?>

            <p class="text-muted">Changes saved here will be live on the public FAQ page.</p>

            <div id="faq-list" class="repeater-container" data-template-id="faq-template">
                <?php if (!empty($faqData)): ?>
                    <?php foreach ($faqData as $index => $item): ?>
                        <div class="card p-3 mb-3 repeater-item">
                            <div class="mb-2">
                                <label for="question-<?= $index ?>" class="form-label fw-bold">Question</label>
                                <input type="text" class="form-control" id="question-<?= $index ?>" name="question[]" value="<?= htmlspecialchars($item['question']) ?>">
                            </div>
                            <div class="mb-2">
                                <label for="answer-<?= $index ?>" class="form-label fw-bold">Answer</label>
                                <textarea class="form-control tinymce-editor" id="answer-<?= $index ?>" name="answer[]" rows="5"><?= htmlspecialchars($item['answer']) ?></textarea>
                            </div>
                            <button class="btn btn-danger btn-sm align-self-end mt-2" type="button" data-action="remove-item">
                                <i class="bi bi-trash"></i> Remove FAQ
                            </button>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                    <p class="text-muted fst-italic">No FAQs found. Click "Add FAQ" to create one.</p>
                <?php endif; ?>

                <button class="btn btn-outline-primary mt-3" type="button" data-action="add-item">
                    <i class="bi bi-plus-lg"></i> Add FAQ
                </button>
            </div>
            
            <hr> 
            <div class="text-end"> 
                <button type="submit" class="btn btn-primary">
                    <i class="bi bi-save"></i> Save Changes
                </button>
            </div>

        </div> </div> </form> 
<?php
// 6. Include Footer
require_once 'includes/admin-footer.php';
?>