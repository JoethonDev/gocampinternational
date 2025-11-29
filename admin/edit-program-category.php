<?php
/**
 * File: /admin/edit-program-category.php
 * ---
 * --- MODIFIED (Phase 15) ---
 * - Added `mb-3` to section-template and section loop items for visual spacing.
 * - Added `tinymce-editor` class and unique ID to existing section 'content' textareas.
 * - Added `tinymce-init-on-add` class to the section-template 'content' textarea
 * to enable TinyMCE on dynamically added items.
 */

// 1. AT THE VERY TOP: Check if user is logged in
require_once 'auth-check.php';
require_once 'helpers.php';

// 2. Define file path and load data
$file_path = __DIR__ . '/../data/programs.php';
require $file_path; // $programs is now available
$success_message = '';
$error_message = '';

// 3. --- SAVE/CREATE LOGIC (No changes needed) ---
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (isset($_POST['name'])) {
        $slug = $_POST['slug'] ?? null;
        $original_slug = $_POST['original_slug'] ?? $slug;

        if (empty($slug)) {
            $error_message = "Slug is required.";
        } 
        elseif ($slug !== $original_slug && isset($programs[$slug])) {
            $error_message = "Error: The slug '$slug' already exists. Please choose a unique one.";
        }
        else {
            $new_data = $programs[$original_slug] ?? [
                'sections' => [], 'gallery' => []
            ];

            $new_data['banner'] = $_POST['banner'] ?? '';
            $new_data['name'] = $_POST['name'] ?? '';
            $new_data['slug'] = $slug;
            $new_data['status'] = $_POST['status'] ?? 'active';
            $new_data['color'] = $_POST['color'] ?? 'primary';
            $new_data['intro'] = $_POST['intro'] ?? ''; 
            
            $new_data['gallery'] = array_values(array_filter($_POST['gallery_path'] ?? []));

            // Sections (Complex Repeater)
            $new_data['sections'] = [];
            if (!empty($_POST['section_title'])) {
                foreach ($_POST['section_title'] as $index => $title) {
                    if (!empty($title)) { // Only save if there's a title
                        $new_data['sections'][] = [
                            'title'   => $title,
                            'content' => $_POST['section_content'][$index] ?? '', // TinyMCE saves to this
                            'image'   => $_POST['section_image'][$index] ?? '' 
                        ];
                    }
                }
            }
            
            if ($slug !== $original_slug) {
                unset($programs[$original_slug]);
            }
            $programs[$slug] = $new_data;

            if (save_php_file($file_path, 'programs', $programs)) {
                $success_message = 'Successfully saved program category!';
                if (empty($_POST['original_slug'])) {
                    header("Location: /admin/edit-program-category?slug=$slug&created=true");
                    exit;
                }
                $data = $new_data;
            } else {
                $error_message = 'Error saving data. Check file permissions.';
            }
        }
    }
}

// 4. Define Mode and Load Data (for the form)
$is_new_item = !isset($_GET['slug']) || empty($_GET['slug']);
if (!$is_new_item && empty($data)) { 
    $slug = $_GET['slug'];
    if (isset($programs[$slug])) {
        // Merge with defaults to prevent errors
        $data = array_merge(['sections' => [], 'gallery' => [], 'color' => 'primary'], $programs[$slug]);
    } else {
        header('Location: /admin/dashboard'); 
        exit;
    }
} elseif ($is_new_item) {
    $data = [
        'name' => '', 'slug' => '', 'status' => 'active', 'color' => 'primary', 'banner' => '',
        'intro' => '', 'intro_image' => '', 'sections' => [], 'gallery' => []
    ];
}

if (isset($_GET['created'])) {
    $success_message = 'Successfully created program category!';
}

// 5. Set Page Title and Include Header
$pageTitle = $is_new_item ? 'Create Program Category' : 'Edit: ' . htmlspecialchars($data['name']);
require_once 'includes/admin-header.php';
?>

