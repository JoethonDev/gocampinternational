<?php
/**
 * File: /program/index.php
 * This page lists ALL available programs from ALL destinations.
 */

// --- Page-specific variables ---
$pageTitle = 'Go Camp :: All Programs';
$pageDescription = 'Explore all available summer camps, from language and arts to sports and leadership programs across our premier destinations.';

// --- Include Header and Navigation ---
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/navigation.php';

// --- Aggregate all programs from all destinations ---
$allPrograms = [];
foreach ($destinations as $destination) {
    if (!empty($destination['programs'])) {
        foreach ($destination['programs'] as $p) {
            // Add the destination name to each program for context
            $p['destination_name'] = $destination['name'];
            $allPrograms[] = $p;
        }
    }
}
?>
<main>
    <!-- Simple Hero Section -->
    <section class="py-5 text-center bg-light">
        <div class="container">
            <h1 class="display-4 fw-bold">All Our Programs</h1>
            <p class="lead text-muted">Find the perfect adventure from our complete list of international camps.</p>
        </div>
    </section>

    <!-- Programs Grid -->
    <section class="section-padding">
        <div class="container">
            <div class="row g-4">
                <?php if (!empty($allPrograms)) : ?>
                    <?php foreach ($allPrograms as $program) : ?>
                        <div class="col-lg-4 col-md-6">
                            <?php // The program card component will now also show the destination name if available ?>
                            <?php require __DIR__ . '/../sections/program_card_modern.php'; ?>
                        </div>
                    <?php endforeach; ?>
                <?php else : ?>
                    <p class="text-center">No programs found. Please check back later.</p>
                <?php endif; ?>
            </div>
        </div>
    </section>
    
    <?php
    // --- Include Modals for all programs ---
    if (!empty($allPrograms)) {
        foreach ($allPrograms as $program) {
            require __DIR__ . '/../sections/program_detail_modal.php';
        }
    }
    
    // --- Final CTA Banner ---
    require_once __DIR__ . '/../sections/booking-cta-banner.php';
    ?>
</main>

<?php
// --- Include Footer ---
require_once __DIR__ . '/../includes/footer.php';
?>
