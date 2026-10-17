<?php
declare(strict_types=1);
require __DIR__ . '/../data/all_programs.php';
require_once __DIR__ . '/../includes/section-visibility.php';

$record = $all_programs['uk-soccer-club-experience'] ?? null;
if (!is_array($record)) throw new RuntimeException('UK Soccer catalogue entry missing');
$hero = '/images/uk-soccer-arsenal-day-hero.webp';
$expected = [
    $hero,
    '/images/uk-soccer-camp-group-hallway.webp',
    '/images/uk-soccer-camp-group-outdoor.webp',
    '/images/uk-soccer-training-session.webp',
    '/images/uk-soccer-training-huddle.webp',
];
if (($record['image'] ?? null) !== $hero) {
    throw new RuntimeException('Fourth user-selected photograph must be the main image');
}
$gallery = $record['gallery'] ?? null;
if (!is_array($gallery) || count(array_unique($gallery)) !== count($gallery)) {
    throw new RuntimeException('Invalid or duplicate Soccer gallery items');
}
foreach ($expected as $photo) {
    if (!in_array($photo, $gallery, true)) {
        throw new RuntimeException("Missing Soccer gallery photograph: $photo");
    }
    $file = dirname(__DIR__) . $photo;
    $dimensions = is_file($file) ? @getimagesize($file) : false;
    if (!$dimensions || $dimensions[0] < 1000 || $dimensions[1] < 850 ||
        ($dimensions['mime'] ?? '') !== 'image/webp') {
        throw new RuntimeException("Missing, damaged or low-resolution photograph: $photo");
    }
}
if (!gocamp_entity_section_visible($record, 'program', 'modal_gallery')) {
    throw new RuntimeException('Soccer gallery is not visible to website visitors');
}
foreach ($all_programs as $id => $program) {
    if ($id !== 'uk-soccer-club-experience' &&
        gocamp_entity_section_visible($program, 'program', 'modal_gallery')) {
        throw new RuntimeException("Gallery unexpectedly enabled for: $id");
    }
}
echo "Five optimized Soccer photos, selected hero and gallery policy verified\n";
