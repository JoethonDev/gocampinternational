<?php
/**
 * File: /admin/edit-program.php
 * ---
 * --- REVISED (Enhancement: Icon Picker Fix) ---
 * - Changed all 'iconpicker-init' and 'iconpicker-init-on-add'
 * classes to the default 'iconpicker'.
 */

// 1. AT THE VERY TOP: Check if user is logged in
require_once 'auth-check.php';
require_once 'helpers.php';

// 2. Define file path and load data
$file_path = __DIR__ . '/../data/all_programs.php';
require $file_path; // $all_programs is now available
require_once __DIR__ . '/../data/programs.php'; // $programs (categories) for dropdown
$success_message = '';
$error_message = '';

// 3. --- SAVE/CREATE LOGIC ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['id'])) {
        $id = $_POST['id'] ?? null;
        $original_id = $_POST['original_id'] ?? $id;

        if (empty($id)) {
            $error_message = "Program ID is required.";
        } 
        elseif ($id !== $original_id && isset($all_programs[$id])) {
            $error_message = "Error: The ID '$id' already exists. Please choose a unique one.";
        }
        else {
            // We are good to save
            $new_data = $all_programs[$original_id] ?? []; // Get existing data

            // --- Re-assemble dynamic arrays ---
            
            // Highlights (Simple array of strings)
            $new_data['highlights'] = [];
            if (!empty($_POST['highlight_text'])) {
                $highlight_texts = $_POST['highlight_text'] ?? [];
                
                foreach ($highlight_texts as $text) {
                    $text = trim($text);
                    if (!empty($text)) {
                        $new_data['highlights'][] = $text;
                    }
                }
            }

            // Includes (Simple Array)
            $new_data['includes'] = array_values(array_filter($_POST['includes'] ?? []));

            // Excludes (Simple Array)
            $new_data['excludes'] = array_values(array_filter($_POST['excludes'] ?? []));

            // Badges (Simple Array)
            $new_data['badges'] = array_values(array_filter($_POST['badges'] ?? []));

            // Ages (Key/Value Array)
            $new_data['ages'] = [
                'min' => $_POST['ages_min'] ?? 0,
                'max' => $_POST['ages_max'] ?? 99
            ];

            // Schedule (Key/Value Array)
            $schedule_times = $_POST['schedule_time'] ?? [];
            $schedule_descs = $_POST['schedule_desc'] ?? [];
            $new_data['schedule'] = [];
            foreach ($schedule_times as $index => $time) {
                if (!empty($time) && !empty($schedule_descs[$index])) {
                    $new_data['schedule'][$time] = $schedule_descs[$index];
                }
            }

            // --- Image from media modal ---
            $new_data['image'] = $_POST['image'] ?? '';

            // --- Simple Fields ---
            $new_data['id'] = $id;
            $new_data['category_slug'] = $_POST['category_slug'] ?? '';
            $new_data['name'] = $_POST['name'] ?? '';
            $new_data['tagline'] = $_POST['tagline'] ?? '';
            $new_data['order'] = isset($_POST['order']) && $_POST['order'] !== '' ? (int)$_POST['order'] : null;
            $new_data['duration'] = (int)($_POST['duration'] ?? 0);
            $new_data['level'] = $_POST['level'] ?? '';
            $new_data['price'] = $_POST['price'] ?? '';
            $new_data['color'] = $_POST['color'] ?? 'primary';
            $new_data['description'] = $_POST['description'] ?? '';
            $new_data['status'] = $_POST['status'] ?? 'active';
            // Gallery - Reads from text input `gallery_path[]` populated by modal
            $new_data['gallery'] = array_values(array_filter($_POST['gallery_path'] ?? []));

            // Update the main $all_programs array
            if ($id !== $original_id) {
                unset($all_programs[$original_id]);
            }
            $all_programs[$id] = $new_data;

            if (save_php_file($file_path, 'all_programs', $all_programs)) {
                $success_message = 'Successfully saved program!';
                if (empty($_POST['original_id'])) {
                    header("Location: /admin/edit-program?id=$id&created=true");
                    exit;
                }
                $data = $new_data; // Refresh form with saved data
            } else {
                $error_message = 'Error saving data. Check file permissions.';
            }
        }
    }
}

