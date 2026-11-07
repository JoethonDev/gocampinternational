# Public content editing

The admin editor at `/admin/documents/site_settings` includes public page content,
shared site details, SEO previews and section visibility. It stores overrides in the
existing `site_settings` D1 document. Defaults stay in `app/config/public-content-fields.ts`,
so sites with no overrides render the current content without a data migration.

Select a page or shared component, edit its fields, then save. Image fields use the
media picker. Link fields allow a same-site path, HTTPS, `mailto:` or `tel:`; social
profile links require HTTPS. Use **Reset to original** to remove an override. Text
is rendered as escaped text. Rich FAQ, category and destination descriptions continue
through their existing safe editor and rendering path.

Section checkboxes hide the existing section while keeping its layout in code. The
homepage, about, contact, FAQ, landing, social panels, navigation, footer, booking
form and error pages have their own controls. About section visibility stays with each
section in the About editor, so it follows the content when sections are reordered.
Existing catalog, FAQ, testimonial and memory editors remain the source for those records.
The selected visibility defaults and gallery policies continue to apply.

The save action checks content field IDs, types, lengths and URL schemes, and uses the
document revision to reject a stale edit. There is no new D1 table or runtime package.
