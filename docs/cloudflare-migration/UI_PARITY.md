# Visual + interaction parity gate — source is PR #40
The PHP templates, CSS and JS are the authoritative UI/UX reference. The migration must not redesign the site.

## 2026-10-31 findings and repairs
- Navbar dropdown toggles: PR40 uses `a.nav-link.dropdown-toggle`. The first React port used `button.nav-link.btn.btn-link`, which caused unwanted underline due to `design-system.css .btn-link {text-decoration:underline}`. Replaced with original anchor semantics.
- PR40 `js/main.js` opens dropdowns on mouse hover for desktop >=1200px and uses Bootstrap click toggles on mobile. React was missing the hover registration. Ported interaction in `SiteInteractions.tsx`, without loading legacy form AJAX handlers that would conflict with React Router forms.
- PR40 `js/ux-enhancements.js` handles active nav, scroll shadow, back-to-top and optional lightbox. Ported targeted behavior in React effects, with cleanup on navigation and reduced-motion support.
- PR40 `includes/styles.php` includes Font Awesome CSS. React now includes the same resource and font preconnect.
- PR40 footer has LinkedIn, managing director contact icons and two-column copyright line. React restored the original markup.
- PR40 homepage hero caption text-shadow, category card layout and category banner parallax aligned.
- PR40 global CSS file sequence preserved: Bootstrap, icons, Font Awesome, style.css, programs-theme.css, ux-enhancements.css, design-system.css. Original image assets remain copied at build time.

## Automated checks
A GitHub Actions browser workflow now runs PHP original and live React staging at 1440x900, 820x1180 and 390x844, taking paired full-page screenshots for home, Italy destination and adult-academic category. It measures navbar height, hero height, background-image path, underline presence, horizontal overflow and desktop hover behavior. Screenshot artifacts are uploaded for manual inspection.

The workflow is expected to find remaining drift and can fail before pixel perfection. A passing HTTP smoke alone is NOT visual acceptance. Document any genuine differences and fix the React implementation while keeping source design CSS unmodified. Keep other workflows separate.

## Remaining
- Inspect screenshot pairs, reconcile missing sections, card interaction, form/modal behavior and footer details across all routes.
- Verify dropdown hover/click on real touch and keyboard devices, carousel auto advance and menu cleanup on client-side route navigation.
- Ensure no artificial title underlines; original `nav-link::after` accent animation on hover should remain.
- Add visual baselines for About, FAQ, Contact, all destination/status variants, and admin pages after the public baseline passes.
