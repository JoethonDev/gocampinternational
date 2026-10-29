<?php
/** Reusable tri-state controls for destinations, categories, and individual programs.
 * A missing override inherits the Site Visibility global default.
 */
require_once __DIR__ . '/../../includes/section-visibility.php';
$visibilityOptions = gocamp_visibility_options($visibilityEntity);
$overrides = $visibilityRecord['section_visibility'] ?? [];
$overrides = is_array($overrides) ? $overrides : [];
?>
<div class="card border-0 shadow-sm mb-4">
  <div class="card-header bg-transparent border-0 pt-4 pb-2 px-4">
    <h2 class="h5 mb-0 fw-bold"><i class="bi bi-eye me-2"></i>Section Visibility</h2>
  </div>
  <div class="card-body px-4 pb-4">
    <p class="text-muted small">Use global follows Site Visibility settings. Show and Hide override the global rule for this item.</p>
    <div class="row g-3">
    <?php foreach ($visibilityOptions as $key => $option): ?>
      <?php if (gocamp_gallery_disabled_by_policy($visibilityEntity, $key)) continue; ?>
      <?php $inputId = 'section-visible-' . $visibilityEntity . '-' . $key;
        $choice = array_key_exists($key, $overrides)
          ? (filter_var($overrides[$key], FILTER_VALIDATE_BOOLEAN) ? '1' : '0')
          : 'inherit';
        $globalValue = gocamp_global_visibility($visibilityEntity, $key, (bool)$option[1]);
      ?>
      <div class="col-md-6">
        <label class="form-label fw-semibold" for="<?= htmlspecialchars($inputId, ENT_QUOTES, 'UTF-8') ?>"><?= htmlspecialchars($option[0], ENT_QUOTES, 'UTF-8') ?></label>
        <select id="<?= htmlspecialchars($inputId, ENT_QUOTES, 'UTF-8') ?>" class="form-select"
                name="section_visibility[<?= htmlspecialchars($key, ENT_QUOTES, 'UTF-8') ?>]">
          <option value="inherit" <?= $choice === 'inherit' ? 'selected' : '' ?>>Use global (<?= $globalValue ? 'Shown' : 'Hidden' ?>)</option>
          <option value="1" <?= $choice === '1' ? 'selected' : '' ?>>Show (override)</option>
          <option value="0" <?= $choice === '0' ? 'selected' : '' ?>>Hide (override)</option>
        </select>
      </div>
    <?php endforeach; ?>
    </div>
  </div>
</div>
