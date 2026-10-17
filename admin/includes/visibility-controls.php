<?php
/** Reusable controls: set $visibilityEntity and $visibilityRecord before including. */
require_once __DIR__ . '/../../includes/section-visibility.php';
$visibilityOptions = gocamp_visibility_options($visibilityEntity);
?>
<div class="card border-0 shadow-sm mb-4">
    <div class="card-header bg-transparent border-0 pt-4 pb-2 px-4">
        <h2 class="h5 mb-0 fw-bold"><i class="bi bi-eye me-2"></i>Section Visibility</h2>
    </div>
    <div class="card-body px-4 pb-4">
        <p class="text-muted small">Hide or show parts of this page without deleting their content. Save changes to publish.</p>
        <?php foreach ($visibilityOptions as $visibilityKey => $visibilityOption): ?>
            <?php if (gocamp_gallery_disabled_by_policy($visibilityEntity, $visibilityKey)) continue; ?>
            <?php $visibilityInputId = 'section-visible-' . $visibilityKey; ?>
            <div class="form-check form-switch py-2 border-bottom">
                <input type="hidden" name="section_visibility[<?= htmlspecialchars($visibilityKey, ENT_QUOTES, 'UTF-8') ?>]" value="0">
                <input class="form-check-input" type="checkbox" role="switch"
                    id="<?= htmlspecialchars($visibilityInputId, ENT_QUOTES, 'UTF-8') ?>"
                    name="section_visibility[<?= htmlspecialchars($visibilityKey, ENT_QUOTES, 'UTF-8') ?>]" value="1"
                    <?= gocamp_section_visible($visibilityRecord, $visibilityKey, (bool)$visibilityOption[1]) ? 'checked' : '' ?>>
                <label class="form-check-label" for="<?= htmlspecialchars($visibilityInputId, ENT_QUOTES, 'UTF-8') ?>">
                    <?= htmlspecialchars($visibilityOption[0], ENT_QUOTES, 'UTF-8') ?>
                </label>
            </div>
        <?php endforeach; ?>
    </div>
</div>
