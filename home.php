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

// --- Mock data for banners ---
$banners = [
    ['image' => 'banner.jpg', 'title' => 'Unforgettable Summers Start Here'],
    ['image' => 'hero.jpg', 'title' => 'Discover Your Passion Abroad'],
    ['image' => 'about_img_3.jpg', 'title' => 'Build Lifelong Friendships']
];

// --- Include Header and Navigation ---
require_once __DIR__ . '/includes/header.php';
require_once __DIR__ . '/includes/navigation.php';
?>

<main id="main-content">

    <!-- HERO SLIDER SECTION -->
    <header id="home-hero-slider" class="carousel slide" data-bs-ride="carousel">
        <div class="carousel-inner">
            <?php foreach ($banners as $index => $banner): ?>
                <div class="carousel-item <?= $index === 0 ? 'active' : '' ?>">
                    <div class="hero-section d-flex align-items-center justify-content-center text-center" style="background-image: url('images/<?= htmlspecialchars($banner['image']) ?>'); background-size: cover; background-position: center; min-height: 90vh;">
                        <div class="hero-overlay"></div>
                        <div class="container position-relative d-flex flex-column align-items-center justify-content-center" style="z-index:2; min-height:60vh;">
                            <h1 class="display-3 fw-bold mb-3 text-white" style="text-shadow:0 2px 12px #000,0 0 2px #fff;"><?= htmlspecialchars($banner['title']) ?></h1>
                            <p class="lead mb-4 text-white" style="text-shadow:0 2px 8px #000,0 0 2px #fff;">International camps are a life-changing opportunity to learn, grow, and make global friends.</p>
                            <a href="#destinations" class="btn btn-lg fw-bold px-5 py-3 text-uppercase">Explore Destinations</a>
                        </div>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </header>

    <!-- INTRODUCTION SECTION -->
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

    <?php
    // --- DYNAMIC DESTINATIONS SECTION ---
    // Filter out trashed destinations before including the cards section
    $public_destinations = array_filter($destinations, function($dest) {
        return isset($dest['status']) && $dest['status'] !== 'trash';
    });
    // Make $public_destinations available to the cards section
    // The destination-cards.php should use $public_destinations if set, otherwise fallback to $destinations
    require_once __DIR__ . '/sections/destination-cards.php';
    ?>

    <?php
    // --- FEATURED CATEGORIES SECTION ---
    // Load category and program data
    require_once __DIR__ . '/data/programs.php';
    require_once __DIR__ . '/data/all_programs.php';

    // Count programs in each category and prepare featured categories
    $featured_categories = [];
    foreach ($programs as $category) {
        if ($category['status'] === 'active') {
            // Count active programs in this category whose destination is not trashed
            $program_count = 0;
            foreach ($all_programs as $program) {
                if (
                    isset($program['category_slug']) && $program['category_slug'] === $category['slug'] && $program['status'] === 'active'
                ) {
                    // Check if program's destination is not trashed
                    $destination_trashed = false;
                    foreach ($destinations as $dest) {
                        if (isset($dest['program_ids']) && in_array($program['id'], $dest['program_ids'])) {
                            if (isset($dest['status']) && $dest['status'] === 'trash') {
                                $destination_trashed = true;
                            }
                            break;
                        }
                    }
                    if (!$destination_trashed) {
                        $program_count++;
                    }
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
                <a href="/program/" class="btn btn-primary btn-lg fw-bold px-5 py-3">View All Programs</a>
            </div>
        </div>
    </section>

    <!-- TESTIMONIALS SECTION -->
    <?php require_once __DIR__ . '/sections/testimonials.php'; ?>

</main>

<?php require_once __DIR__ . '/includes/footer.php'; ?>