<template id="section-template">
    <div class="accordion-item repeater-item border-0 mb-3 shadow-sm rounded">
        <h2 class="accordion-header" id="heading-NEW_ID">
            <button class="accordion-button collapsed bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-NEW_ID" aria-expanded="false" aria-controls="collapse-NEW_ID">
                <span class="fw-bold text-primary me-2">New Section</span>
                <small class="text-muted ms-auto me-3">Expand to edit</small>
            </button>
        </h2>
        <div id="collapse-NEW_ID" class="accordion-collapse collapse show" aria-labelledby="heading-NEW_ID" data-bs-parent="#sectionsAccordion">
            <div class="accordion-body bg-white">
                <div class="row g-3">
                    <div class="col-md-12">
                        <label class="form-label fw-bold text-secondary small text-uppercase">Section Title</label>
                        <input type="text" class="form-control" name="section_title[]" placeholder="e.g. Overview">
                    </div>
                    <div class="col-md-12">
                        <label class="form-label fw-bold text-secondary small text-uppercase">Content</label>
                        <textarea class="form-control tinymce-init-on-add" name="section_content[]" rows="5"></textarea>
                    </div>
                    <div class="col-md-12">
                        <label class="form-label fw-bold text-secondary small text-uppercase">Section Image</label>
                        <div class="d-flex align-items-start gap-3 p-3 bg-light rounded border border-dashed">
                            <img src="/admin/placeholder-image.png"
                                 class="img-fluid rounded shadow-sm media-preview-image"
                                 style="width: 100px; height: 100px; object-fit: cover;"
                                 onerror="this.onerror=null; this.src='/admin/placeholder-image.png'">
                            <div class="flex-grow-1">
                                <div class="input-group">
                                    <input type="text" class="form-control media-preview-target-input" name="section_image[]"
                                           placeholder="Select image..." readonly style="background-color: #fff;">
                                    <button class="btn btn-outline-secondary" type="button"
                                            data-bs-toggle="media-modal"
                                            data-bs-target-input="">
                                        <i class="bi bi-folder2-open"></i> Browse
                                    </button>
                                </div>
                                <div class="form-text">Recommended size: 800x600px</div>
                            </div>
                        </div>
                    </div>
                    <div class="col-12 text-end">
                        <button class="btn btn-outline-danger btn-sm" type="button" data-action="remove-item">
                            <i class="bi bi-trash"></i> Remove Section
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<template id="gallery-template">
    <div class="col-md-4 col-6 repeater-item">
        <div class="card border-0 shadow-sm h-100 position-relative group-hover-action">
            <img src="/admin/placeholder-image.png"
                 class="card-img-top media-preview-image"
                 style="height: 150px; object-fit: cover;"
                 onerror="this.onerror=null; this.src='/admin/placeholder-image.png'">
            <div class="card-body p-2">
                <div class="input-group input-group-sm">
                    <input type="text" class="form-control gallery-path-input media-preview-target-input" name="gallery_path[]"
                           placeholder="Select image..." readonly style="background-color: #fff;">
                    <button class="btn btn-outline-secondary" type="button"
                            data-bs-toggle="media-modal"
                            data-bs-target-input="">
                        <i class="bi bi-folder2-open"></i>
                    </button>
                </div>
            </div>
            <button class="btn btn-danger btn-sm position-absolute top-0 end-0 m-1 shadow-sm" 
                    type="button" data-action="remove-item" 
                    style="width: 24px; height: 24px; padding: 0; line-height: 1; border-radius: 50%;">
                &times;
            </button>
        </div>
    </div>
</template>

