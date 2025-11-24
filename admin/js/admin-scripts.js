/**
 * File: /admin/js/admin-scripts.js
 * ---
 * --- REVISED (Enhancement: Swapped to fontawesome-iconpicker) ---
 * - Removed all `codethereal-iconpicker` async loading logic.
 * - Added new `initializeIconPicker` function to use the jQuery-based `$.iconpicker`.
 * - Configured the new picker to use `iconset: 'fontawesome6'`.
 * - Updated repeater 'add' logic to initialize the new picker.
 * - Updated repeater 'remove' logic to destroy the new picker instance.
 */

$(document).ready(function () {
  // --- Initialize TinyMCE ---
  function initializeTinyMCE(selector = ".tinymce-editor") {
    if (typeof tinymce !== "undefined") {
      tinymce.init({
        selector: selector,
        plugins: "lists link image table code help wordcount",
        toolbar:
          "undo redo | formatselect | bold italic | alignleft aligncenter alignright | bullist numlist | link | table | code | help",
        height: 300,
        menubar: false,
        content_style:
          'body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif; font-size: 16px; }',
        setup: function (editor) {
          editor.on("change", function () {
            editor.save();
          });
        },
      });
    }
  }
  initializeTinyMCE();

  // --- Initialize Choices.js ---
  document.querySelectorAll(".choices-select").forEach(function (select) {
    try {
      new Choices(select, {
        removeItemButton: true,
        searchEnabled: true,
        placeholder: true,
        placeholderValue: "Select...",
      });
    } catch (error) {
      console.error("Error initializing Choices.js:", error, select);
    }
  });

  // --- REFACTORED (Enhancement: fontawesome-iconpicker) ---
  function initializeIconPicker(selector) {
    if ($.fn.iconpicker) {
      $(selector).iconpicker({
        iconset: "fontawesome6",
        rows: 5,
        cols: 10,
        search: true,
        placement: "bottom",
      });
    } else {
      console.error("FontAwesome Iconpicker plugin not loaded.");
    }
  }
  // Initialize all existing pickers on page load
  initializeIconPicker(".iconpicker");
  // --- END REFACTORED ---

  // --- Dynamic Repeater Fields ---
  function initializeRepeater(container) {
    const templateId = container.dataset.templateId;
    const template = document.getElementById(templateId);
    if (!template) {
      console.error("Repeater template not found:", templateId);
      return;
    }

    const addBtn = container.querySelector('[data-action="add-item"]');
    if (addBtn) {
      addBtn.addEventListener("click", function () {
        const newItemFragment = template.content.cloneNode(true);

        let newItemElement = null;
        for (let i = 0; i < newItemFragment.childNodes.length; i++) {
          if (newItemFragment.childNodes[i].nodeType === Node.ELEMENT_NODE) {
            newItemElement = newItemFragment.childNodes[i];
            break;
          }
        }

        if (!newItemElement) {
          console.error(
            "Template fragment did not contain a valid element for",
            templateId
          );
          return;
        }

        // Media Input Logic (from Phase 13)
        const mediaInput = newItemElement.querySelector(
          "input.media-preview-target-input"
        );
        const mediaButton = newItemElement.querySelector(
          '[data-bs-toggle="media-modal"]'
        );
        if (mediaInput && mediaButton) {
          const uniqueId =
            "media-target-" +
            Date.now() +
            "-" +
            Math.random().toString(36).substring(2);
          mediaInput.id = uniqueId;
          mediaButton.dataset.bsTargetInput = uniqueId;
        }

        if (container.classList.contains("simple-repeater")) {
          const inputName = container.dataset.inputName;
          if (inputName) {
            const inputField = newItemElement.querySelector("input, textarea");
            if (inputField) {
              inputField.name = inputName;
            }
          }
        }

        // TinyMCE Init Logic (from Phase 15)
        const newTextarea = newItemElement.querySelector(
          ".tinymce-init-on-add"
        );
        if (newTextarea) {
          const uniqueId =
            "tinymce-" +
            Date.now() +
            "-" +
            Math.random().toString(36).substring(2);
          newTextarea.id = uniqueId;
          setTimeout(() => {
            initializeTinyMCE("#" + uniqueId);
            newTextarea.classList.remove("tinymce-init-on-add");
          }, 100);
        }

        // --- MODIFIED (Enhancement: fontawesome-iconpicker) ---
        // Find the new iconpicker input and initialize it
        const newIconPicker = newItemElement.querySelector(".iconpicker");
        if (newIconPicker) {
          initializeIconPicker(newIconPicker);
        }
        // --- END MODIFIED ---

        this.before(newItemElement); // Add to DOM
      });
    }

    container.addEventListener("click", function (e) {
      const removeBtn = e.target.closest('[data-action="remove-item"]');
      if (removeBtn) {
        // Support both .repeater-item and .simple-repeater-item and .schedule-repeater-item
        let itemToRemove = removeBtn.closest(".repeater-item, .simple-repeater-item, .schedule-repeater-item");
        if (itemToRemove) {
          // Destroy TinyMCE
          const editorTextarea = itemToRemove.querySelector(".tinymce-editor");
          if (
            editorTextarea &&
            editorTextarea.id &&
            typeof tinymce !== "undefined" &&
            tinymce.get(editorTextarea.id)
          ) {
            tinymce.get(editorTextarea.id).remove();
          }

          // --- MODIFIED (Enhancement: fontawesome-iconpicker) ---
          const iconPickerEl = itemToRemove.querySelector(".iconpicker");
          if (iconPickerEl && $.fn.iconpicker) {
            $(iconPickerEl).iconpicker("destroy");
          }
          // --- END MODIFIED ---

          itemToRemove.remove();
        }
      }
    });
  }
  document.querySelectorAll(".repeater-container, .simple-repeater, .schedule-repeater").forEach(initializeRepeater);

  // --- Media Selector Logic (Unchanged) ---
  const mediaModalElement = document.getElementById("mediaSelectorModal");
  if (mediaModalElement) {
    const mediaModal = new bootstrap.Modal(mediaModalElement);
    const libraryGrid = document.getElementById("media-library-grid");
    const searchInput = document.getElementById("media-search-input");
    const refreshButton = document.getElementById("refresh-media-library");
    const selectButton = document.getElementById("select-media-button");
    const uploadForm = document.getElementById("media-upload-form");
    const fileInput = document.getElementById("media-file-input");
    const progressBar = document
      .getElementById("media-upload-progress")
      .querySelector(".progress-bar");
    const progressContainer = document.getElementById("media-upload-progress");
    const uploadStatus = document.getElementById("media-upload-status");
    const libraryTabButton = document.getElementById("media-library-tab");
    let currentTargetInput = null;
    let currentSelectedUrl = null;
    let allFiles = [];
    function loadMediaLibrary() {
      libraryGrid.innerHTML =
        '<p class="text-center text-muted col-12">Loading...</p>';
      selectButton.disabled = true;
      currentSelectedUrl = null;
      fetch("/admin/ajax/list-media.php")
        .then((response) => response.json())
        .then((data) => {
          allFiles = data.files || [];
          displayMediaFiles(allFiles);
        })
        .catch((error) => {
          console.error("Error loading media library:", error);
          libraryGrid.innerHTML =
            '<p class="text-center text-danger col-12">Error loading media.</p>';
        });
    }
    function displayMediaFiles(files) {
      libraryGrid.innerHTML = "";
      if (files.length === 0) {
        libraryGrid.innerHTML =
          '<p class="text-center text-muted col-12">No media found.</p>';
        return;
      }
      files.forEach((file) => {
        const item = document.createElement("div");
        item.classList.add("media-library-item");
        item.dataset.url = file.url;
        item.dataset.name = file.name.toLowerCase();
        const img = document.createElement("img");
        img.src = file.url;
        img.alt = file.name;
        img.loading = "lazy";
        const name = document.createElement("small");
        name.textContent = file.name;
        item.appendChild(img);
        item.appendChild(name);
        libraryGrid.appendChild(item);
      });
    }
    document.body.addEventListener("click", function (event) {
      const triggerButton = event.target.closest(
        '[data-bs-toggle="media-modal"]'
      );
      if (triggerButton) {
        const targetInputId = triggerButton.dataset.bsTargetInput;
        currentTargetInput = document.getElementById(targetInputId);
        if (currentTargetInput) {
          loadMediaLibrary();
          mediaModal.show();
        } else {
          console.error(
            "Target input not found for media modal:",
            targetInputId
          );
        }
      }
    });
    libraryGrid.addEventListener("click", function (event) {
      const selectedItem = event.target.closest(".media-library-item");
      if (selectedItem) {
        const previouslySelected = libraryGrid.querySelector(".selected");
        if (previouslySelected) {
          previouslySelected.classList.remove("selected");
        }
        selectedItem.classList.add("selected");
        currentSelectedUrl = selectedItem.dataset.url;
        selectButton.disabled = false;
      }
    });
    selectButton.addEventListener("click", function () {
      if (currentTargetInput && currentSelectedUrl) {
        currentTargetInput.value = currentSelectedUrl;
        const inputGroup = currentTargetInput.closest(".input-group");
        if (inputGroup) {
          const previewImage = inputGroup.previousElementSibling;
          if (
            previewImage &&
            previewImage.classList.contains("media-preview-image")
          ) {
            previewImage.src = currentSelectedUrl;
            previewImage.onerror = function () {
              this.src = "/admin/placeholder-image.png";
            };
          }
        }
        mediaModal.hide();
      }
    });
    refreshButton.addEventListener("click", loadMediaLibrary);
    searchInput.addEventListener("input", function () {
      const searchTerm = this.value.toLowerCase().trim();
      const filteredFiles = allFiles.filter((file) =>
        file.name.toLowerCase().includes(searchTerm)
      );
      displayMediaFiles(filteredFiles);
    });
    uploadForm.addEventListener("submit", function (event) {
      event.preventDefault();
      if (!fileInput.files || fileInput.files.length === 0) {
        uploadStatus.innerHTML =
          '<span class="text-danger">Please select one or more files to upload.</span>';
        return;
      }
      const formData = new FormData();
      // Append all selected files
      for (let i = 0; i < fileInput.files.length; i++) {
        formData.append("media_file[]", fileInput.files[i]);
      }
      progressContainer.style.display = "block";
      progressBar.style.width = "0%";
      progressBar.textContent = "0%";
      uploadStatus.textContent = "Uploading...";
      selectButton.disabled = true;
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/admin/ajax/upload-media.php", true);
      xhr.upload.onprogress = function (event) {
        if (event.lengthComputable) {
          const percentComplete = Math.round(
            (event.loaded / event.total) * 100
          );
          progressBar.style.width = percentComplete + "%";
          progressBar.textContent = percentComplete + "%";
        }
      };
      xhr.onload = function () {
        progressContainer.style.display = "none";
        fileInput.value = "";
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.success && response.results) {
            const successCount = response.results.filter(r => r.success).length;
            const totalCount = response.results.length;
            if (successCount === totalCount) {
              uploadStatus.innerHTML = `<span class="text-success">Successfully uploaded ${successCount} file(s)!</span>`;
            } else {
              uploadStatus.innerHTML = `<span class="text-warning">Uploaded ${successCount}/${totalCount} files. Check console for errors.</span>`;
              console.log('Upload results:', response.results);
            }
            var triggerEl = libraryTabButton;
            var tab = new bootstrap.Tab(triggerEl);
            tab.show();
            loadMediaLibrary();
          } else if (response.success) {
            uploadStatus.innerHTML = `<span class="text-success">${response.message}</span>`;
            var triggerEl = libraryTabButton;
            var tab = new bootstrap.Tab(triggerEl);
            tab.show();
            loadMediaLibrary();
          } else {
            uploadStatus.innerHTML = `<span class="text-danger">Error: ${response.message}</span>`;
          }
        } catch (e) {
          console.error("Upload response error:", xhr.responseText);
          uploadStatus.innerHTML =
            '<span class="text-danger">Upload failed. Invalid server response.</span>';
        }
        selectButton.disabled = true;
      };
      xhr.onerror = function () {
        progressContainer.style.display = "none";
        uploadStatus.innerHTML =
          '<span class="text-danger">Upload failed. Network error.</span>';
        selectButton.disabled = true;
        fileInput.value = "";
      };
      xhr.send(formData);
    });
    mediaModalElement.addEventListener("hidden.bs.modal", function () {
      currentTargetInput = null;
      currentSelectedUrl = null;
      selectButton.disabled = true;
      searchInput.value = "";
      uploadStatus.textContent = "";
      fileInput.value = "";
      const selectedItem = libraryGrid.querySelector(".selected");
      if (selectedItem) selectedItem.classList.remove("selected");
    });
  } // end if(mediaModalElement)
  // --- Dynamic Program Order Fields for edit-destination.php ---
  const programSelect = document.getElementById('program_ids');
  const programOrderContainer = (() => {
    // Find the container for program order fields
    // It is the div with row/col structure under the accordion-body of Linked Programs
    if (!programSelect) return null;
    let el = programSelect.closest('.accordion-body');
    if (!el) return null;
    // Find the div that contains the order fields (has at least .row and .fw-bold)
    let rows = el.querySelectorAll('.row.g-2.align-items-center.mb-1');
    if (rows.length) return rows[0].parentElement;
    // If not found, create a container after the select
    let marker = el.querySelector('select#program_ids');
    if (marker) {
      let div = document.createElement('div');
      marker.insertAdjacentElement('afterend', div);
      return div;
    }
    return null;
  })();

  // Get all programs data from a JS variable if available (for names)
  // Otherwise, fallback to using option text
  function getProgramName(progId) {
    const opt = programSelect.querySelector('option[value="' + progId + '"]');
    return opt ? opt.textContent.replace(/\(ID:.*\)/, '').trim() : progId;
  }

  function getCurrentOrders() {
    // Get all current order values as {progId: order}
    const orderInputs = programOrderContainer ? programOrderContainer.querySelectorAll('input[name^="program_order["]') : [];
    const orders = {};
    orderInputs.forEach(input => {
      const match = input.name.match(/program_order\[(.+)\]/);
      if (match) orders[match[1]] = parseInt(input.value, 10) || 0;
    });
    return orders;
  }

  function renderProgramOrderFields() {
    if (!programOrderContainer) return;
    const selected = Array.from(programSelect.selectedOptions).map(opt => opt.value);
    const currentOrders = getCurrentOrders();
    // Find the max order number
    let maxOrder = 0;
    Object.values(currentOrders).forEach(val => { if (val > maxOrder) maxOrder = val; });
    // Separate existing and new programs
    const existingOrder = Object.keys(currentOrders).filter(progId => selected.includes(progId));
    const newPrograms = selected.filter(progId => !existingOrder.includes(progId));
    let html = '';
    if (selected.length) {
      html += '<div class="row g-2 align-items-center">';
      html += '<div class="col-6 fw-bold">Program Name</div>';
      html += '<div class="col-4 fw-bold">Order</div>';
      html += '</div>';
      // Render existing programs in their current order
      existingOrder.forEach((progId) => {
        let order = currentOrders[progId];
        html += '<div class="row g-2 align-items-center mb-1">';
        html += '<div class="col-6">' + getProgramName(progId) + ' <span class="text-muted small">(' + progId + ')</span></div>';
        html += '<div class="col-4"><input type="number" class="form-control" name="program_order[' + progId + ']" value="' + order + '" placeholder="Order"></div>';
        html += '</div>';
      });
      // Render new programs at the end
      newPrograms.forEach((progId) => {
        let order = maxOrder + 1;
        maxOrder = order;
        html += '<div class="row g-2 align-items-center mb-1">';
        html += '<div class="col-6">' + getProgramName(progId) + ' <span class="text-muted small">(' + progId + ')</span></div>';
        html += '<div class="col-4"><input type="number" class="form-control" name="program_order[' + progId + ']" value="' + order + '" placeholder="Order"></div>';
        html += '</div>';
      });
      html += '<small class="text-muted">Order is used for sorting programs in this destination and across the site.</small>';
    }
    programOrderContainer.innerHTML = html;
  }

  if (programSelect && programOrderContainer) {
    programSelect.addEventListener('change', renderProgramOrderFields);
    // Initial render in case of pre-selected
    renderProgramOrderFields();
  }

}); // End $(document).ready()
