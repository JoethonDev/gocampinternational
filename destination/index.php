<?php
/**
 * File: /destination/index.php
 * This is the UNIVERSAL TEMPLATE for displaying a single destination.
 *
 * --- MODIFIED (Phase 5) ---
 * - Now loads /data/all_programs.php
 * - Loops over $destinationData['program_ids'] instead of $destinationData['programs']
 */

// --- Variable Safety Check ---
if (!isset($destinationData) || !is_array($destinationData)) {
    http_response_code(404);
    include __DIR__ . '/../404.php';
    exit;
}

require_once __DIR__ . '/../data/all_programs.php';

$pageTitle = 'Go Camp :: ' . htmlspecialchars($destinationData['name']);
$pageDescription = htmlspecialchars($destinationData['tagline']);

// --- Include Header and Navigation ---
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/navigation.php';
?>

<main>
    <?php
    // --- 1. HERO SECTION ---
    require_once __DIR__ . '/../sections/destination-hero.php';

    // --- 2. STATS COUNTER ---
    if (!empty($destinationData['stats'])) {
        $stats = $destinationData['stats']; 
        $sectionTitle = $destinationData['name'] . ' By The Numbers';
        require_once __DIR__ . '/../sections/stats-counter.php';
    }
    ?>

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
                if (!empty($destinationData['program_ids'])) {
                    foreach ($destinationData['program_ids'] as $program_id) {
                        // Find the program details from the master list
                        if (isset($all_programs[$program_id]) && $all_programs[$program_id]['status'] === 'active') {
                            $program = $all_programs[$program_id];
                            
                            // The program_card_modern.php component uses the $program variable
                            echo '<div class="col-lg-4 col-md-6">';
                            require __DIR__ . '/../sections/program_card_modern.php';
                            echo '</div>';
                        }
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
    // --- MODIFIED LOOP (Phase 5) ---
    if (!empty($destinationData['program_ids'])) {
        foreach ($destinationData['program_ids'] as $program_id) {
            if (isset($all_programs[$program_id]) && $all_programs[$program_id]['status'] === 'active') {
                $program = $all_programs[$program_id];
                // The modal component also uses the $program variable
                require __DIR__ . '/../sections/program_detail_modal.php';
            }
        }
    }

    // --- 4. FAQ SECTION ---
    if (!empty($destinationData['faq'])) {
        $faqs = $destinationData['faq']; 
        $sectionTitle = 'Questions About ' . htmlspecialchars($destinationData['name']);
        require_once __DIR__ . '/../sections/faq-section.php';
    }
    
    // --- 5. FINAL CTA BANNER ---
    require_once __DIR__ . '/../sections/booking-cta-banner.php';
    
    // --- 6. TESTIMONIALS ---
    require_once __DIR__ . '/../sections/testimonials.php';
    ?>
</main>

<?php
// --- Include Footer ---
require_once __DIR__ . '/../includes/footer.php';
?>