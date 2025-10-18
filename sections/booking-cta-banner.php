<?php
/**
 * File: /sections/booking-cta-banner.php
 *
 * A full-width Call-To-Action banner, often used near the end of a page.
 * Inspired by the banner from italy.php.
 *
 * It expects the following optional variables:
 * @var string $ctaTitle - The main heading.
 * @var string $ctaSubtext - The paragraph text below the heading.
 * @var string $ctaButtonText - The text for the main button.
 */

// --- Variable Safety Checks ---
$ctaTitle      = $ctaTitle ?? 'Ready to Create Unforgettable Memories?';
$ctaSubtext    = $ctaSubtext ?? 'Join us this summer. Limited spots available!';
$ctaButtonText = $ctaButtonText ?? 'Book Your Spot Now';
?>
<section class="py-5 position-relative overflow-hidden" style="background: linear-gradient(135deg, var(--brand-accent) 0%, #f0ad00 100%);">
    <div class="container position-relative" style="z-index: 2;">
        <div class="row align-items-center">
            <div class="col-lg-8 text-center text-lg-start mb-4 mb-lg-0">
                <h2 class="display-5 fw-bold text-dark mb-3">
                    <?= htmlspecialchars($ctaTitle) ?>
                </h2>
                <p class="lead text-dark mb-0 opacity-90">
                    <?= htmlspecialchars($ctaSubtext) ?>
                </p>
            </div>
            <div class="col-lg-4 text-center text-lg-end">
                <button class="btn btn-dark btn-lg px-5 py-3 fw-bold shadow-xl"
                        data-bs-toggle="modal"
                        data-bs-target="#ctaModal"
                        data-source="Bottom Page CTA">
                    <i class="bi bi-calendar-check-fill me-2"></i>
                    <?= htmlspecialchars($ctaButtonText) ?>
                </button>
            </div>
        </div>
    </div>
</section>

