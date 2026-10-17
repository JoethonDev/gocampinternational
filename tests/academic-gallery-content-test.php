<?php
declare(strict_types=1);
require_once __DIR__ . '/../includes/section-visibility.php';
require __DIR__ . '/../data/all_programs.php';
require __DIR__ . '/../data/destinations.php';
require __DIR__ . '/../data/programs.php';

function check_academic_copy(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}
foreach ($destinations as $slug => $destination) {
    check_academic_copy(
        !gocamp_entity_section_visible($destination, 'destination', 'gallery') &&
        !gocamp_entity_section_visible($destination, 'destination', 'destination_gallery'),
        "Destination galleries remain visible: $slug"
    );
}
foreach ($all_programs as $id => $program) {
    check_academic_copy(
        !gocamp_entity_section_visible($program, 'program', 'modal_gallery'),
        "Program modal gallery remains visible: $id"
    );
}
foreach ($programs as $slug => $category) {
    check_academic_copy(!gocamp_entity_section_visible($category, 'category', 'gallery'),
        "Program category gallery remains visible: $slug");
}
// A stale admin-controlled true flag must not re-enable any gallery.
foreach ([
    ['destination', 'gallery'], ['destination', 'destination_gallery'],
    ['program', 'modal_gallery'], ['category', 'gallery'],
] as [$entity, $key]) {
    check_academic_copy(
        !gocamp_entity_section_visible(['section_visibility' => [$key => true]], $entity, $key),
        "Explicit gallery flag bypasses disabled-gallery policy: $entity/$key"
    );
}

// Derive expectations from the destination's active academic entries, not named test IDs.
$academicIds = array_values(array_filter($destinations['uk']['program_ids'] ?? [],
    static fn(string $id): bool => ($all_programs[$id]['status'] ?? '') === 'active'
        && ($all_programs[$id]['category_slug'] ?? '') === 'adult-academic'));
check_academic_copy(count($academicIds) >= 7, 'Expected reviewed UK academic subjects');
foreach ($academicIds as $id) {
    $program = $all_programs[$id];
    $description = $program['description'] ?? '';
    check_academic_copy(substr_count($description, '<p>') >= 3 &&
        mb_strlen(strip_tags($description)) > 600,
        "Academic description is not substantial: $id");
    check_academic_copy(count($program['highlights'] ?? []) >= 3,
        "Academic highlights missing: $id");
}
$ukPrograms = $destinations['uk']['program_ids'] ?? [];
$swissPrograms = $destinations['switzerland']['program_ids'] ?? [];
$shared = array_values(array_intersect($ukPrograms, $swissPrograms));
foreach ($shared as $id) {
    $program = $all_programs[$id];
    if (($program['category_slug'] ?? '') !== 'tennis') continue;
    $copy = ($program['description'] ?? '') . ' ' .
        implode(' ', $program['highlights'] ?? []) . ' ' .
        implode(' ', $program['includes'] ?? []);
    check_academic_copy(!preg_match('/\b(UK|United Kingdom|England|Switzerland|Swiss|Exsportise)\b/i', $copy),
        "Shared tennis copy has destination-specific claims: $id");
}
echo "Dynamic academic descriptions and all-gallery-disabled checks passed\n";
