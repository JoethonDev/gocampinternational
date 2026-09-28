---
applyTo: '**'
---
# User Memory

## User Preferences
- Programming languages: PHP
- Code style preferences: Responsive, modular, clean
- Development environment: VS Code, Windows
- Communication style: Concise, step-by-step, recap after each phase

## Project Context
- Current project type: Web app (Go Camp International)
- Tech stack: PHP, HTML, CSS, JS
- Architecture patterns: Modular includes, data-driven
- Key requirements: Responsive UI, admin panel, data migration, robust error handling

## Coding Patterns
- Use includes for modularity
- Data stored in PHP arrays/files
- Admin panel for CRUD
- Gallery images currently in destination, need migration to program
- Responsive design required

## Context7 Research History
- Not yet performed for gallery best practices (to be done if needed)

## Conversation History
- User requested multi-phase modification:
  - Phase 1: Move gallery from destination to program, display galleries in destination and program cards, update admin panel
  - Phase 2: Restrict access to trash items unless admin
  - Phase 3: Status handling for destinations (active/coming soon)
  - Phase 4: Status handling for programs (active/inactive)
- User wants only Phase 1 implemented now, others to be planned for future

## Notes
- Gallery mapping by name (partial match, e.g., "Kitchen" → food program, "Junior" → junior-discovery)
- If image cannot be mapped, mention in chat for user guidance
- No other changes except gallery migration and display for Phase 1
- Must be mobile and desktop responsive



# Phase 1: Gallery Migration & Display Plan

## Phase 2 Progress Update (2025-12-21)
- Public program and category listings now hide programs linked to trashed destinations.
- Direct access to a trashed destination returns 404.
- Programs linked to trashed destinations are not counted, not shown, and not accessible to non-admins.
## Progress Update (2025-12-21)
- Program detail modal now includes a responsive Bootstrap tab navigation with a Gallery tab (if images exist), as part of Phase 1.
## Step-by-step Plan
1. **Data Migration:**
   - Move gallery images from each destination to corresponding program in all_programs.php
   - Use name mapping (partial match) to assign images
   - List unmapped images for user guidance
2. **Destination Page Gallery:**
   - Display gallery section in destination/index.php
   - Group images by program, show as responsive gallery
3. **Program Card Gallery:**
   - Add gallery preview (e.g., carousel or grid) inside program_card_modern.php
   - Ensure mobile/desktop responsiveness
4. **Admin Panel Update:**
   - Move gallery management from edit-destination.php to edit-program.php
   - Update forms and save logic
5. **Testing:**
   - Test on desktop and mobile
   - Validate all images are shown correctly
   - Ensure no other features are affected
6. **Recap & Documentation:**
   - Update memory file after each step
   - List any unmapped images for user feedback


# 2026-01-11: UI/UX CTA & Badge/Tag Removal (Comment-Only)

## Objective
- Remove all CTAs ("Book Now", "Contact Us", "Ready To Join", etc.), price listings, badges/tags (except ages), "Get Info"/"More Features"/"View Details"/"Reserve" buttons, and related modal triggers from all program/category cards and modals, except in navbar and contact pages.
- All removals are by commenting code, not deleting, for easy reversion.

## Files & Changes
- **sections/program_card_modern.php**
   - Commented out: More Features button, Price Listing, all CTA footers/buttons ("Reserve Your Spot", "View Full Details"), all badges/tags except ages, modal triggers for "Get Details/More Features", and line separators between tagline/overview and highlights.
- **sections/category_card_modern.php**
   - Commented out: All badges/tags, "Get Info" button, and related CTA elements.
- **sections/program_detail_modal.php**
   - Commented out: Modal CTA footer ("Ready to join?", "Book Now" button).
- **sections/destination-cards.php**
   - No CTAs present; no changes needed.
- **General**
   - All removals are by commenting, not deleting, as per restriction.
   - No changes to navbar or contact pages.

## Rollback
- To revert, uncomment the relevant code blocks in the above files.

## Next Steps
- If further UI/UX cleanup is needed, follow the same comment-only approach and update this changelog.

# Phase 4: Program Status Handling (Started 2025-12-21)

## Objective
- Implement robust handling of program status (active/inactive) across all public and admin views.

## Requirements
- Only programs with status 'active' should be visible on public pages (home, program listings, destination pages, etc.).
- Inactive programs should not be shown, counted, or accessible to non-admin users.
- Admin panel should allow toggling program status between active and inactive.
- Direct access to an inactive program should show 404 or a suitable message for non-admins.
- All program counts and listings must reflect only active programs.
- Ensure changes are mobile and desktop responsive.

## Step-by-step Plan
1. Update all public program listings (home, program/index.php, program/category.php, destination pages) to filter by status 'active'.
2. Update program detail modal and cards to only show active programs.
3. Update admin panel (edit-program.php, programs.php) to allow status toggle and show all programs regardless of status.
4. Restrict direct access to inactive programs for non-admins (404 or message).
5. Test all changes on desktop and mobile.
6. Update memory file after each step.

---
**Current Focus:** Phase 4 (program status handling)
---
