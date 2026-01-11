<?php
/**
 * File: /sections/category_card_modern.php
 *
 * Renders a single, dynamic category card for the featured categories section.
 *
 * @var array $category - An associative array with all category details.
 * @var int $program_count - Number of programs in this category
 */

// --- Variable Safety Checks ---
if (!isset($category) || !is_array($category)) {
    echo '<div class="alert alert-danger">Error: Category data missing.</div>';
    return;
}

// --- Data Extraction ---
$categorySlug = $category['slug'] ?? 'unknown';
$name = $category['name'] ?? 'Untitled Category';
$intro = $category['intro'] ?? 'Discover amazing programs in this category.';
$image = $category['banner'] ?? '/images/placeholder.jpg';
$program_count = $program_count ?? 0;

// --- Extract plain text from intro for card display ---
$shortIntro = strip_tags($intro);
if (strlen($shortIntro) > 120) {
    $shortIntro = substr($shortIntro, 0, 120) . '...';
}
?>

<div class="category-card-modern position-relative h-100">
    <div class="card border-0 shadow-lg h-100 overflow-hidden" style="border-radius: 20px;">
        <div class="position-relative overflow-hidden" style="height: 280px;">
            <img src="<?= htmlspecialchars($image) ?>" class="card-img-top h-100 w-100 object-fit-cover category-card-image" alt="<?= htmlspecialchars($name) ?>" loading="lazy" />
            <div class="position-absolute bottom-0 start-0 w-100 h-100" style="background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%);"></div>
            <!-- Badge removed as per requirements -->
            <?php /*
            <div class="position-absolute top-0 end-0 p-3">
                <span class="badge bg-white text-dark fw-bold px-3 py-2 shadow-sm">
                    <i class="bi bi-collection-fill me-1"></i>
                    <?= $program_count ?> Programs
                </span>
            </div>
            */ ?>
            <div class="position-absolute bottom-0 start-0 w-100 p-4">
                <h3 class="text-white fw-bold mb-2 fs-3"><?= htmlspecialchars($name) ?></h3>
                <div class="d-flex align-items-center text-white-50">
                    <i class="bi bi-geo-alt-fill me-2"></i>
                    <span class="fw-medium">Multiple Destinations</span>
                </div>
            </div>
        </div>
        <div class="card-body p-4 d-flex flex-column">
            <p class="card-text text-muted mb-4 flex-grow-1 lh-lg"><?= htmlspecialchars($shortIntro) ?></p>
            
            <div class="mt-auto">
                <div class="d-flex justify-content-between align-items-center mb-3 p-3 rounded-lg" style="background: rgba(0,0,0,0.03);">
                    <div class="text-center flex-fill">
                        <small class="text-muted d-block mb-1">Available Programs</small>
                        <div class="fs-2 fw-bold text-primary"><?= $program_count ?></div>
                    </div>
                    <i class="bi bi-collection fs-1 text-primary opacity-25"></i>
                </div>
                <div class="d-grid gap-2">
                    <a href="/program/category.php?category=<?= htmlspecialchars($categorySlug) ?>" class="btn btn-primary btn-lg fw-bold">
                        <i class="bi bi-arrow-right-circle-fill me-2"></i> Explore Programs
                    </a>
                    <!-- Badge, Get Info button, and related CTA removed as per requirements -->
                    <?php /*
                        <button class="btn btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#ctaModal" data-source="<?= htmlspecialchars($name) ?> Category Card">
                            <i class="bi bi-calendar-check me-2"></i> Get Information
                        </button>
                    */ ?>
                </div>
            </div>
        </div>
    </div>
</div>