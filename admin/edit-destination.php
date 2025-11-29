<?php
/**
 * File: /admin/edit-destination.php
 * ---
 * --- REVISED (Enhancement: Icon Picker Fix) ---
 * - Changed all 'iconpicker-init' and 'iconpicker-init-on-add'
 * classes to the default 'iconpicker'.
 */

// 1. AT THE VERY TOP: Check if user is logged in
require_once 'auth-check.php';
require_once 'helpers.php';

// 2. Define file path and load data
$file_path = __DIR__ . '/../data/destinations.php';
require $file_path; // $destinations is now available
require_once __DIR__ . '/../data/all_programs.php'; // Load master program list for selector
$success_message = '';
$error_message = '';

// 3. --- SAVE/CREATE LOGIC (No changes needed, reads text input) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['name'])) {
        $slug = $_POST['slug'] ?? null;
        $original_slug = $_POST['original_slug'] ?? $slug;

        if (empty($slug)) { $error_message = "Slug is required."; }
        elseif ($slug !== $original_slug && isset($destinations[$slug])) { $error_message = "Error: The slug '$slug' already exists."; }
        else {
            $new_data = $destinations[$original_slug] ?? [
                'highlights' => [], 'stats' => [], 'gallery' => [], 'program_ids' => [], 'faq' => []
            ];
            $new_data['banner'] = $_POST['banner'] ?? ''; // Read from text input populated by modal
            $new_data['name'] = $_POST['name'] ?? '';
            $new_data['slug'] = $slug;
            $new_data['status'] = $_POST['status'] ?? 'active';
            $new_data['tagline'] = $_POST['tagline'] ?? '';
            $new_data['intro_text'] = $_POST['intro_text'] ?? '';

            $new_data['program_ids'] = $_POST['program_ids'] ?? [];

            // --- Handle program order updates ---
            // Only update if order fields are present
            if (!empty($_POST['program_order']) && is_array($_POST['program_order'])) {
                $order_updates = $_POST['program_order'];
                // Load all_programs.php for updating order
                $all_programs_path = __DIR__ . '/../data/all_programs.php';
                require $all_programs_path; // $all_programs
                $changed = false;
                foreach ($order_updates as $prog_id => $order_val) {
                    if (isset($all_programs[$prog_id])) {
                        $new_order = ($order_val !== '' && $order_val !== null) ? (int)$order_val : null;
                        if (!isset($all_programs[$prog_id]['order']) || $all_programs[$prog_id]['order'] !== $new_order) {
                            $all_programs[$prog_id]['order'] = $new_order;
                            $changed = true;
                        }
                    }
                }
                if ($changed) {
                    // Save only if there was a change
                    require_once __DIR__ . '/helpers.php';
                    save_php_file($all_programs_path, 'all_programs', $all_programs);
                }
            }

            // Highlights
            $new_data['highlights'] = [];
            if (!empty($_POST['highlight_icon'])) {
                foreach ($_POST['highlight_icon'] as $index => $icon) {
                    if ((!empty(trim($icon)) || !empty(trim($_POST['highlight_text'][$index] ?? '')))) {
                         $new_data['highlights'][] = [ 'icon' => trim($icon), 'text' => trim($_POST['highlight_text'][$index] ?? '') ];
                    }
                }
            }

            // Stats
            $new_data['stats'] = [];
            if (!empty($_POST['stat_number'])) {
                foreach ($_POST['stat_number'] as $index => $number) {
                    if (!empty($number)) {
                        $new_data['stats'][] = [
                            'number' => (int)$number, 'label' => $_POST['stat_label'][$index] ?? '',
                            'suffix' => $_POST['stat_suffix'][$index] ?? '', 'icon' => trim($_POST['stat_icon'][$index] ?? '')
                        ];
                    }
                }
            }

            // Gallery - Reads from text input `gallery_path[]` populated by modal
            $new_data['gallery'] = array_values(array_filter($_POST['gallery_path'] ?? []));

            // FAQs
            $new_data['faq'] = [];
            if (!empty($_POST['faq_q'])) {
                foreach ($_POST['faq_q'] as $index => $question) {
                    if (!empty(trim($question)) && isset($_POST['faq_a'][$index])) {
                        $new_data['faq'][] = [ 'q' => trim($question), 'a' => $_POST['faq_a'][$index] ];
                    }
                }
            }

            if ($slug !== $original_slug) { unset($destinations[$original_slug]); }
            $destinations[$slug] = $new_data;

            if (save_php_file($file_path, 'destinations', $destinations)) {
                $success_message = 'Successfully saved destination!';
                if (empty($_POST['original_slug'])) { header("Location: /admin/edit-destination?slug=$slug&created=true"); exit; }
                $data = $new_data;
            } else { $error_message = 'Error saving data.'; }
        }
    }
}

