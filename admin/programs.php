<?php
/**
 * File: /admin/programs.php
 * ---
 * New page to list all programs from the master /data/all_programs.php file.
 */

// 1. AT THE VERY TOP: Check if user is logged in
require_once 'auth-check.php';

// 2. Load all site data
require_once __DIR__ . '/../data/all_programs.php';
require_once __DIR__ . '/../data/programs.php'; // $programs (categories)
require_once __DIR__ . '/../data/destinations.php'; // $destinations

// 3. Set Page Title and Include Header
$pageTitle = 'Master Program List';
require_once 'includes/admin-header.php';
?>

<style>
html, body {
    height: 100%;
}
body {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
}
#main-content {
    flex: 1 0 auto;
}
.admin-footer {
    flex-shrink: 0;
}
</style>

<div class="card" style="overflow: visible;">
    <div class="card-header d-flex justify-content-between align-items-center">
        <h1 class="h3 mb-0">Master Program List</h1>
        <a href="/admin/edit-program" class="btn btn-primary btn-sm">
            <i class="bi bi-plus-lg"></i> Create New Program
        </a>
    </div>
    <div class="card-body border-bottom" id="filter-bar">
        <div class="row g-2 align-items-end">
            <div class="col-md-4">
                <label for="searchInput" class="form-label mb-1">Search</label>
                <input type="text" id="searchInput" class="form-control" placeholder="Search by name, ID, or category...">
            </div>
            <div class="col-md-3">
                <label class="form-label mb-1">Category</label>
                <div class="dropdown">
                    <button class="btn btn-outline-secondary dropdown-toggle w-100 text-start d-flex justify-content-between align-items-center" type="button" id="categoryDropdown" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                        <span>Select Categories</span>
                    </button>
                    <ul class="dropdown-menu w-100 p-2" aria-labelledby="categoryDropdown" style="max-height: 300px; overflow-y: auto;">
                        <?php foreach ($programs as $slug => $cat): ?>
                            <li>
                                <div class="form-check">
                                    <input class="form-check-input filter-category" type="checkbox" value="<?= htmlspecialchars($slug) ?>" id="cat_<?= htmlspecialchars($slug) ?>">
                                    <label class="form-check-label w-100" for="cat_<?= htmlspecialchars($slug) ?>">
                                        <?= htmlspecialchars($cat['name']) ?>
                                    </label>
                                </div>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            </div>
            <div class="col-md-3">
                <label class="form-label mb-1">Destination</label>
                <div class="dropdown">
                    <button class="btn btn-outline-secondary dropdown-toggle w-100 text-start d-flex justify-content-between align-items-center" type="button" id="destinationDropdown" data-bs-toggle="dropdown" data-bs-auto-close="outside" aria-expanded="false">
                        <span>Select Destinations</span>
                    </button>
                    <ul class="dropdown-menu w-100 p-2" aria-labelledby="destinationDropdown" style="max-height: 300px; overflow-y: auto;">
                        <?php foreach ($destinations as $slug => $dest): ?>
                            <li>
                                <div class="form-check">
                                    <input class="form-check-input filter-destination" type="checkbox" value="<?= htmlspecialchars($slug) ?>" id="dest_<?= htmlspecialchars($slug) ?>">
                                    <label class="form-check-label w-100" for="dest_<?= htmlspecialchars($slug) ?>">
                                        <?= htmlspecialchars($dest['name']) ?>
                                    </label>
                                </div>
                            </li>
                        <?php endforeach; ?>
                    </ul>
                </div>
            </div>
            <div class="col-md-2">
                <button id="clearFilters" class="btn btn-light btn-sm w-100 border">Clear Filters</button>
            </div>
        </div>
    </div>
    <div class="list-group list-group-flush" id="programsList">
        <?php foreach ($all_programs as $id => $prog): ?>
            <?php if ($prog['status'] !== 'trash'): ?>
                <div class="list-group-item d-flex justify-content-between align-items-center program-item"
                     data-cat="<?= htmlspecialchars($prog['category_slug']) ?>"
                     data-pid="<?= htmlspecialchars($id) ?>">
                    <div>
                        <a class="fw-bold text-decoration-none" href="/admin/edit-program?id=<?= htmlspecialchars($id) ?>">
                            <?= htmlspecialchars($prog['name']) ?>
                        </a>
                        <br>
                        <small class="text-muted">
                            ID: <?= htmlspecialchars($id) ?> | Category: 
                            <?= htmlspecialchars($programs[$prog['category_slug']]['name'] ?? 'N/A') ?>
                        </small>
                    </div>
                    <div class="dropdown">
                        <button class="btn btn-light btn-sm" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <i class="bi bi-three-dots-vertical"></i>
                        </button>
                        <ul class="dropdown-menu">
                            <li><a class="dropdown-item" href="/admin/edit-program?id=<?= htmlspecialchars($id) ?>">Edit</a></li>
                            <li><a class="dropdown-item" href="/admin/item-action?action=duplicate&type=master_prog&slug=<?= htmlspecialchars($id) ?>">Duplicate</a></li>
                            <li><hr class="dropdown-divider"></li>
                            <li>
                                <a class="dropdown-item text-danger" href="/admin/item-action?action=soft-delete&type=master_prog&slug=<?= htmlspecialchars($id) ?>">Delete</a>
                            </li>
                        </ul>
                    </div>
                </div>
            <?php endif; ?>
        <?php endforeach; ?>
        <div id="noResults" class="text-center py-4 text-muted" style="display: none;">
            No programs found matching your filters.
        </div>
    </div>