// 4. Define Mode and Load Data (for the form)
$is_new_item = !isset($_GET['id']) || empty($_GET['id']);
$default_data = [
    'id' => 'new-program-' . time(), 'category_slug' => '', 'name' => '', 'tagline' => '',
    'order' => '',
    'image' => '', 'ages' => ['min' => 0, 'max' => 99], 'duration' => 0, 'level' => '',
    'price' => '', 'color' => 'primary', 'badges' => [], 'highlights' => [],
    'description' => '', 'schedule' => [], 'includes' => [], 'excludes' => [], 'status' => 'active'
];

if (!$is_new_item) {
    $id = $_GET['id'];
    if (isset($all_programs[$id])) {
        // Merge defaults with loaded data to prevent errors if a key is missing
        $data = array_merge($default_data, $all_programs[$id]);
    } else {
        header('Location: /admin/programs'); // ID not found
        exit;
    }
} else {
    $data = $default_data;
}

if (isset($_GET['created'])) {
    $success_message = 'Successfully created program!';
}

// 5. Set Page Title and Include Header
$pageTitle = $is_new_item ? 'Create New Program' : 'Edit: ' . htmlspecialchars($data['name']);
require_once 'includes/admin-header.php';
?>

<style>
/* Fix delete button inside repeater items */
.repeater-item .btn-outline-danger,
.simple-repeater-item .btn-outline-danger {
    width: auto !important;
    min-width: 36px;
    max-width: 100%;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    box-sizing: border-box;
}
.repeater-item .btn-outline-danger,
.simple-repeater-item .btn-outline-danger {
    margin-left: 0.5rem;
    margin-right: 0;
}
.repeater-item,
.simple-repeater-item {
    position: relative;
    overflow: visible;
}
</style>

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

<template id="simple-repeater-template">
    <div class="input-group mb-2 simple-repeater-item">
        <input type="text" class="form-control" name="" value="">
        <button class="btn btn-outline-danger" type="button" data-action="remove-item">
            <i class="bi bi-trash"></i>
        </button>
    </div>
</template>

<template id="schedule-repeater-template">
    <div class="row g-2 mb-2 schedule-repeater-item">
        <div class="col-4">
            <input type="text" class="form-control" name="schedule_time[]" placeholder="e.g., 7:30 AM" value="">
        </div>
        <div class="col-7">
            <input type="text" class="form-control" name="schedule_desc[]" placeholder="Description" value="">
        </div>
        <div class="col-1">
            <button class="btn btn-outline-danger w-100" type="button" data-action="remove-item">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    </div>
</template>

<template id="gallery-template">
    <div class="repeater-item mb-3">
        <img src="" class="img-fluid rounded mb-2 d-block media-preview-image" style="max-height: 100px; max-width: 150px; object-fit: cover;" onerror="this.onerror=null; this.src='/admin/placeholder-image.png'">
        <div class="input-group">
            <input type="text" class="form-control gallery-path-input media-preview-target-input" name="gallery_path[]" value="" placeholder="Select image..." readonly style="background-color: var(--bg-card);">
            <button class="btn btn-outline-secondary" type="button" data-bs-toggle="media-modal" data-bs-target-input="">Browse...</button>
            <button class="btn btn-outline-danger" type="button" data-action="remove-item">
                <i class="bi bi-trash"></i>
            </button>
        </div>
    </div>
</template>