// 4. Define Mode and Load Data (Unchanged)
$is_new_item = !isset($_GET['slug']) || empty($_GET['slug']);
// Add 'color' => 'primary' to prevent undefined index warning
$default_data = [
    'name' => '',
    'slug' => '',
    'status' => 'active',
    'banner' => '',
    'tagline' => '',
    'color' => 'primary',
    'intro_image' => '',
    'intro_text' => '',
    'highlights' => [],
    'stats' => [],
    'gallery' => [],
    'program_ids' => [],
    'faq' => []
];
if (!$is_new_item) {
    $slug = $_GET['slug'];
    if (isset($destinations[$slug])) { $data = array_merge($default_data, $destinations[$slug]); }
    else { header('Location: /admin/dashboard'); exit; }
} else { $data = $default_data; }
if (isset($_GET['created'])) { $success_message = 'Successfully created destination!'; }

// 5. Set Page Title and Include Header (Unchanged)
$pageTitle = $is_new_item ? 'Create Destination' : 'Edit: ' . htmlspecialchars($data['name']);
require_once 'includes/admin-header.php';
?>

<template id="highlight-template">
    <div class="row g-2 mb-2 repeater-item align-items-center">
        <div class="col-4">
            <input type="text" class="form-control iconpicker" name="highlight_icon[]" placeholder="e.g., fa-solid fa-sun">
        </div>
        <div class="col-7">
            <input type="text" class="form-control" name="highlight_text[]" placeholder="Highlight text">
        </div>
        <div class="col-1">
            <button class="btn btn-outline-danger w-100" type="button" data-action="remove-item"><i class="bi bi-trash"></i></button>
        </div>
    </div>
</template>
<template id="stat-template">
     <div class="row g-2 mb-2 repeater-item align-items-center">
        <div class="col-2"><input type="number" class="form-control" name="stat_number[]" placeholder="15"></div>
        <div class="col-3"><input type="text" class="form-control" name="stat_label[]" placeholder="Years"></div>
        <div class="col-2"><input type="text" class="form-control" name="stat_suffix[]" placeholder="+"></div>
        <div class="col-4">
             <input type="text" class="form-control iconpicker" name="stat_icon[]" placeholder="e.g., fa-solid fa-calendar-check">
        </div>
        <div class="col-1"><button class="btn btn-outline-danger w-100" type="button" data-action="remove-item"><i class="bi bi-trash"></i></button></div>
    </div>
</template>

<template id="gallery-template">
    <div class="repeater-item mb-3">
        <img src="/admin/placeholder-image.png"
             class="img-fluid rounded mb-2 d-block media-preview-image"
             style="max-height: 100px; max-width: 150px; object-fit: cover;"
             onerror="this.onerror=null; this.src='/admin/placeholder-image.png'">
        <div class="input-group">
            <input type="text" class="form-control gallery-path-input media-preview-target-input" name="gallery_path[]"
                   placeholder="Select image..." readonly style="background-color: #fff;">
            <button class="btn btn-outline-secondary" type="button"
                    data-bs-toggle="media-modal"
                    data-bs-target-input="">
                Browse...
            </button>
            <button class="btn btn-outline-danger" type="button" data-action="remove-item">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    </div>
</template>
<template id="faq-template">
    <div class="card p-3 mb-2 repeater-item">
        <div class="mb-2"><label class="form-label fw-bold">Question</label><input type="text" class="form-control" name="faq_q[]"></div>
        <div class="mb-2"><label class="form-label fw-bold">Answer</label><textarea class="form-control" name="faq_a[]" rows="3"></textarea></div>
        <button class="btn btn-danger btn-sm align-self-end mt-2" type="button" data-action="remove-item"><i class="bi bi-trash"></i> Remove FAQ</button>
    </div>
