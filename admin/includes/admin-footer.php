<?php
/**
 * File: /admin/includes/admin-footer.php
 * ---
 * --- REVISED (Enhancement: Swapped to fontawesome-iconpicker) ---
 * - Removed codethereal-iconpicker.css.
 * - Removed codethereal-iconpicker.js.
 * - Added fontawesome-iconpicker.min.css.
 * - Added fontawesome-iconpicker.min.js.
 */
?>
    </main> <footer class="footer bg-dark text-white-50 py-3 mt-5">
        <div class="container text-center">
            <small>&copy; <?= date('Y') ?> Go Camp International Admin Panel</small>
        </div>
    </footer>

    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/choices.js/public/assets/styles/choices.min.css"/>
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css" integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/fontawesome-iconpicker/3.2.0/css/fontawesome-iconpicker.min.css" integrity="sha512-BfgviGirSi7OFeVB2z9bxp856rzU1Tyy9Dtq2124oRUZSKXIQqpy+2LPuafc2zMd8dNUa+F7cpxbvUsZZXFltQ==" crossorigin="anonymous" referrerpolicy="no-referrer" />
    
    <style> /* Basic styles for media library */
        .media-library-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 1rem; max-height: 50vh; overflow-y: auto; }
        .media-library-item { border: 1px solid var(--input-border); border-radius: var(--radius-md); padding: 0.5rem; text-align: center; cursor: pointer; background: var(--bg-card); color: var(--text-main); transition: background-color 0.15s ease, border-color 0.15s ease; }
        .media-library-item:hover { background-color: var(--bg-body); border-color: var(--primary-color); }
        .media-library-item.selected { border-color: var(--primary-color); background-color: rgba(var(--primary-rgb), 0.12); }
        .media-library-item img { max-width: 100%; height: 80px; object-fit: cover; margin-bottom: 0.5rem; display: block; margin-left: auto; margin-right: auto;}
        .media-library-item small { display: block; word-break: break-all; font-size: 0.75rem; }
        #media-upload-progress { display: none; }
        .iconpicker-popover { 
            z-index: 1060; /* Ensure it's above modals */
            opacity: 1 !important; /* Force visibility */
        }
    </style>

    <script src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js" integrity="sha512-v2CJ7UaYy4JwqLDIrZUI/4hqeoQieOmAZNXBeQyjo21dadnwR+8ZaIJVT8EE2iyI61OV8e6M8PP2/4hpQINQ/g==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    <?php /* Only include scripts.php if it does NOT add another Bootstrap JS! */ require_once __DIR__ . '/../../includes/scripts.php'; ?>
    <script src="https://cdn.tiny.cloud/1/cuo6c70r1i8ep83qialu22a4lysbdohgv4xohlh0pdusa78d/tinymce/6/tinymce.min.js" referrerpolicy="origin"></script>
    <script src="https://cdn.jsdelivr.net/npm/choices.js/public/assets/scripts/choices.min.js"></script>
    
    <script src="https://cdnjs.cloudflare.com/ajax/libs/fontawesome-iconpicker/3.2.0/js/fontawesome-iconpicker.min.js" integrity="sha512-7dlzSK4Ulfm85ypS8/ya0xLf3NpXiML3s6HTLu4qDq7WiJWtLLyrXb9putdP3/1umwTmzIvhuu9EW7gHYSVtCQ==" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
    
    <script src="/admin/js/admin-scripts.js?v=2.4"></script> <div class="modal fade" id="mediaSelectorModal" tabindex="-1" aria-labelledby="mediaSelectorModalLabel" aria-hidden="true" data-bs-backdrop="static">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="mediaSelectorModalLabel">Select or Upload Media</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <nav>
                        <div class="nav nav-tabs" id="media-tabs" role="tablist">
                            <button class="nav-link active" id="media-library-tab" data-bs-toggle="tab" data-bs-target="#media-library-content" type="button" role="tab">Media Library</button>
                            <button class="nav-link" id="media-upload-tab" data-bs-toggle="tab" data-bs-target="#media-upload-content" type="button" role="tab">Upload New</button>
                        </div>
                    </nav>
                    <div class="tab-content pt-3" id="media-tab-content">
                        <div class="tab-pane fade show active" id="media-library-content" role="tabpanel">
                            <div class="d-flex justify-content-between mb-2">
                                <input type="search" id="media-search-input" class="form-control form-control-sm w-50" placeholder="Search library...">
                                <button type="button" id="refresh-media-library" class="btn btn-sm btn-outline-secondary"><i class="bi bi-arrow-clockwise"></i> Refresh</button>
                            </div>
                            <div id="media-library-grid" class="media-library-grid border p-2 bg-light rounded">
                                <p class="text-center text-muted col-12">Loading...</p>
                            </div>
                        </div>
                        <div class="tab-pane fade" id="media-upload-content" role="tabpanel">
                            <form id="media-upload-form">
                                <div class="mb-3">
                                    <label for="media-file-input" class="form-label">Choose image files (jpg, png, gif, webp)</label>
                                    <input class="form-control" type="file" id="media-file-input" name="media_file[]" accept="image/jpeg,image/png,image/gif,image/webp" multiple required>
                                </div>
                                <button type="submit" class="btn btn-primary">Upload File</button>
                                <div class="progress mt-3" id="media-upload-progress">
                                    <div class="progress-bar progress-bar-striped progress-bar-animated" role="progressbar" style="width: 0%;" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100">0%</div>
                                </div>
                                <div id="media-upload-status" class="mt-2"></div>
                            </form>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-primary" id="select-media-button" disabled>Select Image</button>
                </div>
            </div>
        </div>
    </div>
    <script>
document.addEventListener('click', function (event) {
  const link = event.target.closest('a[href*="/admin/item-action"]');
  if (!link) return;
  const url = new URL(link.href, window.location.href);
  if (!['/admin/item-action', '/admin/item-action.php'].includes(url.pathname)) return;
  event.preventDefault();
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/admin/item-action.php';
  for (const key of ['action', 'type', 'slug', 'file']) {
    if (!url.searchParams.has(key)) continue;
    const input = document.createElement('input');
    input.type = 'hidden'; input.name = key; input.value = url.searchParams.get(key);
    form.appendChild(input);
  }
  const token = document.createElement('input');
  token.type = 'hidden'; token.name = 'csrf';
  token.value = document.querySelector('meta[name="csrf-token"]')?.content || '';
  form.appendChild(token);
  document.body.appendChild(form);
  form.submit();
});
</script>
</body>
</html>