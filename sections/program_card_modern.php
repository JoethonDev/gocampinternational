<?php
/**
 * File: /sections/program_card_modern.php
 *
 * Renders a single, dynamic program card.
 *
 * @var array $program - An associative array with all program details.
 */

// --- Variable Safety Checks ---
if (!isset($program) || !is_array($program)) {
    echo '<div class="alert alert-danger">Error: Program data missing.</div>';
    return;
}

// --- Data Extraction ---
$programId = $program['id'] ?? uniqid();
$name = $program['name'] ?? 'Untitled Program';
$tagline = $program['tagline'] ?? 'No description.';
$image = $program['image'] ?? '/images/placeholder.jpg';
$ages = isset($program['ages']) && !empty($program['ages']) ? $program['ages'] : null;
$duration = isset($program['duration']) && $program['duration'] > 0 ? $program['duration'] : null;
$level = isset($program['level']) && !empty($program['level']) ? $program['level'] : 'All';
$price = isset($program['price']) && !empty($program['price']) ? $program['price'] : 'Contact Us';
$highlights = isset($program['highlights']) && !empty($program['highlights']) ? $program['highlights'] : null;
$badges = isset($program['badges']) && !empty($program['badges']) ? $program['badges'] : null;
$color = $program['color'] ?? 'primary';

// --- Color Mapping ---
$colorClasses = [
    'primary'   => ['bg' => 'bg-brand-primary', 'text' => 'text-brand-primary'],
    'secondary' => ['bg' => 'bg-brand-secondary', 'text' => 'text-brand-secondary'],
    'accent'    => ['bg' => 'bg-brand-accent', 'text' => 'text-brand-accent']
];
$colors = $colorClasses[$color] ?? $colorClasses['primary'];
?>

<div class="program-card-modern position-relative h-100">
    <div class="card border-0 shadow-lg h-100 overflow-hidden" style="border-radius: 20px;">
        <div class="position-relative overflow-hidden" style="height: 280px;">
            <img src="<?= htmlspecialchars($image) ?>" class="card-img-top h-100 w-100 object-fit-cover program-card-image" alt="<?= htmlspecialchars($name) ?>" loading="lazy" />
            <div class="position-absolute bottom-0 start-0 w-100 h-100" style="background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 60%);"></div>
            <div class="position-absolute top-0 start-0 w-100 p-3">
                <div class="d-flex justify-content-between align-items-start">
                    <?php if ($level): ?>
                        <span class="badge bg-white text-dark fw-bold px-3 py-2 shadow-sm"><?= htmlspecialchars($level) ?></span>
                    <?php else: ?>
                        <div></div> <!-- Empty div to maintain flex layout -->
                    <?php endif; ?>
                    <?php if ($badges) : ?>
                        <div class="d-flex gap-2">
                            <?php foreach ($badges as $badge) : ?>
                                <span class="badge <?= $colors['bg'] ?> text-white fw-bold px-3 py-2 shadow-sm"><?= htmlspecialchars($badge) ?></span>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
            <?php if ($ages || $duration): ?>
            <div class="position-absolute bottom-0 start-0 w-100 p-3">
                <div class="d-flex align-items-center gap-3 text-white">
                    <?php if ($ages && isset($ages['min']) && isset($ages['max'])): ?>
                        <div class="d-flex align-items-center bg-white bg-opacity-25 backdrop-blur rounded-pill px-3 py-2">
                            <i class="bi bi-people-fill me-2"></i>
                            <span class="fw-bold"><?= $ages['min'] ?>-<?= $ages['max'] ?> years</span>
                        </div>
                    <?php endif; ?>
                    <?php if ($duration): ?>
                        <div class="d-flex align-items-center bg-white bg-opacity-25 backdrop-blur rounded-pill px-3 py-2">
                            <i class="bi bi-calendar-week-fill me-2"></i>
                            <span class="fw-bold"><?= $duration ?> Weeks</span>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
            <?php endif; ?>
        </div>
        <div class="card-body p-4 d-flex flex-column">
            <h3 class="card-title fw-bold mb-2 text-brand-dark fs-4"><?= htmlspecialchars($name) ?></h3>
            <p class="card-text text-muted mb-3 flex-grow-1"><?= htmlspecialchars($tagline) ?></p>
                <?php if (!empty($program['gallery'])): ?>
                <div class="mb-3">
                    <div class="row g-2">
                        <?php foreach (array_slice($program['gallery'], 0, 4) as $img): ?>
                            <div class="col-6 col-md-3 mb-2">
                                <img src="<?= htmlspecialchars($img) ?>" alt="<?= htmlspecialchars($name) ?> photo" class="img-fluid rounded shadow-sm w-100" style="object-fit:cover;max-height:120px;" loading="lazy">
                            </div>
                        <?php endforeach; ?>
                    </div>
                    <?php if (count($program['gallery']) > 4): ?>
                        <button class="btn btn-link p-0 mt-2 text-brand-primary text-decoration-none fw-bold" data-bs-toggle="modal" data-bs-target="#programModal-<?= htmlspecialchars($programId) ?>">
                            +<?= count($program['gallery']) - 4 ?> more photos <i class="bi bi-arrow-right ms-1"></i>
                        </button>
                    <?php endif; ?>
                </div>
                <?php endif; ?>
            <?php if ($highlights || $price): ?>
                <hr class="my-3" />
            <?php endif; ?>
            <?php if ($highlights) : ?>
            <div class="mb-3">
                <ul class="list-unstyled mb-0">
                    <?php foreach (array_slice($highlights, 0, 3) as $highlight) : ?>
                        <li class="mb-2 d-flex align-items-start">
                            <i class="bi bi-check-circle-fill <?= $colors['text'] ?> me-2 mt-1"></i>
                            <span class="text-dark"><?= htmlspecialchars($highlight) ?></span>
                        </li>
                    <?php endforeach; ?>
                </ul>
                <?php if (count($highlights) > 3) : ?>
                    <button class="btn btn-link p-0 mt-2 <?= $colors['text'] ?> text-decoration-none fw-bold" data-bs-toggle="modal" data-bs-target="#programModal-<?= htmlspecialchars($programId) ?>">
                        +<?= count($highlights) - 3 ?> more features <i class="bi bi-arrow-right ms-1"></i>
                    </button>
                <?php endif; ?>
            </div>
            <?php endif; ?>
            <div class="mt-auto">
                <?php if ($price): ?>
                <div class="d-flex justify-content-between align-items-center mb-3 p-3 rounded-lg" style="background: rgba(0,0,0,0.03);">
                    <div>
                        <small class="text-muted d-block mb-1">Starting from</small>
                        <div class="fs-3 fw-bold <?= $colors['text'] ?>"><?= htmlspecialchars($price) ?></div>
                    </div>
                    <i class="bi bi-tag-fill fs-1 <?= $colors['text'] ?> opacity-25"></i>
                </div>
                <?php endif; ?>
                <div class="d-grid gap-2">
                    <button class="btn <?= $colors['bg'] ?> text-white btn-lg fw-bold" data-bs-toggle="modal" data-bs-target="#ctaModal" data-source="<?= htmlspecialchars($name) ?> Card">
                        <i class="bi bi-calendar-check-fill me-2"></i> Reserve Your Spot
                    </button>
                    <button class="btn btn-outline-secondary" data-bs-toggle="modal" data-bs-target="#programModal-<?= htmlspecialchars($programId) ?>">
                        <i class="bi bi-info-circle me-2"></i> View Full Details
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

