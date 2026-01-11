<?php
/**
 * File: /program/index.php
 * This page lists ALL available programs from the master all_programs.php file.
 */

// --- Page-specific variables ---
$pageTitle = 'Go Camp :: All Programs';
$pageDescription = 'Explore all available summer camps, from language and arts to sports and leadership programs across our premier destinations.';

// --- Load required data ---
require_once __DIR__ . '/../data/all_programs.php';
require_once __DIR__ . '/../data/destinations.php';
require_once __DIR__ . '/../data/programs.php';

// --- Include Header and Navigation ---
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/navigation.php';

// --- Prepare all programs with destination information ---
$allPrograms = [];
foreach ($all_programs as $program_id => $program) {
    if (!isset($program['status']) || $program['status'] !== 'active') {
        continue;
    }
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
            break; // Found the first destination, stop looping
        }
    }
    // Only add program if its destination is not trashed
    if (!$destination_trashed) {
        $program['destination_name'] = $destination_name;
        $program['destination_slug'] = $destination_slug;
        $allPrograms[] = $program;
    }
}

// --- Group programs by category for better organization and sort by order then name ---
$programsByCategory = [];
foreach ($allPrograms as $program) {
    $categorySlug = $program['category_slug'] ?? 'other';
    
    // Check if category exists and is active, if not treat as 'other'
    if (!empty($categorySlug) && isset($programs[$categorySlug]) && 
        isset($programs[$categorySlug]['status']) && $programs[$categorySlug]['status'] === 'active') {
        // Category is active, use it normally
        $displayCategorySlug = $categorySlug;
    } else {
        // Category is missing, trashed, or inactive - treat as 'other' for display
        $displayCategorySlug = 'other';
    }
    
    if (!isset($programsByCategory[$displayCategorySlug])) {
        $programsByCategory[$displayCategorySlug] = [
            'category' => $programs[$displayCategorySlug] ?? ['name' => 'Other Programs', 'slug' => $displayCategorySlug],
            'programs' => []
        ];
    }
    $programsByCategory[$displayCategorySlug]['programs'][] = $program;
}
// Sort programs in each category by 'order' (asc), then by name (asc)
foreach ($programsByCategory as &$catData) {
    usort($catData['programs'], function($a, $b) {
        $orderA = isset($a['order']) ? (int)$a['order'] : PHP_INT_MAX;
        $orderB = isset($b['order']) ? (int)$b['order'] : PHP_INT_MAX;
        if ($orderA === $orderB) {
            return strcasecmp($a['name'] ?? '', $b['name'] ?? '');
        }
        return $orderA - $orderB;
    });
}
unset($catData);
?>
<main>
    <!-- Hero Section -->
    <section class="py-5 text-center bg-light">
        <div class="container">
            <h1 class="display-4 fw-bold">All Our Programs</h1>
            <p class="lead text-muted">Find the perfect adventure from our complete list of international camps, organized by category.</p>
        </div>
    </section>

    <!-- Category Filter Navigation -->
    <section class="py-3 bg-white border-bottom sticky-top" style="top: 70px; z-index: 1000;">
        <div class="container">
            <div class="d-flex flex-wrap justify-content-center gap-2">
                <a href="#all-programs" class="btn btn-outline-primary btn-sm smooth-scroll">All Programs</a>
                <?php foreach ($programsByCategory as $categoryData): ?>
                    <a href="#category-<?= htmlspecialchars($categoryData['category']['slug']) ?>" class="btn btn-outline-primary btn-sm smooth-scroll">
                        <?= htmlspecialchars($categoryData['category']['name']) ?> 
                        <span class="badge bg-primary ms-1"><?= count($categoryData['programs']) ?></span>
                    </a>
                <?php endforeach; ?>
            </div>
        </div>
    </section>

    <style>
        html {
            scroll-behavior: smooth;
        }
        .smooth-scroll {
            scroll-behavior: smooth;
        }
    </style>

    <!-- Programs by Category -->
    <section class="section-padding" id="all-programs">
        <div class="container">
            <?php if (!empty($programsByCategory)): ?>
                <?php foreach ($programsByCategory as $categorySlug => $categoryData): ?>
                    <div class="mb-5" id="category-<?= htmlspecialchars($categorySlug) ?>">
                        <div class="row align-items-center mb-4">
                            <div class="col-md-8">
                                <h2 class="h3 fw-bold text-primary mb-1"><?= htmlspecialchars($categoryData['category']['name']) ?></h2>
                                <p class="text-muted mb-0"><?= count($categoryData['programs']) ?> programs available</p>
                            </div>
                            <div class="col-md-4 text-md-end">
                                <a href="/program/category.php?category=<?= htmlspecialchars($categorySlug) ?>" class="btn btn-outline-primary">
                                    View Category Details <i class="bi bi-arrow-right ms-1"></i>
                                </a>
                            </div>
                        </div>
                        
                        <div class="row g-4">
                            <?php foreach ($categoryData['programs'] as $program): ?>
                                <div class="col-lg-4 col-md-6">
                                    <?php require __DIR__ . '/../sections/program_card_modern.php'; ?>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                    
                    <?php if ($categorySlug !== array_key_last($programsByCategory)): ?>
                        <hr class="my-5">
                    <?php endif; ?>
                <?php endforeach; ?>
            <?php else: ?>
                <div class="text-center py-5">
                    <i class="bi bi-exclamation-circle display-1 text-muted"></i>
                    <h3 class="mt-3">No programs found</h3>
                    <p class="text-muted">Please check back later for new programs.</p>
                </div>
            <?php endif; ?>
        </div>
    </section>
    
    <?php
    // --- Include Modals for all programs ---
    /*
    if (!empty($allPrograms)) {
        foreach ($allPrograms as $program) {
            require __DIR__ . '/../sections/program_detail_modal.php';
        }
    }
    */
    // --- Final CTA Banner ---
    require_once __DIR__ . '/../sections/booking-cta-banner.php';
    ?>
</main>

<?php
// --- Include Footer ---
require_once __DIR__ . '/../includes/footer.php';
?>
