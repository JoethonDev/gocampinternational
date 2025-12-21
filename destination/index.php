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
if (!isset($destinationData) || !is_array($destinationData) || (isset($destinationData['status']) && $destinationData['status'] === 'trash')) {
    http_response_code(404);
    include __DIR__ . '/../404.php';
    exit;
}

// --- Coming Soon Handling ---
if (isset($destinationData['status']) && $destinationData['status'] === 'coming-soon') {
    $pageTitle = 'Coming Soon: ' . htmlspecialchars($destinationData['name']);
    $pageDescription = 'This destination will be available soon.';
    require_once __DIR__ . '/../includes/header.php';
    require_once __DIR__ . '/../includes/navigation.php';
    echo '<main><div class="container text-center py-5 my-5">';
    echo '<h1 class="display-3 fw-bold text-brand-primary mb-4">Coming Soon</h1>';
    echo '<h2 class="mb-3">' . htmlspecialchars($destinationData['name']) . ' is not available yet.</h2>';
    echo '<p class="lead text-muted mb-4">Please check back later for updates on this destination.</p>';
    echo '<a href="/" class="btn btn-primary btn-lg"><i class="bi bi-house-door-fill me-2"></i>Go to Homepage</a>';
    echo '</div></main>';
    require_once __DIR__ . '/../includes/footer.php';
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

        // Gallery Section: Grouped by Program
        ?>
        <section class="section-padding bg-white" id="destination-gallery">
            <div class="container">
                <div class="text-center mb-5">
                    <h2 class="display-5 fw-bold text-brand-dark mb-3">Gallery: <?= htmlspecialchars($destinationData['name']) ?></h2>
                    <p class="lead text-muted mb-0">Photos grouped by program</p>
                </div>
                <div class="row g-5">
                    <?php
                    if (!empty($destinationData['program_ids'])) {
                        foreach ($destinationData['program_ids'] as $program_id) {
                            if (isset($all_programs[$program_id]) && $all_programs[$program_id]['status'] === 'active') {
                                $program = $all_programs[$program_id];
                                $gallery = $program['gallery'] ?? [];
                                if (!empty($gallery)) {
                                    echo '<div class="col-12 mb-4">';
                                    echo '<h3 class="fw-bold mb-3 text-brand-secondary">' . htmlspecialchars($program['name']) . '</h3>';
                                    echo '<div class="row g-2">';
                                    foreach ($gallery as $img) {
                                        echo '<div class="col-6 col-md-3 mb-2"><img src="' . htmlspecialchars($img) . '" alt="' . htmlspecialchars($program['name']) . ' photo" class="img-fluid rounded shadow-sm w-100" style="object-fit:cover;max-height:180px;" loading="lazy"></div>';
                                    }
                                    echo '</div>';
                                    echo '</div>';
                                }
                            }
                        }
                    } else {
                        echo '<p class="text-center">No gallery images available for this destination.</p>';
                    }
                    ?>
                </div>
            </div>
        </section>
        <?php
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