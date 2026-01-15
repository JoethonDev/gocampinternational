<?php
/**
 * File: /sections/faq-section.php
 * FAQ Accordion Section
 *
 * This component renders an accordion of frequently asked questions.
 *
 * It expects the following variables in its scope:
 * @var array $faqs - An array of FAQ items. Each item is an array with 'q' (question) and 'a' (answer).
 * @var string $sectionTitle (optional) - The main heading for the section.
 */

// --- Variable Safety Checks ---
$faqs         = $faqs ?? [];
$sectionTitle = $sectionTitle ?? 'Frequently Asked Questions';
// Create a unique ID for the accordion to prevent conflicts if used multiple times on a page.
$accordionId = 'faqAccordion-' . uniqid();
?>
<div class="row g-5">
    <div class="col-12">
        <div class="text-center mb-5">
            <h2 class="section-title"><?= htmlspecialchars($sectionTitle) ?></h2>
        </div>

        <?php if (!empty($faqs)) : ?>
            <div class="accordion" id="<?= $accordionId ?>">
                <?php foreach ($faqs as $index => $faq) :
                    $question = $faq['question'] ?? $faq['q'] ?? 'No question provided.';
                    $answer = $faq['answer'] ?? $faq['a'] ?? 'No answer provided.';
                    $isFirst = ($index === 0);
                    ?>
                    <div class="accordion-item border-0 mb-3 shadow-sm" style="border-radius: 12px; overflow: hidden;">
                        <h3 class="accordion-header">
                            <button class="accordion-button fw-bold <?= $isFirst ? '' : 'collapsed' ?>" type="button" data-bs-toggle="collapse" data-bs-target="#faq-<?= $accordionId ?>-<?= $index ?>">
                                <?= htmlspecialchars($question) ?>
                            </button>
                        </h3>
                        <div id="faq-<?= $accordionId ?>-<?= $index ?>" class="accordion-collapse collapse <?= $isFirst ? 'show' : '' ?>" data-bs-parent="#<?= $accordionId ?>">
                            <div class="accordion-body">
                                <?= $answer ?>
                            </div>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php else : ?>
            <p class="text-center">No FAQs to display at this time.</p>
        <?php endif; ?>

        <div class="text-center mt-5">
            <p class="text-muted mb-3">Still have questions?</p>
            <a href="/contact_us.php" class="btn btn-warning btn-lg">
                <i class="bi bi-envelope-fill me-2"></i>Contact Us
            </a>
        </div>
    </div>
</div>

