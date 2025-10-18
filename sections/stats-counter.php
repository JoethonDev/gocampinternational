<?php
/**
 * File: /sections/stats-counter.php
 * Animated Statistics Counter Section
 *
 * This component renders a row of animated statistics.
 *
 * It expects the following variables in its scope:
 * @var array $stats - An array of statistic arrays. Each inner array should have:
 * - 'number' (int) - The target number.
 * - 'label' (string) - The text description.
 * - 'suffix' (string, optional) - Suffix like '%' or '+'.
 * - 'icon' (string) - The name of the Bootstrap icon to use.
 *
 * @var string $sectionTitle (optional) - The main heading for the section.
 * @var string $sectionDescription (optional) - The subheading for the section.
 */

// --- Variable Safety Checks ---
$stats              = $stats ?? [];
$sectionTitle       = $sectionTitle ?? 'Our Track Record';
$sectionDescription = $sectionDescription ?? 'Numbers that speak for themselves';

?>
<section class="stats-counter-section py-5 position-relative overflow-hidden">
    <div class="position-absolute top-0 start-0 w-100 h-100"
         style="background: linear-gradient(135deg, var(--brand-primary) 0%, var(--brand-secondary) 100%);">
    </div>
    <div class="container position-relative" style="z-index: 2;">
        <div class="text-center mb-5">
            <h2 class="display-4 fw-bold text-white mb-3"><?= htmlspecialchars($sectionTitle) ?></h2>
            <p class="lead text-white opacity-90"><?= htmlspecialchars($sectionDescription) ?></p>
        </div>
        <div class="row g-4">
            <?php foreach ($stats as $stat) :
                $number = $stat['number'] ?? 0;
                $label = $stat['label'] ?? 'Stat';
                $suffix = $stat['suffix'] ?? '';
                $icon = $stat['icon'] ?? 'star-fill';
                ?>
                <div class="col-6 col-md-3">
                    <div class="stat-card text-center p-4 rounded-lg bg-white bg-opacity-10 backdrop-blur h-100 transition-all">
                        <div class="mb-3">
                            <div class="d-inline-flex align-items-center justify-content-center rounded-circle p-3 bg-brand-accent"
                                 style="width: 80px; height: 80px;">
                                <i class="bi bi-<?= htmlspecialchars($icon) ?> text-dark" style="font-size: 2rem;"></i>
                            </div>
                        </div>
                        <div class="stat-number display-3 fw-bold text-white mb-2"
                             data-target="<?= htmlspecialchars($number) ?>"
                             data-suffix="<?= htmlspecialchars($suffix) ?>">
                            0<?= htmlspecialchars($suffix) ?>
                        </div>
                        <p class="stat-label text-white fs-6 mb-0 opacity-90">
                            <?= htmlspecialchars($label) ?>
                        </p>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </div>
</section>

<style>
.stat-card:hover {
    transform: translateY(-10px) scale(1.05);
    background-color: rgba(255,255,255,0.2) !important;
}
.backdrop-blur {
    backdrop-filter: blur(10px);
}
</style>

<script>
// Self-contained script to animate the counters when they become visible.
document.addEventListener('DOMContentLoaded', function() {
    const counters = document.querySelectorAll('.stat-number');
    if (counters.length === 0) return;

    const animateCounter = (counter) => {
        const target = +counter.getAttribute('data-target');
        const suffix = counter.getAttribute('data-suffix') || '';
        const duration = 2000; // Animation duration in ms
        const increment = target / (duration / 16);
        let current = 0;

        const updateCounter = () => {
            current += increment;
            if (current < target) {
                counter.textContent = Math.floor(current).toLocaleString() + suffix;
                requestAnimationFrame(updateCounter);
            } else {
                counter.textContent = target.toLocaleString() + suffix;
            }
        };
        updateCounter();
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounter(entry.target);
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
});
</script>

