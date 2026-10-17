<?php
/**
 * Display helpers for existing CMS description/intro fields.
 * Card excerpts are plain text; detail views retain basic formatting without
 * carrying arbitrary HTML attributes or executable content from the editor.
 */

function gocamp_description_text(string $html): string {
    // Preserve boundaries when the CMS stores multiple paragraphs or list items.
    $spaced = preg_replace('~</(?:p|div|li|h[1-6]|ul|ol)\s*>|<br\s*/?>~iu', ' ', $html) ?? $html;
    $text = html_entity_decode(strip_tags($spaced), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    return trim(preg_replace('/\s+/u', ' ', $text) ?? $text);
}

function gocamp_description_excerpt(string $html, int $maxChars = 170): string {
    $text = gocamp_description_text($html);
    $maxChars = max(1, min($maxChars, 500));
    if (preg_match('/^(.{' . $maxChars . '})(?=.)/us', $text, $match)) {
        return rtrim($match[1], " \t\n\r\0\x0B.,;:") . '…';
    }
    return $text;
}

function gocamp_description_markup(string $html): string {
    // strip_tags alone keeps dangerous attributes (e.g. onclick) on allowed
    // elements. Remove every attribute and disallow embedded links/media.
    $allowed = strip_tags($html, '<p><ul><ol><li><br><strong><em><b><i>');
    return preg_replace_callback(
        '~<\s*(/?)\s*(p|ul|ol|li|br|strong|em|b|i)\b[^>]*>~i',
        static fn(array $tag): string => '<' . $tag[1] . strtolower($tag[2]) . '>',
        $allowed
    ) ?? '';
}
