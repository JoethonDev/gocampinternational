/**
 * File: assets/js/programs.js
 * Progressive enhancement JavaScript for Programs page
 * Dependencies: Bootstrap 5 JS bundle only
 */

(function() {
    'use strict';
    
    // Wait for DOM to be ready
    document.addEventListener('DOMContentLoaded', function() {
        initProgramFilters();
        initProgramModal();
        initStickyElements();
        initAccessibility();
    });
    
    /**
     * ===================================================================
     * PROGRAM FILTERING
     * ===================================================================
     */
    function initProgramFilters() {
        const searchInput = document.getElementById('programSearch');
        const categoryFilter = document.getElementById('categoryFilter');
        const ageFilter = document.getElementById('ageFilter');
        const resetBtn = document.getElementById('resetFilters');
        const programCards = document.querySelectorAll('[data-program-id]');
        const resultsCount = document.getElementById('resultsCount');
        const noResultsMessage = document.getElementById('noResultsMessage');
        
        if (!searchInput || !categoryFilter || !ageFilter) return;
        
        // Debounce function for search input
        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
        
        // Main filter function
        function filterPrograms() {
            const searchTerm = searchInput.value.toLowerCase().trim();
            const selectedCategory = categoryFilter.value;
            const selectedAge = ageFilter.value;
            
            let visibleCount = 0;
            
            programCards.forEach(card => {
                const programTitle = card.querySelector('.card-title').textContent.toLowerCase();
                const programDescription = card.querySelector('.card-text').textContent.toLowerCase();
                const programCategory = card.dataset.category;
                const ageMin = parseInt(card.dataset.ageMin);
                const ageMax = parseInt(card.dataset.ageMax);
                
                // Search filter
                const matchesSearch = !searchTerm || 
                    programTitle.includes(searchTerm) || 
                    programDescription.includes(searchTerm);
                
                // Category filter
                const matchesCategory = selectedCategory === 'all-programs' || 
                    programCategory === selectedCategory;
                
                // Age filter
                let matchesAge = true;
                if (selectedAge !== 'all-ages') {
                    const ageRange = selectedAge.split('-');
                    if (ageRange.length === 2) {
                        const filterAgeMin = parseInt(ageRange[0]);
                        const filterAgeMax = parseInt(ageRange[1]);
                        matchesAge = (ageMin <= filterAgeMax && ageMax >= filterAgeMin);
                    }
                }
                
                // Show or hide card
                if (matchesSearch && matchesCategory && matchesAge) {
                    card.classList.remove('d-none');
                    visibleCount++;
                } else {
                    card.classList.add('d-none');
                }
            });
            
            // Update results count
            if (resultsCount) {
                resultsCount.textContent = visibleCount;
            }
            
            // Show/hide no results message
            if (noResultsMessage) {
                if (visibleCount === 0) {
                    noResultsMessage.classList.remove('d-none');
                } else {
                    noResultsMessage.classList.add('d-none');
                }
            }
            
            // Update active filters display
            updateActiveFilters(searchTerm, selectedCategory, selectedAge);
        }
        
        // Update active filters display
        function updateActiveFilters(search, category, age) {
            const activeFiltersContainer = document.getElementById('activeFilters');
            const filterChips = document.getElementById('filterChips');
            
            if (!activeFiltersContainer || !filterChips) return;
            
            filterChips.innerHTML = '';
            
            const hasActiveFilters = search || 
                category !== 'all-programs' || 
                age !== 'all-ages';
            
            if (!hasActiveFilters) {
                activeFiltersContainer.classList.add('d-none');
                return;
            }
            
            activeFiltersContainer.classList.remove('d-none');
            
            if (search) {
                addFilterChip(filterChips, 'Search: ' + search, () => {
                    searchInput.value = '';
                    filterPrograms();
                });
            }
            
            if (category !== 'all-programs') {
                const categoryText = categoryFilter.options[categoryFilter.selectedIndex].text;
                addFilterChip(filterChips, 'Category: ' + categoryText, () => {
                    categoryFilter.value = 'all-programs';
                    filterPrograms();
                });
            }
            
            if (age !== 'all-ages') {
                const ageText = ageFilter.options[ageFilter.selectedIndex].text;
                addFilterChip(filterChips, 'Age: ' + ageText, () => {
                    ageFilter.value = 'all-ages';
                    filterPrograms();
                });
            }
        }
        
        // Add filter chip
        function addFilterChip(container, text, removeCallback) {
            const chip = document.createElement('span');
            chip.className = 'badge bg-primary';
            chip.innerHTML = text + ' <span aria-hidden="true">&times;</span>';
            chip.style.cursor = 'pointer';
            chip.setAttribute('role', 'button');
            chip.setAttribute('aria-label', 'Remove filter: ' + text);
            chip.addEventListener('click', removeCallback);
            container.appendChild(chip);
        }
        
        // Event listeners
        searchInput.addEventListener('input', debounce(filterPrograms, 300));
        categoryFilter.addEventListener('change', filterPrograms);
        ageFilter.addEventListener('change', filterPrograms);
        
        // Reset filters
        if (resetBtn) {
            resetBtn.addEventListener('click', function() {
                searchInput.value = '';
                categoryFilter.value = 'all-programs';
                ageFilter.value = 'all-ages';
                filterPrograms();
            });
        }
    }
    
    /**
     * ===================================================================
     * PROGRAM DETAIL MODAL
     * ===================================================================
     */
    function initProgramModal() {
        const modalElement = document.getElementById('programDetailModal');
        if (!modalElement) return;
        
        const modal = new bootstrap.Modal(modalElement);
        const modalContent = document.getElementById('programDetailContent');
        const template = document.getElementById('programDetailTemplate');
        
        // Get all "View Details" buttons
        const viewDetailsButtons = document.querySelectorAll('.view-details-btn');
        
        viewDetailsButtons.forEach(button => {
            button.addEventListener('click', function() {
                const programId = this.dataset.programId;
                loadProgramDetails(programId, modalContent, template);
                modal.show();
            });
        });
        
        // Load program details
        function loadProgramDetails(programId, contentContainer, template) {
            // Find the program card
            const programCard = document.querySelector(`[data-program-id="${programId}"]`);
            
            if (!programCard || !template) {
                contentContainer.innerHTML = '<p class="text-danger">Error loading program details.</p>';
                return;
            }
            
            // Clone template
            const content = template.content.cloneNode(true);
            
            // Extract data from card
            const title = programCard.querySelector('.card-title').textContent;
            const description = programCard.querySelector('.card-text').textContent;
            const image = programCard.querySelector('.program-card-image').src;
            const ageRange = programCard.querySelector('.program-meta .col-6:first-child').textContent.replace('Ages ', '');
            const duration = programCard.querySelector('.program-meta .col-6:nth-child(2)').textContent.trim();
            const location = programCard.querySelector('.program-meta .col-12').textContent.trim();
            const price = programCard.querySelector('.price-amount').textContent;
            const category = programCard.querySelector('.category-tag').textContent;
            
            // Populate template (in a real app, this would come from a database)
            content.querySelector('.program-detail-image').src = image;
            content.querySelector('.program-detail-image').alt = title;
            content.querySelector('.program-detail-title').textContent = title;
            content.querySelector('.program-detail-description').textContent = description;
            content.querySelector('.program-age-range').textContent = ageRange;
            content.querySelector('.program-duration').textContent = duration;
            content.querySelector('.program-location').textContent = location;
            content.querySelector('.program-schedule').textContent = 'June - August 2025'; // Placeholder
            content.querySelector('.program-category-detail').textContent = category;
            content.querySelector('.program-price-detail').textContent = price;
            
            // Add sample highlights (in production, fetch from database)
            const highlightsList = content.querySelector('.program-highlights-list');
            const sampleHighlights = [
                'Professional instruction from certified experts',
                'Small group sizes for personalized attention',
                'State-of-the-art facilities and equipment',
                'Cultural excursions and activities',
                'Full board accommodation in safe environments'
            ];
            
            sampleHighlights.forEach(highlight => {
                const li = document.createElement('li');
                li.textContent = highlight;
                highlightsList.appendChild(li);
            });
            
            // Add sample inclusions
            const includedList = content.querySelector('.program-included-list');
            const sampleInclusions = [
                'Accommodation in comfortable residences',
                'All meals (breakfast, lunch, dinner, snacks)',
                'Program materials and equipment',
                'Airport transfers',
                'Comprehensive insurance coverage',
                '24/7 supervision and support',
                'Certificate of completion'
            ];
            
            sampleInclusions.forEach(inclusion => {
                const li = document.createElement('li');
                li.textContent = inclusion;
                includedList.appendChild(li);
            });
            
            // Clear and populate content
            contentContainer.innerHTML = '';
            contentContainer.appendChild(content);
        }
    }
    
    /**
     * ===================================================================
     * STICKY ELEMENTS
     * ===================================================================
     */
    function initStickyElements() {
        // Adjust sticky sidebar position on scroll (if needed)
        const sidebar = document.querySelector('.booking-cta-sidebar');
        if (!sidebar) return;
        
        // Ensure sidebar doesn't overlap footer
        function adjustStickyPosition() {
            const footer = document.querySelector('footer, .outer_footer_container');
            if (!footer) return;
            
            const footerRect = footer.getBoundingClientRect();
            const sidebarRect = sidebar.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            
            if (footerRect.top < windowHeight) {
                const overlap = windowHeight - footerRect.top;
                sidebar.style.transform = `translateY(-${overlap + 20}px)`;
            } else {
                sidebar.style.transform = 'translateY(0)';
            }
        }
        
        window.addEventListener('scroll', adjustStickyPosition);
        window.addEventListener('resize', adjustStickyPosition);
    }
    
    /**
     * ===================================================================
     * ACCESSIBILITY ENHANCEMENTS
     * ===================================================================
     */
    function initAccessibility() {
        // Trap focus in modal when open
        const modal = document.getElementById('programDetailModal');
        if (modal) {
            modal.addEventListener('shown.bs.modal', function() {
                const focusableElements = modal.querySelectorAll(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                if (focusableElements.length > 0) {
                    focusableElements[0].focus();
                }
            });
        }
        
        // Keyboard navigation for filter chips
        const filterChips = document.getElementById('filterChips');
        if (filterChips) {
            filterChips.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.target.click();
                }
            });
        }
        
        // Announce filter results to screen readers
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            const announcer = document.createElement('div');
            announcer.setAttribute('role', 'status');
            announcer.setAttribute('aria-live', 'polite');
            announcer.className = 'visually-hidden';
            document.body.appendChild(announcer);
            
            const observer = new MutationObserver(function() {
                const count = resultsCount.textContent;
                announcer.textContent = `${count} programs found`;
            });
            
            observer.observe(resultsCount, { childList: true, characterData: true, subtree: true });
        }
    }
    
    /**
     * ===================================================================
     * SMOOTH SCROLL TO FILTERS
     * ===================================================================
     */
    const exploreBtn = document.querySelector('a[href="#program-filters"]');
    if (exploreBtn) {
        exploreBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.getElementById('program-filters');
            if (target) {
                const offset = 100; // Offset for fixed header
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - offset;
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    }
    
})();