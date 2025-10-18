<?php
/**
 * File: /program/category.php
 * This is the UNIVERSAL TEMPLATE for displaying a single program category page.
 * It uses a new, attractive layout and dynamically finds and lists all relevant programs.
 * UPDATED: Color theme changed to main brand color (cyan) and intro block added.
 */

// --- Variable Safety Check ---
if (!isset($programData) || !is_array($programData)) {
    http_response_code(404);
    include __DIR__ . '/../404.php';
    exit;
}
if (!isset($destinations) || !is_array($destinations)) {
    require_once __DIR__ . '/../data/destinations.php';
}

// --- Find all programs that belong to this category ---
$relatedPrograms = [];
foreach ($destinations as $destination) {
    if (isset($destination['programs']) && is_array($destination['programs'])) {
        foreach ($destination['programs'] as $program) {
            if (isset($program['category_slug']) && $program['category_slug'] === $programData['slug']) {
                $program['destination_name'] = $destination['name'];
                $program['destination_slug'] = $destination['slug'];
                $relatedPrograms[] = $program;
            }
        }
    }
}

// --- Page-specific variables ---
$pageTitle = 'Go Camp :: ' . htmlspecialchars($programData['name']);
$pageDescription = substr(strip_tags($programData['intro']), 0, 160);

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/navigation.php';
?>

