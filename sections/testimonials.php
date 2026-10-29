<?php
/** Photo memories with factual captions; shared by home, category and destination pages. */
require_once __DIR__ . '/../includes/camp-memories.php';
$memoriesConfig = gocamp_load_memories();
$campMemories = array_values(array_filter($memoriesConfig['items'], static fn($item) => ($item['is_active'] ?? true) === true && ($item['in_slider'] ?? true) === true));
if (!$campMemories) return;
?>
<section class="section-padding camp-memories" aria-labelledby="camp-memories-title">
    <div class="container">
        <h2 id="camp-memories-title" class="section-title text-center text-lg-start mb-5"><?= htmlspecialchars($memoriesConfig['title'], ENT_QUOTES, 'UTF-8') ?></h2>
        <div class="row gx-lg-5 align-items-start">
            <div class="<?= !empty($memoriesConfig['show_facebook']) ? 'col-lg-8' : 'col-12' ?> mb-5 mb-lg-0">
                <div class="camp-memories-slider">
                    <button type="button" class="btn btn-outline-primary camp-memories-arrow" data-memories-direction="-1" aria-label="Previous memories" aria-controls="camp-memories-track" hidden>&larr;</button>
                <div id="camp-memories-track" class="camp-memories-track" tabindex="0" role="region" aria-label="Camper photo memories">
                        <?php foreach ($campMemories as $memory): ?>
                        <figure class="camp-memory card border-0 shadow-sm mb-0">
                            <a href="/images/<?= htmlspecialchars($memory['image'], ENT_QUOTES, 'UTF-8') ?>"
                               data-toggle="lightbox" aria-label="View photo: <?= htmlspecialchars($memory['caption'], ENT_QUOTES, 'UTF-8') ?>">
                                <img src="/images/<?= htmlspecialchars($memory['image'], ENT_QUOTES, 'UTF-8') ?>"
                                     alt="<?= htmlspecialchars($memory['caption'], ENT_QUOTES, 'UTF-8') ?>"
                                     loading="lazy" decoding="async" width="640" height="480">
                            </a>
                            <figcaption class="p-3 text-center"><?= htmlspecialchars($memory['caption'], ENT_QUOTES, 'UTF-8') ?></figcaption>
                        </figure>
                        <?php endforeach; ?>
                </div>
                    <button type="button" class="btn btn-outline-primary camp-memories-arrow" data-memories-direction="1" aria-label="Next memories" aria-controls="camp-memories-track" hidden>&rarr;</button>
                </div>
            </div>
            <?php if (!empty($memoriesConfig['show_facebook'])): ?>
            <div class="col-lg-4">
                <div class="card shadow-lg">
                    <div class="card-body p-2">
                        <div class="fb-page" data-href="https://www.facebook.com/GoCampGo" data-tabs="timeline" data-width="500" data-height="450" data-small-header="false" data-adapt-container-width="true" data-hide-cover="false" data-show-facepile="true" data-lazy="true">
                            <blockquote cite="https://www.facebook.com/GoCampGo" class="fb-xfbml-parse-ignore"><a href="https://www.facebook.com/GoCampGo">Go Camp International</a></blockquote>
                        </div>
                        <div class="text-center mt-2">
                            <a href="https://www.facebook.com/GoCampGo" target="_blank" rel="noopener" class="btn btn-sm btn-outline-primary">View on Facebook</a>
                        </div>
                    </div>
                </div>
            </div>
            <?php endif; ?>
        </div>
    </div>
</section>
