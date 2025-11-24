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
    <div class="card p-3 mb-3 repeater-item"> <div class="mb-2">
            <label class="form-label fw-bold">Title</label>
            <input type="text" class="form-control" name="section_title[]">
        </div>
        <div class="mb-2">
            <label class="form-label fw-bold">Content</label>
            <textarea class="form-control tinymce-init-on-add" name="section_content[]" rows="5"></textarea>
        </div>
        <div class="mb-2">
            <label class="form-label fw-bold">Image</label>
            <img src="/admin/placeholder-image.png"
                 class="img-fluid rounded mb-2 d-block media-preview-image"
                 style="max-height: 100px; max-width: 150px; object-fit: cover;"
                 onerror="this.onerror=null; this.src='/admin/placeholder-image.png'">
            <div class="input-group">
                <input type="text" class="form-control media-preview-target-input" name="section_image[]"
                       placeholder="Select image..." readonly style="background-color: #fff;">
                <button class="btn btn-outline-secondary" type="button"
                        data-bs-toggle="media-modal"
                        data-bs-target-input="">
                    Browse...
                </button>
            </div>
        </div>
        <button class="btn btn-danger btn-sm align-self-end mt-2" type="button" data-action="remove-item"><i class="bi bi-trash"></i> Remove Section</button>
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
<form action="edit-program-category.php<?= $is_new_item ? '' : '?slug=' . htmlspecialchars($data['slug']) ?>" method="POST" enctype="multipart/form-data">

    <?php if (!$is_new_item): ?>
        <input type="hidden" name="original_slug" value="<?= htmlspecialchars($data['slug']) ?>">
    <?php endif; ?>

    <div class="row gy-4">
        <div class="col-lg-8">
            <div class="card">
                <div class="card-header d-flex justify-content-between align-items-center">
                    <h1 class="h3 mb-0"><?= $is_new_item ? 'Create New Program Category' : 'Edit: ' . htmlspecialchars($data['name']) ?></h1>
                    <button type="submit" class="btn btn-primary">
                        <i class="bi bi-save"></i> Save Changes
                    </button>
                </div>
                <div class="card-body">
                
                    <?php if ($success_message): ?>
                        <div class="alert alert-success"><?= $success_message ?></div>
                    <?php endif; ?>
                    <?php if ($error_message): ?>
                        <div class="alert alert-danger"><?= $error_message ?></div>
                    <?php endif; ?>

                    <div class="mb-3">
                        <label for="name" class="form-label">Program Name</label>
                        <input type="text" class="form-control" id="name" name="name" value="<?= htmlspecialchars($data['name']) ?>">
                    </div>
                    
                    <div class="mb-3">
                        <label for="intro" class="form-label">Intro Text</label>
                        <textarea class="form-control tinymce-editor" id="intro" name="intro" rows="10"><?= htmlspecialchars($data['intro']) ?></textarea>
                    </div>

                    <hr>
                    <h2 class="h5">Content Sections</h2>
                    <div class="repeater-container" data-template-id="section-template">
                        <?php foreach ($data['sections'] as $index => $item): 
                            $section_input_id = 'section_image_' . $index . '_' . uniqid();
                            $image_path = $item['image'] ?? '';
                        ?>
                        <div class="card p-3 mb-3 repeater-item"> 
                            <div class="mb-2">
                                <label class="form-label fw-bold">Title</label>
                                <input type="text" class="form-control" name="section_title[]" value="<?= htmlspecialchars($item['title']) ?>">
                            </div>
                            <div class="mb-2">
                                <label class="form-label fw-bold">Content</label>
                                <textarea class="form-control tinymce-editor" id="section_content_<?= $index ?>" name="section_content[]" rows="5"><?= htmlspecialchars($item['content']) ?></textarea>
                            </div>
                            <div class="mb-2">
                                <label class="form-label fw-bold">Image</label>
                                <img src="<?= !empty($image_path) ? htmlspecialchars($image_path) : '/admin/placeholder-image.png' ?>"
                                     class="img-fluid rounded mb-2 d-block media-preview-image"
                                     style="max-height: 100px; max-width: 150px; object-fit: cover;"
                                     onerror="this.onerror=null; this.src='/admin/placeholder-image.png'">
                                <div class="input-group">
                                    <input type="text" class="form-control media-preview-target-input" id="<?= $section_input_id ?>" name="section_image[]"
                                           value="<?= htmlspecialchars($image_path) ?>" placeholder="Select image..." readonly style="background-color: #fff;">
                                    <button class="btn btn-outline-secondary" type="button"
                                            data-bs-toggle="media-modal"
                                            data-bs-target-input="<?= $section_input_id ?>">
                                        Browse...
                                    </button>
                                </div>
                            </div>
                            <button class="btn btn-danger btn-sm align-self-end mt-2" type="button" data-action="remove-item"><i class="bi bi-trash"></i> Remove Section</button>
                        </div>
                        <?php endforeach; ?>
                        <button class="btn btn-sm btn-outline-primary mt-3" type="button" data-action="add-item"><i class="bi bi-plus-lg"></i> Add Section</button>
                    </div>
                    </div>
            </div>
        </div>

        <div class="col-lg-4">
            <div class="card">
                <div class="card-header">
                    <h2 class="h5 mb-0">Settings</h2>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label for="slug" class="form-label">URL Slug</label>
                        <input type="text" class="form-control" id="slug" name="slug" value="<?= htmlspecialchars($data['slug']) ?>" <?= $is_new_item ? '' : '' ?>>
                        <small class="text-muted"><?= $is_new_item ? 'e.g., "soccer-camps" (no spaces, all lowercase)' : 'Changing this will change the URL. Be careful.' ?></small>
                    </div>
                    <div class="mb-3">
                        <label for="status" class="form-label">Status</label>
                        <select class="form-select" id="status" name="status">
                            <option value="active" <?= $data['status'] === 'active' ? 'selected' : '' ?>>Active</option>
                        </select>
                    </div>
                    <div class="mb-3">
                        <label for="color" class="form-label">Color Theme</label>
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
                        <label for="banner_input" class="form-label">Banner Image</label>
                        <img src="<?= !empty($data['banner']) ? htmlspecialchars($data['banner']) : '/admin/placeholder-image.png' ?>"
                             alt="Banner preview"
                             class="img-fluid rounded mb-2 d-block media-preview-image"
                             style="max-height: 150px; object-fit: cover;"
                             onerror="this.onerror=null; this.src='/admin/placeholder-image.png'">
                        
                        <div class="input-group">
                             <input type="text" class="form-control media-preview-target-input" id="banner_input" name="banner" value="<?= htmlspecialchars($data['banner']) ?>" placeholder="Select image..." readonly style="background-color: #fff;">
                             <button class="btn btn-outline-secondary" type="button"
                                data-bs-toggle="media-modal"
                                data-bs-target-input="banner_input">
                                 Browse...
                             </button>
                        </div>
                        <small class="text-muted">Click "Browse" to select or upload.</small>
                    </div>
                    <div class="d-grid gap-2">
                        <button type="submit" class="btn btn-primary">
                            <i class="bi bi-save"></i> Save Changes
                        </button>
                    </div>
                    
                    <?php if (!$is_new_item): ?>
                    <hr>
                    <div class="d-grid">
                        <button 
                            type="submit" 
                            class="btn btn-outline-danger" 
                            form="trashForm"
                        >
                            <i class="bi bi-trash"></i> Move to Trash
                        </button>
                    </div>
                    <?php endif; ?>
                </div>
            </div>
            
            <div class="card mt-4">
                <div class="card-header">
                    <h2 class="h5 mb-0">Gallery</h2>
                </div>
                <div class="card-body repeater-container simple-repeater" data-template-id="gallery-template" data-input-name="gallery_path[]">
                    <label class="form-label">Gallery Images</label>
                    <?php foreach ($data['gallery'] as $index => $path):
                        $input_id = 'gallery_path_prog_' . $index . '_' . uniqid(); // Unique ID for each input
                    ?>
                    <div class="repeater-item mb-3">
                         <img src="<?= htmlspecialchars($path) ?>"
                              class="img-fluid rounded mb-2 d-block media-preview-image"
                              style="max-height: 100px; max-width: 150px; object-fit: cover;"
                              onerror="this.onerror=null; this.src='/admin/placeholder-image.png'">
                         <div class="input-group">
                             <input type="text" class="form-control gallery-path-input media-preview-target-input" id="<?= $input_id ?>" name="gallery_path[]"
                                    value="<?= htmlspecialchars($path) ?>" placeholder="Select image..." readonly style="background-color: #fff;">
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
                    <button class="btn btn-sm btn-outline-primary" type="button" data-action="add-item">Add Image Path</button>
                </div>
                </div>
            </div>
    </div>
</form>
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