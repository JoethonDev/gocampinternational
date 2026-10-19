<?php
/**
 * Backwards-compatible visibility controls for public site and admin editors.
 * Existing records default to their historical public rendering behavior.
 */
function gocamp_visibility_options(string $entity): array {
    switch ($entity) {
        case 'destination':
            return [
                'hero' => ['Hero banner', true],
                'intro' => ['Destination intro text and image', true],
                'highlights' => ['Hero highlights', true],
                'stats' => ['Statistics', true],
                'programs' => ['Linked programs', true],
                'gallery' => ['Program photo gallery', false],
                'destination_gallery' => ['Destination photo gallery', false],
                'faq' => ['FAQs', true],
                'testimonials' => ['Testimonials', true],
            ];
        case 'category':
            return [
                'hero' => ['Category hero banner', true],
                'intro' => ['Intro and intro image', false],
                'sections' => ['Individual content sections', false],
                'programs' => ['Programs listing', true],
                'gallery' => ['Category photo gallery', false],
                'testimonials' => ['Testimonials', true],
            ];
        case 'home':
            return [
                'hero' => ['Homepage hero slider', true],
                'intro' => ['Homepage introduction', true],
                'destinations' => ['Featured destinations', true],
                'featured_categories' => ['Featured program categories', true],
                'testimonials' => ['Homepage testimonials', true],
            ];
        case 'program':
            return [
                'card_image' => ['Card cover image', true],
                'card_tagline' => ['Card tagline', true],
                'card_highlights' => ['Card highlights', true],
                'modal_details' => ['Detail modal: summary', true],
                'modal_description' => ['Detail modal: description', true],
                'modal_highlights' => ['Detail modal: highlights', true],
                'modal_schedule' => ['Detail modal: schedule', true],
                'modal_gallery' => ['Detail modal: gallery', false],
                'modal_includes' => ['Detail modal: includes', false],
                'modal_excludes' => ['Detail modal: excludes', false],
            ];
        default:
            return [];
    }
}
function gocamp_section_visible(array $record, string $key, bool $default = true): bool {
    $visibility = $record['section_visibility'] ?? [];
    if (!is_array($visibility) || !array_key_exists($key, $visibility)) {
        return $default;
    }
    return filter_var($visibility[$key], FILTER_VALIDATE_BOOLEAN);
}
/**
 * Gallery display is disabled across destinations, program details and
 * program categories. Keep saved media paths for a future re-enable.
 */
function gocamp_gallery_disabled_by_policy(string $entity, string $key): bool {
    return ($entity === 'destination' && in_array($key, ['gallery', 'destination_gallery'], true))
        || ($entity === 'program' && $key === 'modal_gallery')
        || ($entity === 'category' && $key === 'gallery');
}
function gocamp_entity_section_visible(array $record, string $entity, string $key): bool {
    // Only this explicitly requested Soccer programme may display its new gallery.
    // All other programme, category and destination galleries remain disabled.
    if ($entity === 'program' && $key === 'modal_gallery' &&
        ($record['id'] ?? '') === 'uk-soccer-club-experience') {
        return !empty($record['gallery']) && gocamp_section_visible($record, $key, true);
    }
    if (gocamp_gallery_disabled_by_policy($entity, $key)) {
        return false;
    }
    $options = gocamp_visibility_options($entity);
    return gocamp_section_visible($record, $key, (bool)($options[$key][1] ?? true));
}
function gocamp_read_visibility($submitted, string $entity, array $previous = []): array {
    $result = $previous;
    $submitted = is_array($submitted) ? $submitted : [];
    foreach (gocamp_visibility_options($entity) as $key => $definition) {
        $result[$key] = isset($submitted[$key]) && (string)$submitted[$key] === '1';
    }
    return $result;
}