<form action="edit-program.php<?= $is_new_item ? '' : '?id=' . htmlspecialchars($data['id']) ?>" method="POST" enctype="multipart/form-data" class="animate-fade-in delay-1">

    <?php if (!$is_new_item): ?>
        <input type="hidden" name="original_id" value="<?= htmlspecialchars($data['id']) ?>">
    <?php endif; ?>

    <div class="row gy-4">
        <div class="col-lg-8">
            <div class="card border-0 shadow-sm mb-4">
                <div class="card-header bg-transparent border-bottom-0 pt-4 pb-2 px-4 d-flex justify-content-between align-items-center">
                    <div>
                        <h1 class="h3 mb-1 fw-bold"><?= $pageTitle ?></h1>
                        <p class="text-muted small mb-0">Fill in the details below</p>
                    </div>
                    <button type="submit" class="btn btn-primary rounded-pill px-4">
                        <i class="bi bi-save me-1"></i> Save Changes
                    </button>
                </div>
                <div class="card-body px-4 pb-4">
                
                    <?php if ($success_message): ?>
                        <div class="alert alert-success border-0 shadow-sm d-flex align-items-center">
                            <i class="bi bi-check-circle-fill me-2"></i> <?= $success_message ?>
                        </div>
                    <?php endif; ?>
                    <?php if ($error_message): ?>
                        <div class="alert alert-danger border-0 shadow-sm d-flex align-items-center">
                            <i class="bi bi-exclamation-triangle-fill me-2"></i> <?= $error_message ?>
                        </div>
                    <?php endif; ?>

                    <div class="row g-3">
                        <div class="col-md-3">
                            <label for="order" class="form-label fw-bold small text-uppercase text-muted">Order</label>
                            <input type="number" class="form-control" id="order" name="order" value="<?= htmlspecialchars($data['order'] ?? '') ?>" min="0" step="1">
                        </div>
                        <div class="col-md-9">
                            <label for="name" class="form-label fw-bold small text-uppercase text-muted">Program Name</label>
                            <input type="text" class="form-control" id="name" name="name" value="<?= htmlspecialchars($data['name']) ?>">
                        </div>
                    </div>
                    
                    <div class="mt-3">
                        <label for="tagline" class="form-label fw-bold small text-uppercase text-muted">Tagline</label>
                        <input type="text" class="form-control" id="tagline" name="tagline" value="<?= htmlspecialchars($data['tagline']) ?>">
                    </div>

                    <div class="mt-3">
                        <label for="description" class="form-label fw-bold small text-uppercase text-muted">Description</label>
                        <textarea class="form-control tinymce-editor" id="description" name="description" rows="10"><?= htmlspecialchars($data['description']) ?></textarea>
                    </div>

                    <div class="accordion-item border rounded mb-2">
                        <h2 class="accordion-header"><button class="accordion-button collapsed rounded" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-gallery">
                            <i class="bi bi-images me-2 text-success"></i> Gallery (<?= isset($data['gallery']) ? count($data['gallery']) : 0 ?>)
                        </button></h2>
                        <div id="collapse-gallery" class="accordion-collapse collapse repeater-container simple-repeater" data-template-id="gallery-template" data-input-name="gallery_path[]" data-bs-parent="#detailsAccordion">
                            <div class="accordion-body bg-light bg-opacity-10">
                                <label class="form-label fw-bold small text-uppercase text-muted">Gallery Images</label>
                                <?php if (isset($data['gallery']) && is_array($data['gallery'])):
                                    foreach ($data['gallery'] as $index => $path):
                                        $input_id = 'gallery_path_' . $index . '_' . uniqid();
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
                                <?php endforeach; endif; ?>
                                <button class="btn btn-sm btn-outline-primary mt-2" type="button" data-action="add-item"><i class="bi bi-plus-circle me-1"></i> Add Gallery Image</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="card border-0 shadow-sm">
                <div class="card-header bg-transparent border-bottom-0 pt-4 pb-2 px-4">
                    <h2 class="h5 mb-0 fw-bold">Program Details</h2>
                </div>
                <div class="card-body px-4 pb-4">
                    <div class="accordion accordion-flush" id="detailsAccordion">

                        <div class="accordion-item border rounded mb-2">
                            <h2 class="accordion-header"><button class="accordion-button collapsed rounded" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-highlights">
                                <i class="bi bi-stars me-2 text-warning"></i> Highlights
                            </button></h2>
                            <div id="collapse-highlights" class="accordion-collapse collapse repeater-container" data-template-id="highlight-template" data-bs-parent="#detailsAccordion">
                                <div class="accordion-body bg-light bg-opacity-10">
                                    <div class="row g-2 mb-2">
                                        <div class="col-4"><label class="form-label small text-muted">Icon</label></div>
                                        <div class="col-7"><label class="form-label small text-muted">Text</label></div>
                                    </div>
                                    <?php if (isset($data['highlights']) && is_array($data['highlights'])): ?>
                                        <?php foreach ($data['highlights'] as $index => $highlight): ?>
                                        <div class="row g-2 mb-2 repeater-item align-items-center">
                                            <div class="col-4">
                                                 <input type="text" class="form-control iconpicker" id="highlight_icon_<?= $index ?>" name="highlight_icon[]" placeholder="e.g., fa-solid fa-sun" value="">
                                            </div>
                                            <div class="col-7"><input type="text" class="form-control" id="highlight_text_<?= $index ?>" name="highlight_text[]" value="<?= htmlspecialchars($highlight) ?>"></div>
                                            <div class="col-1"><button class="btn btn-outline-danger w-100" type="button" data-action="remove-item"><i class="bi bi-trash"></i></button></div>
                                        </div>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                    <button class="btn btn-sm btn-outline-primary mt-2" type="button" data-action="add-item"><i class="bi bi-plus-circle me-1"></i> Add Highlight</button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="accordion-item border rounded mb-2">
                            <h2 class="accordion-header"><button class="accordion-button collapsed rounded" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-schedule">
                                <i class="bi bi-calendar-week me-2 text-info"></i> Schedule
                            </button></h2>
                            <div id="collapse-schedule" class="accordion-collapse collapse repeater-container" data-template-id="schedule-repeater-template" data-bs-parent="#detailsAccordion">
                                <div class="accordion-body bg-light bg-opacity-10">
                                    <?php if (isset($data['schedule']) && is_array($data['schedule'])): ?>
                                        <?php foreach ($data['schedule'] as $time => $desc): ?>
                                        <div class="row g-2 mb-2 schedule-repeater-item">
                                            <div class="col-4"><input type="text" class="form-control" name="schedule_time[]" value="<?= htmlspecialchars($time) ?>"></div>
                                            <div class="col-7"><input type="text" class="form-control" name="schedule_desc[]" value="<?= htmlspecialchars($desc) ?>"></div>
                                            <div class="col-1"><button class="btn btn-outline-danger w-100" type="button" data-action="remove-item"><i class="bi bi-trash"></i></button></div>
                                        </div>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                    <button class="btn btn-sm btn-outline-primary" type="button" data-action="add-item"><i class="bi bi-plus-circle me-1"></i> Add Schedule Item</button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="accordion-item border rounded mb-2">
                            <h2 class="accordion-header"><button class="accordion-button collapsed rounded" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-includes">
                                <i class="bi bi-check-circle me-2 text-success"></i> Includes
                            </button></h2>
                            <div id="collapse-includes" class="accordion-collapse collapse repeater-container" data-template-id="simple-repeater-template" data-input-name="includes[]" data-bs-parent="#detailsAccordion">
                                <div class="accordion-body bg-light bg-opacity-10">
                                    <?php if (isset($data['includes']) && is_array($data['includes'])): ?>
                                        <?php foreach ($data['includes'] as $item): ?>
                                        <div class="input-group mb-2 simple-repeater-item">
                                            <input type="text" class="form-control" name="includes[]" value="<?= htmlspecialchars($item) ?>">
                                            <button class="btn btn-outline-danger" type="button" data-action="remove-item"><i class="bi bi-trash"></i></button>
                                        </div>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                    <button class="btn btn-sm btn-outline-primary" type="button" data-action="add-item"><i class="bi bi-plus-circle me-1"></i> Add "Includes" Item</button>
                                </div>
                            </div>
                        </div>

                        <div class="accordion-item border rounded mb-2">
                            <h2 class="accordion-header"><button class="accordion-button collapsed rounded" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-excludes">
                                <i class="bi bi-x-circle me-2 text-danger"></i> Excludes
                            </button></h2>
                            <div id="collapse-excludes" class="accordion-collapse collapse repeater-container" data-template-id="simple-repeater-template" data-input-name="excludes[]" data-bs-parent="#detailsAccordion">
                                <div class="accordion-body bg-light bg-opacity-10">
                                    <?php if (isset($data['excludes']) && is_array($data['excludes'])): ?>
                                        <?php foreach ($data['excludes'] as $item): ?>
                                        <div class="input-group mb-2 simple-repeater-item">
                                            <input type="text" class="form-control" name="excludes[]" value="<?= htmlspecialchars($item) ?>">
                                            <button class="btn btn-outline-danger" type="button" data-action="remove-item"><i class="bi bi-trash"></i></button>
                                        </div>
                                        <?php endforeach; ?>
                                    <?php endif; ?>
                                    <button class="btn btn-sm btn-outline-primary" type="button" data-action="add-item"><i class="bi bi-plus-circle me-1"></i> Add "Excludes" Item</button>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>

        <div class="col-lg-4">
            <div class="card border-0 shadow-sm mb-4">
                <div class="card-header bg-transparent border-bottom-0 pt-4 pb-2 px-4">
                    <h2 class="h5 mb-0 fw-bold">Settings</h2>
                </div>
                <div class="card-body px-4 pb-4">
                    <div class="mb-3">
                        <label for="id" class="form-label fw-bold small text-uppercase text-muted">Program ID</label>
                        <input type="text" class="form-control" id="id" name="id" value="<?= htmlspecialchars($data['id']) ?>">
                        <small class="text-muted">Must be unique. e.g., "italy-sea-quest"</small>
                    </div>
                    <div class="mb-3">
                        <label for="category_slug" class="form-label fw-bold small text-uppercase text-muted">Category</label>
                        <select class="form-select" id="category_slug" name="category_slug">
                            <option value="">-- Select a Category --</option>
                            <?php foreach ($programs as $cat_slug => $category): ?>
                            <option value="<?= $cat_slug ?>" <?= $data['category_slug'] === $cat_slug ? 'selected' : '' ?>>
                                <?= htmlspecialchars($category['name']) ?>
                            </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="status" class="form-label fw-bold small text-uppercase text-muted">Status</label>
                        <select class="form-select" id="status" name="status">
                            <option value="active" <?= $data['status'] === 'active' ? 'selected' : '' ?>>Active</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="image_input" class="form-label fw-bold small text-uppercase text-muted">Program Image</label>
                        <div class="image-upload-preview mb-2 bg-light d-flex align-items-center justify-content-center" style="min-height: 150px;">
                            <img src="<?= !empty($data['image']) ? htmlspecialchars($data['image']) : '/admin/placeholder-image.png' ?>" alt="Image preview" class="img-fluid media-preview-image" style="max-height: 150px;" onerror="this.onerror=null; this.src='/admin/placeholder-image.png'">
                        </div>
                        <div class="input-group">
                            <input type="text" class="form-control media-preview-target-input" id="image_input" name="image" value="<?= htmlspecialchars($data['image']) ?>" placeholder="Select image..." readonly style="background-color: var(--bg-card);">
                            <button class="btn btn-outline-secondary" type="button" data-bs-toggle="media-modal" data-bs-target-input="image_input">Browse...</button>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="card border-0 shadow-sm mb-4">
                <div class="card-header bg-transparent border-bottom-0 pt-4 pb-2 px-4"><h2 class="h5 mb-0 fw-bold">Meta</h2></div>
                <div class="card-body px-4 pb-4">
                    <div class="row g-2">
                        <div class="col-md-6">
                            <label for="ages_min" class="form-label fw-bold small text-uppercase text-muted">Min Age</label>
                            <input type="number" class="form-control" id="ages_min" name="ages_min" value="<?= htmlspecialchars($data['ages']['min'] ?? '') ?>">
                        </div>
                        <div class="col-md-6">
                            <label for="ages_max" class="form-label fw-bold small text-uppercase text-muted">Max Age</label>
                            <input type="number" class="form-control" id="ages_max" name="ages_max" value="<?= htmlspecialchars($data['ages']['max'] ?? '') ?>">
                        </div>
                    </div>
                    <div class="mb-3 mt-3">
                        <label for="duration" class="form-label fw-bold small text-uppercase text-muted">Duration (weeks)</label>
                        <input type="number" class="form-control" id="duration" name="duration" value="<?= htmlspecialchars($data['duration'] ?? '') ?>">
                    </div>
                    <div class="mb-3">
                        <label for="level" class="form-label fw-bold small text-uppercase text-muted">Level</label>
                        <input type="text" class="form-control" id="level" name="level" value="<?= htmlspecialchars($data['level'] ?? '') ?>" placeholder="e.g., Beginner">
                    </div>
                    <div class="mb-3">
                        <label for="price" class="form-label fw-bold small text-uppercase text-muted">Price</label>
                        <input type="text" class="form-control" id="price" name="price" value="<?= htmlspecialchars($data['price'] ?? '') ?>" placeholder="e.g., €2,400">
                    </div>
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
                    <div class="mb-3 simple-repeater" data-template-id="simple-repeater-template" data-input-name="badges[]">
                        <label class="form-label fw-bold small text-uppercase text-muted">Badges</label>
                        <?php if (isset($data['badges']) && is_array($data['badges'])): ?>
                            <?php foreach ($data['badges'] as $badge): ?>
                            <div class="input-group mb-2 simple-repeater-item">
                                <input type="text" class="form-control" name="badges[]" value="<?= htmlspecialchars($badge) ?>" placeholder="e.g., Popular">
                                <button class="btn btn-outline-danger" type="button" data-action="remove-item"><i class="bi bi-trash"></i></button>
                            </div>
                            <?php endforeach; ?>
                        <?php endif; ?>
                        <button class="btn btn-sm btn-outline-primary w-100 mt-2" type="button" data-action="add-item"><i class="bi bi-plus-circle me-1"></i> Add Badge</button>
                    </div>
                </div>
            </div>

            <div class="card border-0 shadow-sm">
                <div class="card-header bg-transparent border-bottom-0 pt-4 pb-2 px-4"><h2 class="h5 mb-0 fw-bold">Actions</h2></div>
                <div class="card-body px-4 pb-4">
                    <div class="d-grid gap-2">
                        <button type="submit" class="btn btn-primary">
                            <i class="bi bi-save"></i> Save Changes
                        </button>
                    
                        <?php if (!$is_new_item): ?>
                        <hr>
                        <button 
                            type="submit" 
                            class="btn btn-outline-danger" 
                            form="trashForm"
                            onclick="return confirm('Are you sure you want to move this program to the trash?');"
                        >
                            <i class="bi bi-trash"></i> Move to Trash
                        </button>
                        <?php endif; ?>
                    </div>
                </div>
            </div>

        </div>
    </div>
</form>

<?php if (!$is_new_item): ?>
<form id="trashForm" action="item-action.php?action=soft-delete&type=program&id=<?= htmlspecialchars($data['id']) ?>" method="POST"></form>
<?php endif; ?>

<?php
// 6. Include Footer
require_once 'includes/admin-footer.php';
?>