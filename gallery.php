<?php
require_once __DIR__ . '/includes/camp-memories.php';
$galleryConfig = gocamp_load_memories();
$countryGroups = gocamp_group_memories($galleryConfig['items']);
$pageTitle = 'Photo Gallery | Go Camp International';
$pageDescription = 'Explore Go Camp memories, activities and camp facilities in a photo gallery grouped by country.';
require __DIR__ . '/includes/header.php';
?>
<div class="page-content">
    <section class="section-padding camp-country-gallery">
        <div class="container">
            <h1 class="section-title">Go Camp Photo Gallery</h1>
            <p class="lead mb-4">Camp friendships, adventures and places to remember.</p>
            <?php if (!$countryGroups): ?>
                <p>New camp memories are coming soon.</p>
            <?php else: ?>
                <nav class="d-flex flex-wrap gap-2 mb-5" aria-label="Gallery countries">
                    <?php $groupIndex = 0; foreach ($countryGroups as $country => $photos): ?>
                    <a class="btn btn-outline-primary" href="#gallery-country-<?= $groupIndex++ ?>"><?= htmlspecialchars($country ?: 'More camp moments', ENT_QUOTES, 'UTF-8') ?> <span aria-label="photos">(<?= count($photos) ?>)</span></a>
                    <?php endforeach; ?>
                </nav>
                <?php $groupIndex = 0; foreach ($countryGroups as $country => $photos): ?>
                <section class="camp-country-group mb-5" aria-labelledby="gallery-country-<?= $groupIndex ?>">
                    <h2 id="gallery-country-<?= $groupIndex++ ?>" class="h3 mb-4"><?= htmlspecialchars($country ?: 'More camp moments', ENT_QUOTES, 'UTF-8') ?></h2>
                    <div class="camp-country-grid">
                        <?php foreach ($photos as $photo): ?>
                        <figure class="card border-0 shadow-sm mb-0 camp-gallery-photo">
                            <a href="<?= htmlspecialchars(gocamp_memory_url($photo['image']), ENT_QUOTES, 'UTF-8') ?>" data-toggle="lightbox" aria-label="View photo: <?= htmlspecialchars($photo['caption'], ENT_QUOTES, 'UTF-8') ?>">
                                <img src="<?= htmlspecialchars(gocamp_memory_url($photo['image']), ENT_QUOTES, 'UTF-8') ?>" alt="<?= htmlspecialchars($photo['caption'], ENT_QUOTES, 'UTF-8') ?>" loading="lazy" decoding="async" width="640" height="480">
                            </a>
                            <figcaption class="p-3 text-center"><?= htmlspecialchars($photo['caption'], ENT_QUOTES, 'UTF-8') ?></figcaption>
                        </figure>
                        <?php endforeach; ?>
                    </div>
                </section>
                <?php endforeach; ?>
            <?php endif; ?>
        </div>
    </section>
</div>
<?php require __DIR__ . '/includes/footer.php'; ?>
