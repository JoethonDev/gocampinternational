<?php
/** Load the shared memories configuration, including the original photo list. */
function gocamp_load_memories() {
    $camp_memories = [];
    $legacy = require __DIR__ . '/../data/camp_memories.php';
    return is_array($legacy) ? ['title' => 'Go Campers Memories', 'show_facebook' => true, 'items' => $legacy] : $camp_memories;
}

/** Only existing image-library files can be published by the editor. */
function gocamp_memory_image($value) {
    if (!is_string($value)) return false;
    $filename = preg_replace('~^/images/~', '', $value);
    if (!preg_match('/\A[a-zA-Z0-9][a-zA-Z0-9 _().-]*\.(?:webp|jpe?g|png|gif)\z/i', $filename)) return false;
    $path = __DIR__ . '/../images/' . $filename;
    return is_file($path) && @getimagesize($path) !== false ? $filename : false;
}

function gocamp_validate_memories($input) {
    $title = is_string($input['title'] ?? null) ? trim($input['title']) : '';
    if (preg_match('/\A.{1,240}\z/us', $title) !== 1) throw new InvalidArgumentException('Enter a heading of at most 240 characters.');
    $rows = $input['memories'] ?? [];
    if (!is_array($rows) || count($rows) > 100) throw new InvalidArgumentException('Use at most 100 memories.');
    $items = [];
    foreach ($rows as $row) {
        if (!is_array($row)) throw new InvalidArgumentException('Invalid memory entry.');
        $image = gocamp_memory_image($row['image'] ?? null);
        $caption = is_string($row['caption'] ?? null) ? trim($row['caption']) : '';
        $country = is_string($row['country'] ?? null) ? trim($row['country']) : '';
        if ($image === false) throw new InvalidArgumentException('Select an existing photo from the media library for every memory.');
        if (preg_match('/\A.{1,1000}\z/us', $caption) !== 1) throw new InvalidArgumentException('Every memory needs a caption of at most 1000 characters.');
        if (preg_match('/\A.{0,80}\z/us', $country) !== 1) throw new InvalidArgumentException('Use a country name of at most 80 characters.');
        $items[] = ['image' => $image, 'caption' => $caption, 'country' => $country, 'is_active' => ($row['is_active'] ?? '') === '1', 'in_slider' => ($row['in_slider'] ?? '') === '1'];
    }
    return ['title' => $title, 'show_facebook' => ($input['show_facebook'] ?? '') === '1', 'items' => $items];
}

/** Keep country grouping explicit; unassigned photos are shown without guessing a country. */
function gocamp_group_memories($items) {
    $groups = [];
    foreach ($items as $item) {
        if (($item['is_active'] ?? true) !== true) continue;
        $country = trim($item['country'] ?? '');
        $groups[$country][] = $item;
    }
    uksort($groups, static function ($a, $b) {
        if ($a === '') return $b === '' ? 0 : 1;
        if ($b === '') return -1;
        return strnatcasecmp($a, $b);
    });
    return $groups;
}
