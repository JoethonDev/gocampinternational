<?php
/**
 * File: /home.php (The New Homepage)
 * The main homepage content for the website.
 */

// --- Page-specific variables ---
$pageTitle = 'Go Camp International | Unforgettable Summer Experiences';
$pageDescription = 'Discover life-changing international summer camps for teens. We offer language, arts, sports, and leadership programs in premier destinations.';

// --- Load data needed for this page ---
require_once __DIR__ . '/data/destinations.php';
require_once __DIR__ . '/includes/section-visibility.php';
require_once __DIR__ . '/data/site_settings.php';

// --- Mock data for banners ---
$banners = [
    ['image' => 'banner.webp', 'title' => 'Unforgettable Summers Start Here'],
    ['image' => 'hero.webp', 'title' => 'Discover Your Passion Abroad'],
    ['image' => 'about_img_3.webp', 'title' => 'Build Lifelong Friendships']
];

// --- Include Header (header.php already includes navigation.php and opens <main id="main-content">) ---
require_once __DIR__ . '/includes/header.php';
?>

<div class="page-content">

    <!-- HERO SLIDER SECTION -->
    <?php if (gocamp_entity_section_visible($site_settings, "home", "hero")): ?>
    <header id="home-hero-slider" class="carousel slide" data-bs-ride="carousel">
        <div class="carousel-inner">
            <?php foreach ($banners as $index => $banner): ?>
                <div class="carousel-item <?= $index === 0 ? 'active' : '' ?>">
                    <div class="hero-section d-flex align-items-center justify-content-center text-center" style="background-image: url('/images/<?= htmlspecialchars($banner['image']) ?>'); background-size: cover; background-position: center;">
                        <div class="hero-overlay"></div>
                        <div class="container position-relative d-flex flex-column align-items-center justify-content-center" style="z-index:2; min-height:60vh;">
                            <?php if ($index === 0): ?>
                            <h1 class="display-3 fw-bold mb-3 text-white" style="text-shadow:0 2px 12px #000,0 0 2px #fff;"><?= htmlspecialchars($banner['title']) ?></h1>
                            <?php else: ?>
                            <h2 class="display-3 fw-bold mb-3 text-white" style="text-shadow:0 2px 12px #000,0 0 2px #fff;"><?= htmlspecialchars($banner['title']) ?></h2>
                            <?php endif; ?>
                            <p class="lead mb-4 text-white" style="text-shadow:0 2px 8px #000,0 0 2px #fff;">International camps are a life-changing opportunity to learn, grow, and make global friends.</p>
                            <a href="#destinations" class="btn btn-lg fw-bold px-5 py-3 text-uppercase">Explore Destinations</a>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </header>
    <?php endif; ?>

    <!-- INTRODUCTION SECTION -->
    <?php if (gocamp_entity_section_visible($site_settings, "home", "intro")): ?>
    <section class="section-padding">
        <div class="container">
            <div class="row justify-content-center">
                <div class="col-lg-8 text-center">
                    <h2 class="section-title">Go Camp International</h2>
                    <p class="lead">Summer Camp is more than just fun and games. It's an opportunity for your kids to develop critical skills, learn about the world, and build international connections that last a lifetime.</p>
                </div>
            </div>
        </div>
    </section>
    <?php endif; ?>

    <?php
    // --- DYNAMIC DESTINATIONS SECTION ---
    // Only show active destinations (unified rule: status === 'active').
    $public_destinations = array_filter(($destinations ?? []), function($dest) {
        return isset($dest['status']) && $dest['status'] === 'active';
    });
    // Make $public_destinations available to the cards section
    // The destination-cards.php should use $public_destinations if set, otherwise fallback to $destinations
    if (gocamp_entity_section_visible($site_settings, 'home', 'destinations')) {
        require __DIR__ . '/sections/destination-cards.php';
    }
    ?>

    <?php
    // --- FEATURED CATEGORIES SECTION ---
    // Load category and program data
    require_once __DIR__ . '/data/programs.php';
    require_once __DIR__ . '/data/all_programs.php';

    // Count programs in each category and prepare featured categories
    // Unified rule: program status must be 'active' AND its category must exist + be 'active'.
    $featured_categories = [];
    foreach (($programs ?? []) as $category) {
        if (($category['status'] ?? null) === 'active') {
            // Count active programs in this category whose destination is active
            $program_count = 0;
            foreach (($all_programs ?? []) as $program) {
                if (
                    isset($program['category_slug']) && $program['category_slug'] === $category['slug'] &&
                    isset($program['status']) && $program['status'] === 'active'
                ) {
                    // Check if program's category is active (must exist + status active)
                    $category_active = isset($programs[$program['category_slug']]) && 
                                     isset($programs[$program['category_slug']]['status']) && 
                                     $programs[$program['category_slug']]['status'] === 'active';
                    
                    if (!$category_active) {
                        continue; // Skip programs with inactive/missing categories
                    }
                    
                    // Check if program's destination is active (unified rule)
                    $destination_active = false;
                    $found_destination = false;
                    foreach (($destinations ?? []) as $dest) {
                        if (isset($dest['program_ids']) && in_array($program['id'], $dest['program_ids'])) {
                            $found_destination = true;
                            if (isset($dest['status']) && $dest['status'] === 'active') {
                                $destination_active = true;
                            }
                            break;
                        }
                    }
                    // Programs with no linked destination count; linked ones must be active.
                    if ($found_destination && !$destination_active) {
                        continue;
                    }
                    $program_count++;
                }
            }
            // Only include categories that have programs
            if ($program_count > 0) {
                $category['program_count'] = $program_count;
                $featured_categories[] = $category;
            }
        }
    }

    // Limit to first 3 categories for the featured section
    $featured_categories = array_slice($featured_categories, 0, 3);
    ?>
    <?php if (gocamp_entity_section_visible($site_settings, "home", "featured_categories")): ?>
    <section id="featured-categories" class="section-padding bg-light">
        <div class="container">
            <div class="text-center mb-5">
                <h2 class="section-title">Explore Our Program Categories</h2>
                <p class="lead text-muted">Choose your adventure from our diverse range of international camp experiences.</p>
            </div>
            
            <div class="row g-4 justify-content-center">
                <?php if (!empty($featured_categories)): ?>
                    <?php foreach ($featured_categories as $category): ?>
                        <div class="col-lg-4 col-md-6 d-flex align-items-stretch">
                            <?php 
                            // Pass the category and program count to the card component
                            $program_count = $category['program_count'];
                            include __DIR__ . '/sections/category_card_modern.php'; 
                            ?>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                     <div class="col-12">
                        <p class="text-center text-muted">No program categories available at the moment. Please check back soon!</p>
                     </div>
                <?php endif; ?>
            </div>
            
            <div class="text-center mt-5 pt-3">
                <a href="/programs" class="btn btn-primary btn-lg fw-bold px-5 py-3">View All Programs</a>
            </div>
        </div>
    </section>
    <?php endif; ?>

    <!-- TESTIMONIALS SECTION -->
    <?php if (gocamp_entity_section_visible($site_settings, 'home', 'testimonials')) require __DIR__ . '/sections/testimonials.php'; ?>

</div>

<?php require_once __DIR__ . '/includes/footer.php'; ?>

