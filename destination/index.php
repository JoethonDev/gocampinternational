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
    $pageTitle = 'Coming Soon: ' . ($destinationData['name'] ?? 'Destination');
    $pageDescription = 'This destination will be available soon.';
    require_once __DIR__ . '/../includes/header.php';
    echo '<div class="page-content"><div class="container text-center py-5 my-5">';
    echo '<h1 class="display-3 fw-bold text-brand-primary mb-4">Coming Soon</h1>';
    echo '<h2 class="mb-3">' . htmlspecialchars($destinationData['name'] ?? 'This destination') . ' is not available yet.</h2>';
    echo '<p class="lead text-muted mb-4">Please check back later for updates on this destination.</p>';
    echo '<a href="/" class="btn btn-primary btn-lg"><i class="bi bi-house-door-fill me-2"></i>Go to Homepage</a>';
    echo '</div></div>';
    require_once __DIR__ . '/../includes/footer.php';
    exit;
}

require_once __DIR__ . '/../data/all_programs.php';
require_once __DIR__ . '/../includes/section-visibility.php';

// Store raw values; header.php escapes on output. Use !empty so empty strings fall back.
$destinationName = $destinationData['name'] ?? 'Destination';
$destinationTagline = !empty($destinationData['tagline']) ? $destinationData['tagline'] : 'Discover Your Adventure';
$destinationBanner = !empty($destinationData['banner']) ? $destinationData['banner'] : '/images/hero.webp';
$destinationIntro = $destinationData['intro'] ?? '';
$destinationIntroImage = !empty($destinationData['intro_image']) ? $destinationData['intro_image'] : '/images/placeholder.webp';
$destinationGallery = $destinationData['gallery'] ?? [];
$destinationSections = $destinationData['sections'] ?? [];
$destinationStats = $destinationData['stats'] ?? [];
$destinationFaq = $destinationData['faq'] ?? [];

$pageTitle = 'Go Camp :: ' . $destinationName;
$pageDescription = substr(strip_tags($destinationTagline), 0, 160);

// --- Include Header (header.php already includes navigation.php and opens <main id="main-content">) ---
require_once __DIR__ . '/../includes/header.php';
?>