<div class="container-fluid py-4 animate-fade-in">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <div>
            <a href="/admin/programs.php" class="text-decoration-none text-secondary mb-2 d-inline-block">
                <i class="bi bi-arrow-left"></i> Back to Programs
            </a>
            <h1 class="h3 mb-0 fw-bold text-gray-800">
                <?= $is_new_item ? 'Create Category' : 'Edit Category' ?>
            </h1>
            <?php if (!$is_new_item): ?>
                <p class="text-muted mb-0">Editing: <span class="text-primary"><?= htmlspecialchars($data['name']) ?></span></p>
            <?php endif; ?>
        </div>
        <div class="d-flex gap-2">
            <?php if (!$is_new_item): ?>
                <button type="submit" class="btn btn-outline-danger" form="trashForm">
                    <i class="bi bi-trash"></i> Move to Trash
                </button>
            <?php endif; ?>
            <button type="submit" class="btn btn-primary px-4" form="mainForm">
                <i class="bi bi-save"></i> Save Changes
            </button>
        </div>
    </div>

    <form id="mainForm" action="edit-program-category.php<?= $is_new_item ? '' : '?slug=' . htmlspecialchars($data['slug']) ?>" method="POST" enctype="multipart/form-data">

        <?php if (!$is_new_item): ?>
            <input type="hidden" name="original_slug" value="<?= htmlspecialchars($data['slug']) ?>">
        <?php endif; ?>

        <?php if ($success_message): ?>
            <div class="alert alert-success alert-dismissible fade show shadow-sm border-0 border-start border-success border-4" role="alert">
                <i class="bi bi-check-circle-fill me-2"></i> <?= $success_message ?>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        <?php endif; ?>
        
        <?php if ($error_message): ?>
            <div class="alert alert-danger alert-dismissible fade show shadow-sm border-0 border-start border-danger border-4" role="alert">
                <i class="bi bi-exclamation-triangle-fill me-2"></i> <?= $error_message ?>
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        <?php endif; ?>

        <div class="row g-4">
            <!-- Left Column: Main Content -->
            <div class="col-lg-8">
                <!-- Basic Info Card -->
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-header bg-transparent border-0 pt-4 pb-2 px-4">
                        <h5 class="card-title fw-bold text-primary mb-0"><i class="bi bi-info-circle me-2"></i>Basic Information</h5>
                    </div>
                    <div class="card-body p-4">
                        <div class="mb-4">
                            <label for="name" class="form-label fw-bold text-secondary small text-uppercase">Category Name</label>
                            <input type="text" class="form-control form-control-lg" id="name" name="name" value="<?= htmlspecialchars($data['name']) ?>" placeholder="Enter category name">
                        </div>
                        
                        <div class="mb-0">
                            <label for="intro" class="form-label fw-bold text-secondary small text-uppercase">Intro Text</label>
                            <textarea class="form-control tinymce-editor" id="intro" name="intro" rows="10"><?= htmlspecialchars($data['intro']) ?></textarea>
                        </div>
                    </div>
                </div>

                <!-- Content Sections Card -->
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-header bg-transparent border-0 pt-4 pb-2 px-4 d-flex justify-content-between align-items-center">
                        <h5 class="card-title fw-bold text-primary mb-0"><i class="bi bi-layout-text-window-reverse me-2"></i>Content Sections</h5>
                        <button class="btn btn-sm btn-primary rounded-pill px-3" type="button" data-action="add-item">
                            <i class="bi bi-plus-lg me-1"></i> Add Section
                        </button>
                    </div>
                    <div class="card-body p-4">
                        <div class="repeater-container accordion" id="sectionsAccordion" data-template-id="section-template">
                            <?php if (empty($data['sections'])): ?>
                                <div class="text-center py-5 text-muted empty-state-message">
                                    <i class="bi bi-layers display-4 mb-3 d-block opacity-25"></i>
                                    <p>No content sections yet. Click "Add Section" to begin.</p>
                                </div>
                            <?php endif; ?>

                            <?php foreach ($data['sections'] as $index => $item): 
                                $section_input_id = 'section_image_' . $index . '_' . uniqid();
                                $image_path = $item['image'] ?? '';
                                $collapseId = 'collapse-' . $index . '-' . uniqid();
                                $headingId = 'heading-' . $index . '-' . uniqid();
                            ?>
                            <div class="accordion-item repeater-item border-0 mb-3 shadow-sm rounded">
                                <h2 class="accordion-header" id="<?= $headingId ?>">
                                    <button class="accordion-button collapsed bg-light" type="button" data-bs-toggle="collapse" data-bs-target="#<?= $collapseId ?>" aria-expanded="false" aria-controls="<?= $collapseId ?>">
                                        <span class="fw-bold text-primary me-2"><?= !empty($item['title']) ? htmlspecialchars($item['title']) : 'Untitled Section' ?></span>
                                        <small class="text-muted ms-auto me-3">Expand to edit</small>
                                    </button>
                                </h2>
                                <div id="<?= $collapseId ?>" class="accordion-collapse collapse" aria-labelledby="<?= $headingId ?>" data-bs-parent="#sectionsAccordion">
                                    <div class="accordion-body bg-white">
                                        <div class="row g-3">
                                            <div class="col-md-12">
                                                <label class="form-label fw-bold text-secondary small text-uppercase">Section Title</label>
                                                <input type="text" class="form-control" name="section_title[]" value="<?= htmlspecialchars($item['title']) ?>">
                                            </div>
                                            <div class="col-md-12">
                                                <label class="form-label fw-bold text-secondary small text-uppercase">Content</label>
                                                <textarea class="form-control tinymce-editor" id="section_content_<?= $index ?>" name="section_content[]" rows="5"><?= htmlspecialchars($item['content']) ?></textarea>
                                            </div>
                                            <div class="col-md-12">
                                                <label class="form-label fw-bold text-secondary small text-uppercase">Section Image</label>
                                                <div class="d-flex align-items-start gap-3 p-3 bg-light rounded border border-dashed">
                                                    <img src="<?= !empty($image_path) ? htmlspecialchars($image_path) : '/admin/placeholder-image.png' ?>"
                                                         class="img-fluid rounded shadow-sm media-preview-image"
                                                         style="width: 100px; height: 100px; object-fit: cover;"
                                                         onerror="this.onerror=null; this.src='/admin/placeholder-image.png'">
                                                    <div class="flex-grow-1">
                                                        <div class="input-group">
                                                            <input type="text" class="form-control media-preview-target-input" id="<?= $section_input_id ?>" name="section_image[]"
                                                                   value="<?= htmlspecialchars($image_path) ?>" placeholder="Select image..." readonly style="background-color: #fff;">
                                                            <button class="btn btn-outline-secondary" type="button"
                                                                    data-bs-toggle="media-modal"
                                                                    data-bs-target-input="<?= $section_input_id ?>">
                                                                <i class="bi bi-folder2-open"></i> Browse
                                                            </button>
                                                        </div>
                                                        <div class="form-text">Recommended size: 800x600px</div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div class="col-12 text-end">
                                                <button class="btn btn-outline-danger btn-sm" type="button" data-action="remove-item">
                                                    <i class="bi bi-trash"></i> Remove Section
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Right Column: Settings & Gallery -->
            <div class="col-lg-4">
                <!-- Settings Card -->
                <div class="card border-0 shadow-sm mb-4">
                    <div class="card-header bg-transparent border-0 pt-4 pb-2 px-4">
                        <h5 class="card-title fw-bold text-primary mb-0"><i class="bi bi-gear me-2"></i>Settings</h5>
                    </div>
                    <div class="card-body p-4">
                        <div class="mb-3">
                            <label for="slug" class="form-label fw-bold text-secondary small text-uppercase">URL Slug</label>
                            <div class="input-group">
                                <span class="input-group-text bg-light border-end-0"><i class="bi bi-link-45deg"></i></span>
                                <input type="text" class="form-control border-start-0 ps-0" id="slug" name="slug" value="<?= htmlspecialchars($data['slug']) ?>">
                            </div>
                            <small class="text-muted d-block mt-1"><?= $is_new_item ? 'e.g., "soccer-camps"' : 'Changing this changes the URL.' ?></small>
                        </div>
                        
                        <div class="mb-3">
                            <label for="status" class="form-label fw-bold text-secondary small text-uppercase">Status</label>
                            <select class="form-select" id="status" name="status">
                                <option value="active" <?= $data['status'] === 'active' ? 'selected' : '' ?>>Active</option>
                                <option value="inactive" <?= $data['status'] === 'inactive' ? 'selected' : '' ?>>Inactive</option>
                            </select>
                        </div>
                        
                        <div class="mb-3">
                            <label for="color" class="form-label fw-bold text-secondary small text-uppercase">Color Theme</label>
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
                            <label for="banner_input" class="form-label fw-bold text-secondary small text-uppercase">Banner Image</label>
                            <div class="card border-0 bg-light mb-2">
                                <img src="<?= !empty($data['banner']) ? htmlspecialchars($data['banner']) : '/admin/placeholder-image.png' ?>"
                                     alt="Banner preview"
                                     class="card-img-top media-preview-image"
                                     style="height: 150px; object-fit: cover;"
                                     onerror="this.onerror=null; this.src='/admin/placeholder-image.png'">
                            </div>
                            <div class="input-group">
                                 <input type="text" class="form-control media-preview-target-input" id="banner_input" name="banner" value="<?= htmlspecialchars($data['banner']) ?>" placeholder="Select image..." readonly style="background-color: #fff;">
                                 <button class="btn btn-outline-secondary" type="button"
                                    data-bs-toggle="media-modal"
                                    data-bs-target-input="banner_input">
                                     <i class="bi bi-folder2-open"></i>
                                 </button>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Gallery Card -->
                <div class="card border-0 shadow-sm">
                    <div class="card-header bg-transparent border-0 pt-4 pb-2 px-4 d-flex justify-content-between align-items-center">
                        <h5 class="card-title fw-bold text-primary mb-0"><i class="bi bi-images me-2"></i>Gallery</h5>
                        <button class="btn btn-sm btn-outline-primary rounded-pill" type="button" data-action="add-item">
                            <i class="bi bi-plus-lg"></i> Add
                        </button>
                    </div>
                    <div class="card-body p-4">
                        <div class="repeater-container simple-repeater row g-2" data-template-id="gallery-template" data-input-name="gallery_path[]">
                            <?php if (empty($data['gallery'])): ?>
                                <div class="col-12 text-center py-4 text-muted empty-state-message">
                                    <small>No images added yet.</small>
                                </div>
                            <?php endif; ?>

                            <?php foreach ($data['gallery'] as $index => $path):
                                $input_id = 'gallery_path_prog_' . $index . '_' . uniqid();
                            ?>
                            <div class="col-md-4 col-6 repeater-item">
                                <div class="card border-0 shadow-sm h-100 position-relative group-hover-action">
                                     <img src="<?= htmlspecialchars($path) ?>"
                                          class="card-img-top media-preview-image"
                                          style="height: 150px; object-fit: cover;"
                                          onerror="this.onerror=null; this.src='/admin/placeholder-image.png'">
                                     <div class="card-body p-2">
                                         <div class="input-group input-group-sm">
                                             <input type="text" class="form-control gallery-path-input media-preview-target-input" id="<?= $input_id ?>" name="gallery_path[]"
                                                    value="<?= htmlspecialchars($path) ?>" placeholder="Select image..." readonly style="background-color: #fff;">
                                             <button class="btn btn-outline-secondary" type="button"
                                                     data-bs-toggle="media-modal"
                                                     data-bs-target-input="<?= $input_id ?>">
                                                 <i class="bi bi-folder2-open"></i>
                                             </button>
                                         </div>
                                     </div>
                                     <button class="btn btn-danger btn-sm position-absolute top-0 end-0 m-1 shadow-sm" 
                                             type="button" data-action="remove-item"
                                             style="width: 24px; height: 24px; padding: 0; line-height: 1; border-radius: 50%;">
                                         &times;
                                     </button>
                                 </div>
                             </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </form>
</div>

<?php if (!$is_new_item): ?>
<form 
    id="trashForm" 
    action="item-action.php?action=soft-delete&type=prog&slug=<?= htmlspecialchars($data['slug']) ?>" 
    method="POST">
</form>
<?php endif; ?>

<?php
// 6. Include Footer
require_once 'includes/admin-footer.php';
?>