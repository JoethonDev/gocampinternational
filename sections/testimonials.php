<?php
/**
 * File: /sections/testimonials.php
 *
 * Renders a testimonial slider section.
 *
 * It can use a passed $testimonials variable. If not provided, it falls back to mock data.
 * @var array $testimonials (optional) - An array of testimonial items. Each with 'image', 'name', 'quote'.
 */

// --- Use provided testimonials or fall back to mock data ---
if (!isset($testimonials) || !is_array($testimonials) || empty($testimonials)) {
    $testimonials = [
        [
            'image' => 'test_img.jpg',
            'name'  => 'Maria & Family (from Egypt)',
            'quote' => 'An experience that changed our perspective! The organization was flawless and the activities were both fun and educational.'
        ],
        [
            'image' => 'about_img_3.jpg',
            'name'  => 'Ahmed S. (from Egypt)',
            'quote' => 'The best summer of my life! I learned so much, not just about the language but about myself. The counselors were amazing.'
        ]
    ];
}
?>
<section class="section-padding">
    <div class="container">
        <div class="row gx-lg-5 align-items-center">
            <div class="col-lg-7 mb-5 mb-lg-0">
                <h2 class="section-title text-center text-lg-start mb-5">What Our Families Say</h2>
                <div id="testimonialsCarousel" class="carousel slide" data-bs-ride="carousel">
                    <div class="carousel-inner">
                        <?php foreach ($testimonials as $index => $testimonial) : ?>
                        <div class="carousel-item <?= $index === 0 ? 'active' : '' ?>">
                            <div class="card shadow-lg border-0">
                                <div class="card-body p-4 p-md-5">
                                    <div class="row align-items-center">
                                        <div class="col-md-4 text-center">
                                            <img src="/images/<?= htmlspecialchars($testimonial['image']) ?>"
                                                 class="img-fluid rounded-circle mb-3 mb-md-0"
                                                 alt="Testimonial from <?= htmlspecialchars($testimonial['name']) ?>"
                                                 style="width: 150px; height: 150px; object-fit: cover;"/>
                                        </div>
                                        <div class="col-md-8">
                                            <i class="bi bi-quote fs-1 opacity-25 text-brand-primary"></i>
                                            <p class="lead fst-italic mb-3">"<?= htmlspecialchars($testimonial['quote']) ?>"</p>
                                            <footer class="blockquote-footer fs-5"><?= htmlspecialchars($testimonial['name']) ?></footer>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <?php endforeach; ?>
                    </div>
                    <?php if (count($testimonials) > 1) : ?>
                    <button class="carousel-control-prev" type="button" data-bs-target="#testimonialsCarousel" data-bs-slide="prev">
                        <span class="carousel-control-prev-icon" aria-hidden="true"></span><span class="visually-hidden">Previous</span>
                    </button>
                    <button class="carousel-control-next" type="button" data-bs-target="#testimonialsCarousel" data-bs-slide="next">
                        <span class="carousel-control-next-icon" aria-hidden="true"></span><span class="visually-hidden">Next</span>
                    </button>
                    <?php endif; ?>
                </div>
            </div>
            <div class="col-lg-5">
                 <div class="card shadow-lg">
                    <div class="card-body p-2">
                        <div class="fb-page" data-href="https://www.facebook.com/GoCampGo" data-tabs="timeline" data-height="450" data-small-header="false" data-adapt-container-width="true" data-hide-cover="false" data-show-facepile="true">
                            <blockquote cite="https://www.facebook.com/GoCampGo" class="fb-xfbml-parse-ignore"><a href="https://www.facebook.com/GoCampGo">Go Camp International</a></blockquote>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</section>

