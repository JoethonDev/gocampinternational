<?php
/**
 * File: /destination/index.php
 * This is the UNIVERSAL TEMPLATE for displaying a single destination.
 * The router loads this file and provides the $destinationData variable.
 */

// --- Variable Safety Check ---
if (!isset($destinationData) || !is_array($destinationData)) {
    // This should not happen if the router is working correctly.
    // Redirect to a 404 page as a fallback.
    http_response_code(404);
    include __DIR__ . '/../404.php';
    exit;
}

// --- Page-specific variables for the header ---
$pageTitle = 'Go Camp :: ' . htmlspecialchars($destinationData['name']);
$pageDescription = htmlspecialchars($destinationData['tagline']);

// --- Include Header and Navigation ---
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/navigation.php';
?>

<main>
    <?php
    // --- 1. HERO SECTION ---
    // This component uses the $destinationData variable directly.
    require_once __DIR__ . '/../sections/destination-hero.php';

    // --- 2. STATS COUNTER ---
    // The stats data is nested inside the destination data.
    if (!empty($destinationData['stats'])) {
        $stats = $destinationData['stats']; // Pass stats to the component
        $sectionTitle = $destinationData['name'] . ' By The Numbers';
        require_once __DIR__ . '/../sections/stats-counter.php';
    }
    ?>

    <!-- 3. PROGRAMS SECTION -->
    <section class="section-padding bg-light" id="programs">
        <div class="container">
            <div class="text-center mb-5">
                <h2 class="display-4 fw-bold text-brand-dark mb-3">
                    Choose Your Adventure in <?= htmlspecialchars($destinationData['name']) ?>
                </h2>
                <p class="lead text-muted mb-0">
                    Programs designed for every interest and age group.
                </p>
            </div>

            <div class="row g-4 justify-content-center">
                <?php
                // Loop through the programs specific to this destination
                if (!empty($destinationData['programs'])) {
                    foreach ($destinationData['programs'] as $program) {
                        // The program_card_modern.php component uses the $program variable
                        echo '<div class="col-lg-4 col-md-6">';
                        require __DIR__ . '/../sections/program_card_modern.php';
                        echo '</div>';
                    }
                } else {
                    echo '<p class="text-center">No programs are currently available for this destination. Please check back soon!</p>';
                }
                ?>
            </div>
        </div>
    </section>

    <?php
    // --- MODALS (must be included for each program card) ---
    if (!empty($destinationData['programs'])) {
        foreach ($destinationData['programs'] as $program) {
            // The modal component also uses the $program variable
            require __DIR__ . '/../sections/program_detail_modal.php';
        }
    }

    // --- 4. FAQ SECTION ---
    // The FAQ data is nested inside the destination data.
    if (!empty($destinationData['faq'])) {
        $faqs = $destinationData['faq']; // Pass the FAQs to the component
        $sectionTitle = 'Questions About ' . htmlspecialchars($destinationData['name']);
        require_once __DIR__ . '/../sections/faq-section.php';
    }
    
    // --- 5. FINAL CTA BANNER ---
    require_once __DIR__ . '/../sections/booking-cta-banner.php';
    
    // --- 6. TESTIMONIALS ---
    // The testimonials component uses its own fallback data for now.
    require_once __DIR__ . '/../sections/testimonials.php';
    ?>
</main>

<?php
// --- Include Footer ---
require_once __DIR__ . '/../includes/footer.php';
?>