<!-- Custom Styles for this Page Layout -->
<style>
    :root {
        /* UPDATED: Changed primary color to cyan and adjusted others */
        --brand-primary: #00a4c0;
        --brand-secondary: #2C3E50;
        --brand-accent: #F9BB08; /* Kept yellow as an accent */
    }
    .hero-section {
        position: relative; height: 70vh; min-height: 500px;
        /* UPDATED: Changed gradient to match new primary color */
        background: linear-gradient(135deg, rgba(0, 164, 192, 0.8), rgba(44, 62, 80, 0.8)), url('<?= htmlspecialchars($programData['banner']) ?>');
        background-size: cover; background-position: center; background-attachment: fixed;
        display: flex; align-items: center; justify-content: center;
        color: white; text-align: center; overflow: hidden;
    }
    .hero-content { position: relative; z-index: 2; animation: fadeInUp 1s ease-out; }
    .hero-section h1 { font-size: 4rem; font-weight: 800; text-shadow: 3px 3px 10px rgba(0,0,0,0.3); margin-bottom: 1.5rem; }
    .hero-tagline { font-size: 1.8rem; font-weight: 300; letter-spacing: 2px; text-shadow: 2px 2px 8px rgba(0,0,0,0.3); }
    .intro-section { padding: 80px 0; background: white; }
    .intro-card { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); border-radius: 20px; padding: 40px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); border-left: 6px solid var(--brand-primary); }
    .intro-image { border-radius: 20px; box-shadow: 0 15px 50px rgba(0,0,0,0.2); transition: transform 0.3s ease; }
    .intro-image:hover { transform: scale(1.03); }
    .section-content { padding: 80px 0; }
    .content-card { background: white; border-radius: 25px; padding: 50px; box-shadow: 0 20px 60px rgba(0,0,0,0.1); transition: transform 0.3s ease, box-shadow 0.3s ease; }
    .content-card:hover { transform: translateY(-10px); box-shadow: 0 30px 80px rgba(0,0,0,0.15); }
    .content-card h2 { font-size: 2.5rem; font-weight: 700; color: var(--brand-secondary); margin-bottom: 30px; position: relative; padding-bottom: 15px; }
    .content-card h2::after { content: ''; position: absolute; bottom: 0; left: 0; width: 80px; height: 4px; background: var(--brand-primary); border-radius: 2px; }
    .content-image { border-radius: 20px; box-shadow: 0 15px 50px rgba(0,0,0,0.2); transition: transform 0.3s ease; }
    .content-image:hover { transform: scale(1.03); }
    .feature-icon { font-size: 3rem; color: var(--brand-primary); margin-bottom: 20px; }
    .gallery-section { padding: 80px 0; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);}
    .btn-cta { background: var(--brand-accent); color: var(--brand-secondary); padding: 18px 50px; font-size: 1.3rem; font-weight: 700; border: none; border-radius: 50px; box-shadow: 0 10px 30px rgba(249, 187, 8, 0.4); transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 1px; }
    .btn-cta:hover { transform: translateY(-5px); box-shadow: 0 15px 40px rgba(249, 187, 8, 0.6); background: #ffc920; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(30px); } to { opacity: 1; transform: translateY(0); } }
</style>

<main id="main-content">

    <!-- Hero Section -->
    <section class="hero-section">
        <div class="hero-content">
            <p class="hero-tagline text-uppercase">Program Category</p>
            <h1><?= htmlspecialchars($programData['name']) ?></h1>
        </div>
    </section>

    <!-- Breadcrumb -->
    <div class="bg-light border-bottom">
        <div class="container py-2">
            <nav aria-label="breadcrumb">
                <ol class="breadcrumb mb-0">
                    <li class="breadcrumb-item"><a href="/">HOME</a></li>
                    <li class="breadcrumb-item"><a href="/programs">ALL PROGRAMS</a></li>
                    <li class="breadcrumb-item active" aria-current="page"><?= strtoupper(htmlspecialchars($programData['name'])) ?></li>
                </ol>
            </nav>
        </div>
    </div>

    <!-- NEW: Introduction Section -->
    <section class="intro-section">
        <div class="container">
            <div class="row align-items-center g-5">
                <div class="col-lg-6">
                    <div class="intro-card">
                        <h2 class="mb-4" style="color: var(--brand-secondary); font-weight: 700;">Experience Learning Like Never Before</h2>
                        <p class="lead" style="font-size: 1.2rem; line-height: 1.8; color: #555;">
                            <?= htmlspecialchars($programData['intro']) ?>
                        </p>
                    </div>
                </div>
                <div class="col-lg-6">
                    <img src="<?= htmlspecialchars($programData['intro_image']) ?>" alt="<?= htmlspecialchars($programData['name']) ?> Introduction" class="img-fluid intro-image">
                </div>
            </div>
        </div>
    </section>

    <!-- Content Sections from Data -->
    <?php foreach ($programData['sections'] as $index => $section) : ?>
    <section class="section-content" style="background-color: <?= ($index % 2 != 0) ? '#f8f9fa' : 'white' ?>;">
        <div class="container">
            <div class="row align-items-center g-5">
                <div class="col-lg-6 <?= ($index % 2 != 0) ? 'order-lg-2' : '' ?>">
                     <div class="content-card">
                        <h2><i class="bi bi-stars feature-icon d-block"></i><?= htmlspecialchars($section['title']) ?></h2>
                        <div class="text-muted" style="font-size: 1.1rem; line-height: 1.9; color: #555;">
                            <?= $section['content'] // Content is already HTML ?>
                        </div>
                    </div>
                </div>
                <div class="col-lg-6 <?= ($index % 2 != 0) ? 'order-lg-1' : '' ?>">
                     <img src="<?= htmlspecialchars($section['image']) ?>" alt="<?= htmlspecialchars($section['title']) ?>" class="img-fluid content-image">
                </div>
            </div>
        </div>
    </section>
    <?php endforeach; ?>


    <!-- Related Programs Section -->
    <?php if (!empty($relatedPrograms)): ?>
    <section class="section-content bg-light">
        <div class="container">
            <div class="text-center mb-5">
                <h2 class="section-title">Find Your <?= htmlspecialchars($programData['name']) ?> Adventure</h2>
                <p class="lead text-muted">These programs are available in the following destinations.</p>
            </div>
            <div class="row g-4 justify-content-center">
                <?php foreach ($relatedPrograms as $program): ?>
                    <div class="col-lg-4 col-md-6 d-flex align-items-stretch">
                        <?php include __DIR__ . '/../sections/program_card_modern.php'; ?>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </section>
    <?php endif; ?>

    <!-- Modals for the programs -->
    <?php foreach ($relatedPrograms as $program) {
        include __DIR__ . '/../sections/program_detail_modal.php';
    } ?>


    <!-- Gallery Section -->
    <?php if (!empty($programData['gallery'])) : ?>
    <section class="gallery-section">
        <div class="container">
             <div class="text-center mb-5">
                <h2 class="section-title text-white">Program Gallery</h2>
            </div>
            <div class="row g-3">
                <?php foreach ($programData['gallery'] as $image) : ?>
                    <div class="col-lg-4 col-md-6">
                        <a href="<?= htmlspecialchars($image) ?>" data-toggle="lightbox" data-gallery="program-gallery">
                            <img src="<?= htmlspecialchars($image) ?>" class="img-fluid rounded-3 shadow-sm w-100" style="height: 250px; object-fit: cover;" alt="<?= htmlspecialchars($programData['name']) ?> gallery image" />
                        </a>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
    </section>
    <?php endif; ?>

    <!-- CTA Section -->
    <section class="cta-section text-center py-5">
        <div class="container">
            <h2 class="display-5 fw-bold">Ready to Start Your Adventure?</h2>
            <p class="lead mb-4">Join thousands of students who have transformed their lives through our programs.</p>
            <button class="btn btn-cta" data-bs-toggle="modal" data-bs-target="#ctaModal">
                <i class="bi bi-calendar-check me-2"></i>Book Your Program Now
            </button>
        </div>
    </section>

    <?php
    require_once __DIR__ . '/../sections/testimonials.php';
    ?>
</main>

<?php
require_once __DIR__ . '/../includes/footer.php';
?>
<!-- Simple Lightbox library for the gallery -->
<script src="https://cdn.jsdelivr.net/npm/bs5-lightbox@1.8.3/dist/index.bundle.min.js"></script>

