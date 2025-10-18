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
                    <div class="hero-section d-flex align-items-center text-center" style="background-image: url('images/<?= htmlspecialchars($banner['image']) ?>'); background-size: cover; background-position: center;">
                        <div class="hero-overlay"></div>
                        <div class="container position-relative">
                            <h1 class="display-3 fw-bold mb-3 text-white"><?= htmlspecialchars($banner['title']) ?></h1>
                            <p class="lead mb-4 text-white-50">International camps are a life-changing opportunity to learn, grow, and make global friends.</p>
                            <a href="#destinations" class="btn btn-warning btn-lg fw-bold px-5 py-3 rounded-pill text-uppercase">Explore Destinations</a>
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
    require_once __DIR__ . '/sections/destination-cards.php';
    ?>

    <?php
    // --- FEATURED PROGRAMS SECTION ---
    $all_programs = [];
    foreach ($destinations as $destination) {
        if (isset($destination['programs']) && is_array($destination['programs'])) {
            foreach($destination['programs'] as $p) {
                // Add destination name to each program, which can be useful on other pages
                $p['destination_name'] = $destination['name'];
                $all_programs[] = $p;
            }
        }
    }

    // Find programs that have a 'Popular' badge
    $popular_programs = array_filter($all_programs, function($p) {
        return isset($p['badges']) && is_array($p['badges']) && in_array('Popular', $p['badges']);
    });

    // Get the first 3 popular programs to feature
    $featured_programs = array_slice($popular_programs, 0, 3);
    ?>
    <section id="featured-programs" class="section-padding bg-light">
        <div class="container">
            <div class="text-center mb-5">
                <h2 class="section-title">Featured Programs</h2>
                <p class="lead text-muted">Discover our most popular adventures, chosen by families from around the world.</p>
            </div>
            
            <div class="row g-4 justify-content-center">
                <?php if (!empty($featured_programs)): ?>
                    <?php foreach ($featured_programs as $program): ?>
                        <div class="col-lg-4 col-md-6 d-flex align-items-stretch">
                            <?php // Pass the $program variable to the card component
                            include __DIR__ . '/sections/program_card_modern.php'; ?>
                        </div>
                    <?php endforeach; ?>
                <?php else: ?>
                     <div class="col-12">
                        <p class="text-center text-muted">No featured programs available at the moment. Please check back soon!</p>
                     </div>
                <?php endif; ?>
            </div>
            
            <div class="text-center mt-5 pt-3">
                <a href="/programs" class="btn btn-primary btn-lg fw-bold px-5 py-3">View All Programs</a>
            </div>
        </div>
    </section>

    <!-- TESTIMONIALS SECTION -->
    <?php require_once __DIR__ . '/sections/testimonials.php'; ?>

</main>

<?php require_once __DIR__ . '/includes/footer.php'; ?>