</div>
<script>
// Helper: get all destination slugs and their program_ids
const DESTINATION_PROGRAMS = <?php
$destMap = [];
foreach ($destinations as $slug => $dest) {
    $destMap[$slug] = isset($dest['program_ids']) ? $dest['program_ids'] : [];
}
echo json_encode($destMap);
?>;

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearFilters');
    const programItems = Array.from(document.querySelectorAll('.program-item'));
    const noResults = document.getElementById('noResults');
    
    // Checkboxes
    const categoryCheckboxes = document.querySelectorAll('.filter-category');
    const destinationCheckboxes = document.querySelectorAll('.filter-destination');

    // Dropdown buttons (to update text)
    const categoryBtn = document.querySelector('#categoryDropdown span');
    const destinationBtn = document.querySelector('#destinationDropdown span');

    function getCheckedValues(checkboxes) {
        return Array.from(checkboxes).filter(cb => cb.checked).map(cb => cb.value);
    }

    function updateDropdownLabel(checkboxes, labelSpan, defaultText) {
        const checked = Array.from(checkboxes).filter(cb => cb.checked);
        if (checked.length === 0) {
            labelSpan.textContent = defaultText;
        } else if (checked.length === 1) {
            labelSpan.textContent = checked[0].nextElementSibling.textContent.trim();
        } else {
            labelSpan.textContent = checked.length + ' selected';
        }
    }

    function normalize(str) {
        return (str || '').toLowerCase();
    }

    function filterPrograms() {
        const search = normalize(searchInput.value);
        const selectedCategories = getCheckedValues(categoryCheckboxes);
        const selectedDestinations = getCheckedValues(destinationCheckboxes);

        // Update UI labels
        updateDropdownLabel(categoryCheckboxes, categoryBtn, 'Select Categories');
        updateDropdownLabel(destinationCheckboxes, destinationBtn, 'Select Destinations');

        // Build a set of allowed program IDs for selected destinations
        let allowedPIDs = null;
        if (selectedDestinations.length) {
            allowedPIDs = new Set();
            selectedDestinations.forEach(destSlug => {
                (DESTINATION_PROGRAMS[destSlug] || []).forEach(pid => allowedPIDs.add(pid));
            });
        }

        let visibleCount = 0;

        programItems.forEach(item => {
            const name = normalize(item.querySelector('a.fw-bold').textContent);
            const small = item.querySelector('small.text-muted').textContent;
            const idMatch = small.match(/ID: ([^ |]+)/);
            const id = idMatch ? idMatch[1] : '';
            const catMatch = small.match(/Category: (.+)$/);
            const category = catMatch ? catMatch[1].trim() : '';
            const progID = item.getAttribute('data-pid');
            const itemCat = item.getAttribute('data-cat');

            let show = true;
            
            // Text search
            if (search && !(name.includes(search) || id.includes(search) || category.toLowerCase().includes(search))) {
                show = false;
            }
            
            // Category filter
            if (selectedCategories.length && !selectedCategories.includes(itemCat)) {
                show = false;
            }
            
            // Destination filter (by program_id in destination)
            if (allowedPIDs && !allowedPIDs.has(progID)) {
                show = false;
            }

            if (show) {
                item.classList.remove('d-none');
                item.classList.add('d-flex');
                visibleCount++;
            } else {
                item.classList.remove('d-flex');
                item.classList.add('d-none');
            }
        });

        noResults.style.display = visibleCount === 0 ? 'block' : 'none';
    }

    // Event Listeners
    searchInput.addEventListener('input', filterPrograms);
    
    categoryCheckboxes.forEach(cb => cb.addEventListener('change', filterPrograms));
    destinationCheckboxes.forEach(cb => cb.addEventListener('change', filterPrograms));

    clearBtn.addEventListener('click', function() {
        searchInput.value = '';
        categoryCheckboxes.forEach(cb => cb.checked = false);
        destinationCheckboxes.forEach(cb => cb.checked = false);
        filterPrograms();
    });
});
</script>
<style>
/* Custom scrollbar for dropdowns if needed */
.dropdown-menu::-webkit-scrollbar {
    width: 6px;
}
.dropdown-menu::-webkit-scrollbar-thumb {
    background-color: #ccc;
    border-radius: 3px;
}
</style>
<div class="admin-footer">
<?php
// 3. Include Footer
require_once 'includes/admin-footer.php';
?>
</div>