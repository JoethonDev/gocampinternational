<?php
/**
 * File: /sections/destination-cards.php (NEW)
 * This component renders the grid of destination cards for the homepage.
 */
?>
<section id="destinations" class="section-padding bg-light">
    <div class="container">
        <h2 class="section-title text-center mb-5">Our Destinations</h2>
        <div class="row g-4 justify-content-center">
            <?php if (isset($destinations) && !empty($destinations)): ?>
                <?php foreach ($destinations as $destination): ?>
                    <div class="col-sm-6 col-lg-4">
                        <a href="/destinations/<?= htmlspecialchars($destination['slug']) ?>" class="card text-white border-0 shadow-sm program-card-home">
                            <img src="<?= htmlspecialchars($destination['banner']) ?>" class="card-img" alt="<?= htmlspecialchars($destination['name']) ?>">
                            <div class="card-img-overlay d-flex align-items-end p-0">
                                <div class="w-100 text-start p-3" style="background: linear-gradient(to top, var(--brand-primary), transparent);">
                                    <h5 class="card-title fw-bold m-0"><?= htmlspecialchars($destination['name']) ?></h5>
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
