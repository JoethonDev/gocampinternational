<?php
/**
 * File: /sections/destination-hero.php
 * Modern Destination Hero Section
 *
 * This component renders the main banner for a destination page.
 *
 * It expects a single PHP variable in its scope:
 * @var array $destinationData - An associative array containing all details for the current destination.
 *
 * The expected keys are:
 * - 'banner' (string) - Path to the background image.
 * - 'name' (string) - The name of the destination.
 * - 'tagline' (string) - The main tagline for the hero.
 * - 'highlights' (array) - An array of highlight arrays, each with 'icon' and 'text'.
 */

// --- Variable Safety Checks ---
$banner       = $destinationData['banner'] ?? '/images/hero.jpg';
$name         = $destinationData['name'] ?? 'Destination';
$tagline      = $destinationData['tagline'] ?? 'Discover Your Adventure';
$highlights   = $destinationData['highlights'] ?? [];

?>
<section class="destination-hero position-relative overflow-hidden" style="min-height: 90vh;">

    <!-- Background Media -->
    <div class="hero-background position-absolute top-0 start-0 w-100 h-100"
         style="background-image: url('<?= htmlspecialchars($banner) ?>');
                background-size: cover;
                background-position: center;
                background-attachment: fixed;">
    </div>

    <!-- Gradient Overlay -->
    <div class="position-absolute top-0 start-0 w-100 h-100"
         style="background: linear-gradient(135deg, rgba(0, 164, 192, 0.85) 0%, rgba(133, 185, 46, 0.75) 100%);">
    </div>

    <!-- Hero Content -->
    <div class="container position-relative h-100 d-flex align-items-center" style="min-height: 90vh;">
        <div class="row w-100">
            <div class="col-lg-8">
                <!-- Main Heading -->
                <h1 class="display-1 fw-bold text-white mb-4" style="text-shadow: 2px 4px 12px rgba(0,0,0,0.3);">
                    <?= htmlspecialchars($name) ?>
                </h1>

                <!-- Tagline -->
                <p class="lead text-white fs-3 mb-5" style="max-width: 600px; text-shadow: 1px 2px 6px rgba(0,0,0,0.2);">
                    <?= htmlspecialchars($tagline) ?>
                </p>

                <!-- Highlights -->
                <?php if (!empty($highlights)) : ?>
                <div class="row g-3 mb-5">
                    <?php foreach ($highlights as $highlight) : ?>
                        <div class="col-sm-6">
                            <div class="d-flex align-items-center bg-white bg-opacity-15 backdrop-blur rounded-lg p-3 shadow-lg">
                                <div class="flex-shrink-0 bg-brand-accent rounded-circle p-3 me-3 d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                                    <i class="bi bi-<?= htmlspecialchars($highlight['icon'] ?? 'check-circle-fill') ?> fs-4 text-dark"></i>
                                </div>
                                <div class="text-white">
                                    <p class="mb-0 fw-bold"><?= htmlspecialchars($highlight['text']) ?></p>
                                </div>
                            </div>
                        </div>
                    <?php endforeach; ?>
                </div>
                <?php endif; ?>

                <!-- CTA Button -->
                <div class="d-flex flex-wrap gap-3">
                    <a href="#programs" class="btn btn-warning btn-lg px-5 py-3 shadow-xl fw-bold text-uppercase">
                        <i class="bi bi-arrow-down-circle me-2"></i>
                        Explore Programs
                    </a>
                </div>
            </div>
        </div>
    </div>
</section>