<div class="page-content">
    <?php
    // --- 1. HERO SECTION ---
    if (gocamp_entity_section_visible($destinationData, 'destination', 'hero')) {
        require __DIR__ . '/../sections/destination-hero.php';
    }

    // --- 2. STATS COUNTER ---
    if (gocamp_entity_section_visible($destinationData, 'destination', 'stats') && !empty($destinationData['stats'])) {
        $stats = $destinationData['stats']; 
        $sectionTitle = $destinationData['name'] . ' By The Numbers';
        require_once __DIR__ . '/../sections/stats-counter.php';
    }
    ?>

    <?php if (gocamp_entity_section_visible($destinationData, 'destination', 'intro') && !empty($destinationData['intro_text'])): ?>
    <section class="section-padding bg-white" id="destination-intro">
        <div class="container"><div class="row align-items-center g-4">
            <div class="<?= !empty($destinationData['intro_image']) ? 'col-lg-7' : 'col-12' ?>">
                <h2 class="section-title">Discover <?= htmlspecialchars($destinationData['name']) ?></h2>
                <div class="lead"><?= strip_tags($destinationData['intro_text'], '<p><br><strong><em><ul><ol><li><b><i>') ?></div>
            </div>
            <?php if (!empty($destinationData['intro_image'])): ?>
            <div class="col-lg-5"><img class="img-fluid rounded-4 shadow-sm w-100" src="<?= htmlspecialchars($destinationData['intro_image']) ?>" alt="<?= htmlspecialchars($destinationData['name']) ?>" loading="lazy"></div>
            <?php endif; ?>
        </div></div>
    </section>
    <?php endif; ?>

    <?php if (gocamp_entity_section_visible($destinationData, "destination", "programs")): ?>
    <section class="section-padding bg-light" id="programs">
        <div class="container">
            <?php /*
            <div class="text-center mb-5">
                <h2 class="display-4 fw-bold text-brand-dark mb-3">
                    Choose Your Adventure in <?= htmlspecialchars($destinationData['name']) ?>
                </h2>
                <p class="lead text-muted mb-0">
                    Programs designed for every interest and age group.
                </p>
            </div>
            */ ?>

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
    <?php endif; ?>

    <?php
    // --- MODALS (must be included for each program card) ---
    // --- MODIFIED LOOP (Phase 5) ---
    if (!empty($destinationData['program_ids']) && gocamp_entity_section_visible($destinationData, 'destination', 'programs')) {
        foreach ($destinationData['program_ids'] as $program_id) {
            if (isset($all_programs[$program_id]) && ($all_programs[$program_id]['status'] ?? '') === 'active') {
                $program = $all_programs[$program_id];
                require __DIR__ . '/../sections/program_detail_modal.php';
            }
        }
    }

    ?>

        <?php
        // Only show Gallery section if there are any images in any program
        $hasGalleryImages = false;
        if (!empty($destinationData['program_ids'])) {
            foreach ($destinationData['program_ids'] as $program_id) {
                if (isset($all_programs[$program_id]) && $all_programs[$program_id]['status'] === 'active') {
                    $program = $all_programs[$program_id];
                    $gallery = $program['gallery'] ?? [];
                    if (!empty($gallery)) {
                        $hasGalleryImages = true;
                        break;
                    }
                }
            }
        }
        if ($hasGalleryImages && gocamp_entity_section_visible($destinationData, "destination", "gallery")) : ?>
        <section class="section-padding bg-white" id="destination-gallery">
            <div class="container">
                <div class="text-center mb-5">
                    <h2 class="display-5 fw-bold text-brand-dark mb-3">Gallery: <?= htmlspecialchars($destinationData['name']) ?></h2>
                    <p class="lead text-muted mb-0">Photos grouped by program</p>
                </div>
                <div class="row g-5">
                    <?php
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
                    ?>
                </div>
            </div>
        </section>
        <?php endif; ?>
        <?php
    ?>
    <?php if (gocamp_entity_section_visible($destinationData, 'destination', 'destination_gallery') && !empty($destinationData['gallery'])): ?>
    <section class="section-padding bg-light" id="destination-photo-gallery">
        <div class="container">
            <h2 class="section-title text-center mb-4"><?= htmlspecialchars($destinationData['name']) ?> Photos</h2>
            <div class="row g-3">
                <?php foreach ($destinationData['gallery'] as $image): ?>
                <div class="col-6 col-lg-3"><img class="w-100 rounded-3 shadow-sm" src="<?= htmlspecialchars($image) ?>" alt="<?= htmlspecialchars($destinationData['name']) ?> photo" style="aspect-ratio:4/3;object-fit:cover" loading="lazy"></div>
                <?php endforeach; ?>
            </div>
        </div>
    </section>
    <?php endif; ?>
    <?php
    // --- 4. FAQ SECTION ---
    if (gocamp_entity_section_visible($destinationData, 'destination', 'faq') && !empty($destinationData['faq'])) {
        $faqs = $destinationData['faq']; 
        $sectionTitle = 'Questions About ' . htmlspecialchars($destinationData['name']);
        require_once __DIR__ . '/../sections/faq-section.php';
    }
    
    // --- 5. FINAL CTA BANNER ---
    // require_once __DIR__ . '/../sections/booking-cta-banner.php';
    
    // --- 6. TESTIMONIALS ---
    if (gocamp_entity_section_visible($destinationData, 'destination', 'testimonials')) {
        require __DIR__ . '/../sections/testimonials.php';
    }
    ?>
</div>

<?php
// --- Include Footer ---
require_once __DIR__ . '/../includes/footer.php';
?>