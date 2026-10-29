<?php
/**
 * Image-only destination banner. Preserve the destination name in a
 * screen-reader heading without painting any text over the photo.
 *
 * @var array $destinationData
 */
$banner = !empty($destinationData['banner']) ? $destinationData['banner'] : '/images/hero.webp';
$name = !empty($destinationData['name']) ? $destinationData['name'] : 'Destination';
?>
<section class="destination-hero position-relative overflow-hidden" style="min-height: 90vh;" aria-label="<?= htmlspecialchars($name, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?> banner">
    <div class="container position-relative destination-hero-caption">
        <h1><?= htmlspecialchars($name, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?></h1>
    </div>
    <div class="hero-background position-absolute top-0 start-0 w-100 h-100"
         style="background-image: url('<?= htmlspecialchars($banner, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') ?>');
                background-size: cover;
                background-position: center;
                background-attachment: fixed;">
    </div>
</section>
