<?php
/**
 * File: /sections/program_detail_modal.php
 *
 * Renders a dynamic modal with detailed program information.
 *
 * @var array $program - An associative array with all program details.
 */

// --- Variable Safety Checks ---
if (!isset($program) || !is_array($program)) { return; }

// --- Data Extraction ---
$programId    = $program['id'] ?? uniqid();
$name         = $program['name'] ?? 'Program Details';
$tagline      = $program['tagline'] ?? '';
$image        = $program['image'] ?? '/images/placeholder.jpg';
$ages         = $program['ages'] ?? ['min' => 'N/A', 'max' => ''];
$duration     = $program['duration'] ?? 0;
$level        = $program['level'] ?? 'N/A';
$price        = $program['price'] ?? 'Contact Us';
$description  = $program['description'] ?? '<p>No description available.</p>';
$highlights   = $program['highlights'] ?? [];
$schedule     = $program['schedule'] ?? [];
$includes     = $program['includes'] ?? [];
$excludes     = $program['excludes'] ?? [];
$requirements = $program['requirements'] ?? [];
$gallery      = $program['gallery'] ?? [];
?>

<div class="modal fade" id="programModal-<?= htmlspecialchars($programId) ?>" tabindex="-1" aria-labelledby="programModalLabel-<?= htmlspecialchars($programId) ?>" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-scrollable modal-dialog-centered">
        <div class="modal-content border-0 shadow-2xl" style="border-radius: 20px;">
            <div class="modal-header border-0 position-relative text-white p-0" style="height: 300px; overflow: hidden;">
                <img src="<?= htmlspecialchars($image) ?>" class="position-absolute top-0 start-0 w-100 h-100 object-fit-cover" alt="<?= htmlspecialchars($name) ?>" />
                <div class="position-absolute top-0 start-0 w-100 h-100" style="background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7));"></div>
                <div class="position-relative w-100 d-flex flex-column justify-content-end p-4">
                    <h2 class="modal-title fs-1 fw-bold mb-2" id="programModalLabel-<?= htmlspecialchars($programId) ?>"><?= htmlspecialchars($name) ?></h2>
                    <p class="lead mb-0 opacity-90"><?= htmlspecialchars($tagline) ?></p>
                </div>
                <button type="button" class="btn-close btn-close-white position-absolute top-0 end-0 m-3" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body p-4">
                <div class="row g-3 mb-4 p-3 rounded-lg bg-light">
                    <div class="col-6 col-md-3 text-center"><i class="bi bi-people-fill text-brand-primary fs-2 mb-2"></i><div class="fw-bold text-dark">Ages <?= $ages['min'] ?>-<?= $ages['max'] ?></div><small class="text-muted">Age Range</small></div>
                    <div class="col-6 col-md-3 text-center"><i class="bi bi-calendar-week-fill text-brand-secondary fs-2 mb-2"></i><div class="fw-bold text-dark"><?= $duration ?> Weeks</div><small class="text-muted">Duration</small></div>
                    <div class="col-6 col-md-3 text-center"><i class="bi bi-bar-chart-fill text-brand-accent fs-2 mb-2"></i><div class="fw-bold text-dark"><?= htmlspecialchars($level) ?></div><small class="text-muted">Level</small></div>
                    <div class="col-6 col-md-3 text-center"><i class="bi bi-tag-fill text-brand-primary fs-2 mb-2"></i><div class="fw-bold text-dark"><?= htmlspecialchars($price) ?></div><small class="text-muted">Price</small></div>
                </div>
                <div class="tab-content" id="programTabContent-<?= htmlspecialchars($programId) ?>">
                    <div class="prose"><?= $description ?></div>
                    <?php if (!empty($highlights)) : ?>
                        <div class="mt-4">
                            <h4 class="fw-bold text-brand-dark mb-3">Program Highlights</h4>
                            <div class="row g-3">
                                <?php foreach ($highlights as $highlight) : ?>
                                    <div class="col-md-6"><div class="d-flex align-items-start p-3 rounded bg-light"><i class="bi bi-check-circle-fill text-brand-primary fs-4 me-3 mt-1"></i><span class="text-dark"><?= htmlspecialchars($highlight) ?></span></div></div>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    <?php endif; ?>
                    <?php if (!empty($schedule)) : ?>
                        <div class="mt-4">
                            <h4 class="fw-bold text-brand-dark mb-4">Daily Schedule</h4>
                            <?php foreach ($schedule as $time => $activity) : ?>
                                <div class="d-flex mb-3"><div class="bg-brand-primary text-white rounded-pill px-3 py-2 fw-bold me-3" style="min-width: 100px; text-align: center;"><?= htmlspecialchars($time) ?></div><div class="flex-grow-1 p-3 rounded bg-light"><p class="mb-0 fw-medium text-dark"><?= htmlspecialchars($activity) ?></p></div></div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>
            </div>
            <div class="modal-footer border-0 bg-light p-4">
                <div class="d-flex w-100 align-items-center justify-content-between">
                    <div><div class="fw-bold text-dark fs-5">Ready to join?</div></div>
                    <button type="button" class="btn btn-warning btn-lg fw-bold px-4" data-bs-dismiss="modal" data-bs-toggle="modal" data-bs-target="#ctaModal" data-source="<?= htmlspecialchars($name) ?> Modal">
                        <i class="bi bi-calendar-check-fill me-2"></i> Book Now
                    </button>
                </div>
            </div>
        </div>
    </div>
</div>