</template>
<form action="edit-destination.php<?= $is_new_item ? '' : '?slug=' . htmlspecialchars($data['slug']) ?>" method="POST" enctype="multipart/form-data" class="animate-fade-in delay-1">

    <?php if (!$is_new_item): ?> <input type="hidden" name="original_slug" value="<?= htmlspecialchars($data['slug']) ?>"> <?php endif; ?>

    <div class="row gy-4">
        <div class="col-lg-8">
            <div class="card border-0 shadow-sm mb-4">
                 <div class="card-header bg-transparent border-bottom-0 pt-4 pb-2 px-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h1 class="h3 mb-1 fw-bold"><?= $pageTitle ?></h1>
                        <p class="text-muted small mb-0">Manage destination details</p>
                    </div>
                    <button type="submit" class="btn btn-primary rounded-pill px-4"><i class="bi bi-save me-1"></i> Save Changes</button>
                </div>
                <div class="card-body px-4 pb-4">
                    <?php if ($success_message): ?><div class="alert alert-success border-0 shadow-sm d-flex align-items-center"><i class="bi bi-check-circle-fill me-2"></i> <?= $success_message ?></div><?php endif; ?>
                    <?php if ($error_message): ?><div class="alert alert-danger border-0 shadow-sm d-flex align-items-center"><i class="bi bi-exclamation-triangle-fill me-2"></i> <?= $error_message ?></div><?php endif; ?>
                    
                    <div class="mb-3">
                        <label for="name" class="form-label fw-bold small text-uppercase text-muted">Destination Name</label>
                        <input type="text" class="form-control" id="name" name="name" value="<?= htmlspecialchars($data['name']) ?>">
                    </div>
                    <div class="mb-3">
                        <label for="tagline" class="form-label fw-bold small text-uppercase text-muted">Tagline</label>
                        <input type="text" class="form-control" id="tagline" name="tagline" value="<?= htmlspecialchars($data['tagline']) ?>">
                    </div>
                    <div class="mb-3">
                        <label for="intro_text" class="form-label fw-bold small text-uppercase text-muted">Intro Text</label>
                        <textarea class="form-control tinymce-editor" id="intro_text" name="intro_text" rows="10"><?= htmlspecialchars($data['intro_text']) ?></textarea>
                    </div>
                </div>
            </div>

            <div class="card border-0 shadow-sm">
                <div class="card-header bg-transparent border-bottom-0 pt-4 pb-2 px-4"><h2 class="h5 mb-0 fw-bold">Nested Content</h2></div>
                <div class="card-body px-4 pb-4">
                    <div class="accordion accordion-flush" id="nestedContentAccordion">


                        <div class="accordion-item border rounded mb-2">
                            <h2 class="accordion-header"><button class="accordion-button rounded" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-programs">
                                <i class="bi bi-journal-text me-2 text-primary"></i> Linked Programs (<?= count($data['program_ids']) ?>)
                            </button></h2>
                            <div id="collapse-programs" class="accordion-collapse collapse show" data-bs-parent="#nestedContentAccordion">
                                <div class="accordion-body bg-light bg-opacity-10">
                                    <label for="program_ids" class="form-label fw-bold small text-uppercase text-muted">Select programs:</label>
                                    <select id="program_ids" name="program_ids[]" class="form-control choices-select" multiple>
                                        <?php foreach ($all_programs as $prog_id => $program): ?>
                                            <?php if($program['status'] === 'active'): ?>
                                                <option value="<?= htmlspecialchars($prog_id) ?>" <?= in_array($prog_id, $data['program_ids']) ? 'selected' : '' ?>>
                                                    <?= htmlspecialchars($program['name']) ?> (ID: <?= htmlspecialchars($prog_id) ?>)
                                                </option>
                                            <?php endif; ?>
                                        <?php endforeach; ?>
                                    </select>
                                    <?php if (!empty($data['program_ids'])): ?>
                                        <div class="mt-3">
                                            <label class="form-label fw-bold small text-uppercase text-muted">Set Program Order (lower = higher priority):</label>
                                            <div class="row g-2 align-items-center mb-2">
                                                <div class="col-6 fw-bold small text-muted">Program Name</div>
                                                <div class="col-4 fw-bold small text-muted">Order</div>
                                            </div>
                                            <?php foreach ($data['program_ids'] as $prog_id): ?>
                                                <?php if (isset($all_programs[$prog_id])): ?>
                                                    <div class="row g-2 align-items-center mb-1">
                                                        <div class="col-6">
                                                            <?= htmlspecialchars($all_programs[$prog_id]['name']) ?>
                                                            <span class="text-muted small">(<?= htmlspecialchars($prog_id) ?>)</span>
                                                        </div>
                                                        <div class="col-4">
                                                            <input type="number" class="form-control form-control-sm" name="program_order[<?= htmlspecialchars($prog_id) ?>]" value="<?= isset($all_programs[$prog_id]['order']) ? (int)$all_programs[$prog_id]['order'] : '' ?>" placeholder="Order">
                                                        </div>
                                                    </div>
                                                <?php endif; ?>
                                            <?php endforeach; ?>
                                            <small class="text-muted d-block mt-2">Order is used for sorting programs in this destination and across the site.</small>
                                        </div>
                                    <?php endif; ?>
                                </div>
                            </div>
                        </div>

                        <div class="accordion-item border rounded mb-2">
                            <h2 class="accordion-header"><button class="accordion-button collapsed rounded" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-highlights">
                                <i class="bi bi-stars me-2 text-warning"></i> Highlights (<?= count($data['highlights']) ?>)
                            </button></h2>
                            <div id="collapse-highlights" class="accordion-collapse collapse repeater-container" data-template-id="highlight-template" data-bs-parent="#nestedContentAccordion">
                                <div class="accordion-body bg-light bg-opacity-10">
                                    <div class="row g-2 mb-2">
                                        <div class="col-4"><label class="form-label small text-muted">Icon</label></div>
                                        <div class="col-7"><label class="form-label small text-muted">Text</label></div>
                                    </div>
                                    <?php foreach ($data['highlights'] as $index => $item): ?>
                                    <div class="row g-2 mb-2 repeater-item align-items-center">
                                        <div class="col-4">
                                             <input type="text" class="form-control iconpicker" id="highlight_icon_<?= $index ?>" name="highlight_icon[]" placeholder="e.g., fa-solid fa-sun" value="<?= htmlspecialchars($item['icon'] ?? '') ?>">
                                        </div>
                                        <div class="col-7"><input type="text" class="form-control" id="highlight_text_<?= $index ?>" name="highlight_text[]" value="<?= htmlspecialchars($item['text'] ?? '') ?>"></div>
                                        <div class="col-1"><button class="btn btn-outline-danger w-100" type="button" data-action="remove-item"><i class="bi bi-trash"></i></button></div>
                                    </div>
                                    <?php endforeach; ?>
                                    <button class="btn btn-sm btn-outline-primary mt-2" type="button" data-action="add-item"><i class="bi bi-plus-circle me-1"></i> Add Highlight</button>
                                </div>
                            </div>
                        </div>

                        <div class="accordion-item border rounded mb-2">
                            <h2 class="accordion-header"><button class="accordion-button collapsed rounded" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-stats">
                                <i class="bi bi-bar-chart me-2 text-info"></i> Stats (<?= count($data['stats']) ?>)
                            </button></h2>
                            <div id="collapse-stats" class="accordion-collapse collapse repeater-container" data-template-id="stat-template" data-bs-parent="#nestedContentAccordion">
                                <div class="accordion-body bg-light bg-opacity-10">
                                    <div class="row g-2 mb-2">
                                        <div class="col-2"><label class="form-label small text-muted">Number</label></div>
                                        <div class="col-3"><label class="form-label small text-muted">Label</label></div>
                                        <div class="col-2"><label class="form-label small text-muted">Suffix</label></div>
                                        <div class="col-4"><label class="form-label small text-muted">Icon</label></div>
                                    </div>
                                    <?php foreach ($data['stats'] as $index => $item): ?>
                                    <div class="row g-2 mb-2 repeater-item align-items-center">
                                        <div class="col-2"><input type="number" class="form-control" id="stat_number_<?= $index ?>" name="stat_number[]" value="<?= htmlspecialchars($item['number'] ?? '') ?>"></div>
                                        <div class="col-3"><input type="text" class="form-control" id="stat_label_<?= $index ?>" name="stat_label[]" value="<?= htmlspecialchars($item['label'] ?? '') ?>"></div>
                                        <div class="col-2"><input type="text" class="form-control" id="stat_suffix_<?= $index ?>" name="stat_suffix[]" value="<?= htmlspecialchars($item['suffix'] ?? '') ?>"></div>
                                        <div class="col-4">
                                            <input type="text" class="form-control iconpicker" id="stat_icon_<?= $index ?>" name="stat_icon[]" placeholder="e.g., fa-solid fa-calendar-check" value="<?= htmlspecialchars($item['icon'] ?? '') ?>">
                                        </div>
                                        <div class="col-1"><button class="btn btn-outline-danger w-100" type="button" data-action="remove-item"><i class="bi bi-trash"></i></button></div>
                                    </div>
                                    <?php endforeach; ?>
                                    <button class="btn btn-sm btn-outline-primary mt-2" type="button" data-action="add-item"><i class="bi bi-plus-circle me-1"></i> Add Stat</button>
                                </div>
                            </div>
                        </div>

                        <div class="accordion-item border rounded mb-2">
                           <h2 class="accordion-header"><button class="accordion-button collapsed rounded" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-gallery">
                               <i class="bi bi-images me-2 text-success"></i> Gallery (<?= count($data['gallery']) ?>)
                           </button></h2>
                           <div id="collapse-gallery" class="accordion-collapse collapse repeater-container simple-repeater" data-template-id="gallery-template" data-input-name="gallery_path[]" data-bs-parent="#nestedContentAccordion">
                               <div class="accordion-body bg-light bg-opacity-10">
                                   <label class="form-label fw-bold small text-uppercase text-muted">Gallery Images</label>
                                   <?php foreach ($data['gallery'] as $index => $path):
                                       $input_id = 'gallery_path_' . $index . '_' . uniqid(); // Unique ID for each input
                                   ?>
                                   <div class="repeater-item mb-3">
                                        <img src="<?= htmlspecialchars($path) ?>"
                                             class="img-fluid rounded mb-2 d-block media-preview-image"
                                             style="max-height: 100px; max-width: 150px; object-fit: cover;"
                                             onerror="this.onerror=null; this.src='/admin/placeholder-image.png'">
                                        <div class="input-group">
                                            <input type="text" class="form-control gallery-path-input media-preview-target-input" id="<?= $input_id ?>" name="gallery_path[]"
                                                   value="<?= htmlspecialchars($path) ?>" placeholder="Select image..." readonly style="background-color: var(--bg-card);">
                                            <button class="btn btn-outline-secondary" type="button"
                                                    data-bs-toggle="media-modal"
                                                    data-bs-target-input="<?= $input_id ?>">
                                                Browse...
                                            </button>
                                            <button class="btn btn-outline-danger" type="button" data-action="remove-item">
                                                <i class="bi bi-trash"></i>
                                            </button>
                                        </div>
                                    </div>
                                   <?php endforeach; ?>
                                   <button class="btn btn-sm btn-outline-primary mt-2" type="button" data-action="add-item"><i class="bi bi-plus-circle me-1"></i> Add Gallery Image</button>
                               </div>
                           </div>
                           </div>
                        <div class="accordion-item border rounded mb-2">
                            <h2 class="accordion-header"><button class="accordion-button collapsed rounded" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-faq">
                                <i class="bi bi-question-circle me-2 text-secondary"></i> FAQs (<?= count($data['faq']) ?>)
                            </button></h2>
                            <div id="collapse-faq" class="accordion-collapse collapse repeater-container" data-template-id="faq-template" data-bs-parent="#nestedContentAccordion"> <div class="accordion-body bg-light bg-opacity-10"> <?php foreach ($data['faq'] as $item): ?> <div class="card p-3 mb-2 repeater-item border-0 shadow-sm"> <div class="mb-2"> <label class="form-label fw-bold small text-muted">Question</label> <input type="text" class="form-control" name="faq_q[]" value="<?= htmlspecialchars($item['q']) ?>"> </div> <div class="mb-2"> <label class="form-label fw-bold small text-muted">Answer</label> <textarea class="form-control" name="faq_a[]" rows="3"><?= htmlspecialchars($item['a']) ?></textarea> </div> <button class="btn btn-danger btn-sm align-self-end mt-2" type="button" data-action="remove-item"><i class="bi bi-trash"></i> Remove FAQ</button> </div> <?php endforeach; ?> <button class="btn btn-sm btn-outline-primary mt-3" type="button" data-action="add-item"><i class="bi bi-plus-lg"></i> Add FAQ</button> </div> </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-4">
             <div class="card border-0 shadow-sm mb-4">
                <div class="card-header bg-transparent border-bottom-0 pt-4 pb-2 px-4"><h2 class="h5 mb-0 fw-bold">Settings</h2></div>
                <div class="card-body px-4 pb-4">
                    <div class="mb-3"><label for="slug" class="form-label fw-bold small text-uppercase text-muted">URL Slug</label><input type="text" class="form-control" id="slug" name="slug" value="<?= htmlspecialchars($data['slug']) ?>" <?= $is_new_item ? '' : '' ?>><small class="text-muted"><?= $is_new_item ? 'e.g., "italy"' : 'Changing this will change the URL.' ?></small></div>
                    <div class="mb-3"><label for="status" class="form-label fw-bold small text-uppercase text-muted">Status</label><select class="form-select" id="status" name="status"><option value="active" <?= $data['status'] === 'active' ? 'selected' : '' ?>>Active</option><option value="coming-soon" <?= $data['status'] === 'coming-soon' ? 'selected' : '' ?>>Coming Soon</option></select></div>
                    <div class="mb-3">
                        <label for="color" class="form-label fw-bold small text-uppercase text-muted">Color Theme</label>
                        <select class="form-select" id="color" name="color">
                            <option value="primary" <?= $data['color'] === 'primary' ? 'selected' : '' ?>>Primary (Blue)</option>
                            <option value="secondary" <?= $data['color'] === 'secondary' ? 'selected' : '' ?>>Secondary (Gray)</option>
                            <option value="success" <?= $data['color'] === 'success' ? 'selected' : '' ?>>Success (Green)</option>
                            <option value="danger" <?= $data['color'] === 'danger' ? 'selected' : '' ?>>Danger (Red)</option>
                            <option value="warning" <?= $data['color'] === 'warning' ? 'selected' : '' ?>>Warning (Yellow)</option>
                            <option value="info" <?= $data['color'] === 'info' ? 'selected' : '' ?>>Info (Cyan)</option>
                            <option value="light" <?= $data['color'] === 'light' ? 'selected' : '' ?>>Light (White)</option>
                            <option value="dark" <?= $data['color'] === 'dark' ? 'selected' : '' ?>>Dark (Black)</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="banner_input" class="form-label fw-bold small text-uppercase text-muted">Banner Image</label>
                        <div class="image-upload-preview mb-2 bg-light d-flex align-items-center justify-content-center" style="min-height: 150px;">
                            <img src="<?= !empty($data['banner']) ? htmlspecialchars($data['banner']) : '/admin/placeholder-image.png' ?>"
                                 alt="Banner preview"
                                 class="img-fluid media-preview-image"
                                 style="max-height: 150px; object-fit: cover;"
                                 onerror="this.onerror=null; this.src='/admin/placeholder-image.png'">
                        </div>
                        
                        <div class="input-group">
                             <input type="text" class="form-control media-preview-target-input" id="banner_input" name="banner" value="<?= htmlspecialchars($data['banner']) ?>" placeholder="Select image..." readonly style="background-color: var(--bg-card);">
                             <button class="btn btn-outline-secondary" type="button"
                                data-bs-toggle="media-modal"
                                data-bs-target-input="banner_input">
                                 Browse...
                             </button>
                        </div>
                    </div>
                    <div class="d-grid gap-2"><button type="submit" class="btn btn-primary"><i class="bi bi-save"></i> Save Changes</button></div>
                    <?php if (!$is_new_item): ?><hr><div class="d-grid"><button type="submit" class="btn btn-outline-danger" form="trashForm"><i class="bi bi-trash"></i> Move to Trash</button></div><?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</form>

<?php if (!$is_new_item): ?><form id="trashForm" action="item-action.php?action=soft-delete&type=dest&slug=<?= htmlspecialchars($data['slug']) ?>" method="POST"></form><?php endif; ?>

<?php
// 6. Include Footer
require_once 'includes/admin-footer.php';
?>