<?php
/**
 * File: /sections/destination-cards.php (NEW)
 * This component renders the grid of destination cards for the homepage.
 */
require_once __DIR__ . '/../includes/content-description.php';
?>
<section id="destinations" class="section-padding bg-light">
    <div class="container">
        <h2 class="section-title text-center mb-5">Our Destinations</h2>
        <div class="row g-4 justify-content-center">
            <?php
            // Use $public_destinations if set, otherwise fallback to $destinations.
            // Unified rule: only show destinations with status === 'active'.
            $dest_list = isset($public_destinations) ? $public_destinations : (isset($destinations) ? $destinations : []);
            $dest_list = array_filter($dest_list, function ($d) {
                return isset($d['status']) && $d['status'] === 'active';
            });
            ?>
            <?php if (!empty($dest_list)): ?>
                <?php foreach ($dest_list as $destination): ?>
                    <?php
                    $descriptionPreview = gocamp_description_excerpt((string)($destination['intro_text'] ?? ''));
                    if ($descriptionPreview === '') {
                        $descriptionPreview = gocamp_description_excerpt((string)($destination['tagline'] ?? ''));
                    }
                    ?>
                    <div class="col-sm-6 col-lg-4">
                        <a href="/destinations/<?= htmlspecialchars($destination['slug']) ?>" class="card text-white border-0 shadow-sm program-card-home">
                            <img src="<?= htmlspecialchars($destination['banner']) ?>" class="card-img" alt="<?= htmlspecialchars($destination['name']) ?>">
                            <div class="card-img-overlay d-flex align-items-end p-0">
                                <div class="w-100 text-start p-3 destination-card-caption">
                                    <h5 class="card-title fw-bold m-0"><?= htmlspecialchars($destination['name']) ?></h5>
                                    <?php if ($descriptionPreview !== ''): ?>
                                    <p class="destination-card-description text-white mb-0 mt-2"><?= htmlspecialchars($descriptionPreview, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></p>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </a>
                    </div>
                <?php endforeach; ?>
            <?php else: ?>
                <p class="text-center">Destinations will be listed here soon!</p>
            <?php endif; ?>
        </div>
    </div>
</section>
