<?php
/**
 * File: /program/category.php
 * This is the UNIVERSAL TEMPLATE for displaying a single program category page.
 *
 * --- UPDATED for new category routing ---
 * - Now handles ?category= URL parameter
 * - Loads category data from programs.php
 * - Shows all programs in the specified category
 */

// --- Load required data first ---
require_once __DIR__ . '/../data/programs.php';
require_once __DIR__ . '/../data/all_programs.php';
require_once __DIR__ . '/../data/destinations.php';

// --- Get category from URL parameter ---
$categorySlug = $_GET['category'] ?? '';

// --- Variable Safety Check ---
if (empty($categorySlug) || !isset($programs[$categorySlug]) || $programs[$categorySlug]['status'] !== 'active') {
    http_response_code(404);
    include __DIR__ . '/../404.php';
    exit;
}

$programData = $programs[$categorySlug];

// --- Find all programs that belong to this category ---
$relatedPrograms = [];
foreach ($all_programs as $program_id => $program) {
    // Check if it's in the correct category and is active
    if (isset($program['category_slug']) && 
        $program['category_slug'] === $categorySlug &&
        isset($program['status']) && $program['status'] === 'active') {
        // Find which destination this program belongs to and check if destination is trashed
        $destination_name = 'Multiple Locations'; // Default
        $destination_slug = '#';
        $destination_trashed = false;
        foreach ($destinations as $dest) {
            if (isset($dest['program_ids']) && in_array($program_id, $dest['program_ids'])) {
                $destination_name = $dest['name'];
                $destination_slug = $dest['slug'];
                if (isset($dest['status']) && $dest['status'] === 'trash') {
                    $destination_trashed = true;
                }
                break;
            }
        }
        // Only add program if its destination is not trashed
        if (!$destination_trashed) {
            $program['destination_name'] = $destination_name;
            $program['destination_slug'] = $destination_slug;
            $relatedPrograms[] = $program;
        }
    }
}
// Sort by order, then name
usort($relatedPrograms, function($a, $b) {
    $orderA = isset($a['order']) ? (int)$a['order'] : PHP_INT_MAX;
    $orderB = isset($b['order']) ? (int)$b['order'] : PHP_INT_MAX;
    if ($orderA === $orderB) {
        return strcasecmp($a['name'] ?? '', $b['name'] ?? '');
    }
    return $orderA - $orderB;
});

// --- Page-specific variables ---
$pageTitle = 'Go Camp :: ' . htmlspecialchars($programData['name']);
$pageDescription = substr(strip_tags($programData['intro']), 0, 160);

require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/navigation.php';
?>

<style>
    /* ... all styles from your original file ... */
    :root {
        --brand-primary: #00a4c0;
        --brand-secondary: #2C3E50;
        --brand-accent: #F9BB08;
    }
    .hero-section {
        position: relative;
        height: 70vh;
        min-height: 500px;
        background: url('<?= htmlspecialchars($programData['banner']) ?>');
        background-size: cover;
        background-repeat: no-repeat;
        background-position: center center;
        background-attachment: fixed;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        text-align: center;
        overflow: hidden;
    }
    .hero-section::before {
        content: '';
        position: absolute;
        left: 0; top: 0; right: 0; bottom: 0;
        background: linear-gradient(0deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 100%);
        z-index: 1;
        pointer-events: none;
    }
    .hero-content {
        position: relative;
        z-index: 2;
        width: 100%;
        max-width: 900px;
        margin: 0 auto;
        animation: fadeInUp 1s ease-out;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem 1rem;
    }
    .hero-section h1 {
        font-size: 3.2rem;
        font-weight: 900;
        text-shadow: 0 2px 12px #000, 0 0 2px #fff;
        margin-bottom: 0.5rem;
        color: #fff;
    }
    .hero-tagline {
        font-size: 1.3rem;
        font-weight: 600;
        letter-spacing: 2px;
        text-shadow: 0 2px 8px #000, 0 0 2px #fff;
        color: #fff;
        margin-bottom: 1.2rem;
    }
    .hero-cta-btn {
        background: #F9BB08;
        color: #222;
        padding: 0.9rem 2.2rem;
        font-size: 1.1rem;
        font-weight: 700;
        border: none;
        border-radius: 50px;
        box-shadow: 0 4px 18px rgba(0,0,0,0.25);
        transition: all 0.2s;
        margin-top: 1.2rem;
        margin-bottom: 0.2rem;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    .hero-cta-btn:hover {
        background: #ffc920;
        color: #111;
        transform: translateY(-2px) scale(1.04);
        box-shadow: 0 8px 32px rgba(0,0,0,0.35);
    }
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

    <section class="hero-section">
        <div class="hero-content">
            <p class="hero-tagline text-uppercase">Program Category</p>
            <h1><?= htmlspecialchars($programData['name']) ?></h1>
            <a href="#category-programs" class="hero-cta-btn">Explore Programs</a>
        </div>
    </section>

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

    <section class="intro-section">
        <div class="container">
            <div class="row align-items-center g-5">
                <div class="col-lg-6">
                    <div class="intro-card">
                        <h2 class="mb-4" style="color: var(--brand-secondary); font-weight: 700;">Experience Learning Like Never Before</h2>
                        <p class="lead" style="font-size: 1.2rem; line-height: 1.8; color: #555;">
                            <?= $programData['intro'] ?>
                        </p>
                    </div>
                </div>
                <div class="col-lg-6">
                    <img src="<?= htmlspecialchars($programData['intro_image']) ?>" alt="<?= htmlspecialchars($programData['name']) ?> Introduction" class="img-fluid intro-image">
                </div>
            </div>
        </div>
    </section>

    <?php foreach ($programData['sections'] as $index => $section) : ?>
    <section class="section-content" style="background-color: <?= ($index % 2 != 0) ? '#f8f9fa' : 'white' ?>;">
        <div class="container">
            <div class="row align-items-center g-5">
                <div class="col-lg-6 <?= ($index % 2 != 0) ? 'order-lg-2' : '' ?>">
                     <div class="content-card">
                        <h2><i class="bi bi-stars feature-icon d-block"></i><?= $section['title'] ?></h2>
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


    <?php if (!empty($relatedPrograms)): ?>
    <section class="section-content bg-light" id="category-programs">
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

    <?php foreach ($relatedPrograms as $program) {
        include __DIR__ . '/../sections/program_detail_modal.php';
    } ?>


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

    <section class="cta-section text-center py-5">
        </section>

    <?php
    require_once __DIR__ . '/../sections/testimonials.php';
    ?>
</main>

<?php
require_once __DIR__ . '/../includes/footer.php';
?>
<script src="https://cdn.jsdelivr.net/npm/bs5-lightbox@1.8.3/dist/index.bundle.min.js"></script>