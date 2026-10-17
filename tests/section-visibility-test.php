<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/section-visibility.php';

function check_visibility(bool $condition, string $message): void {
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

// Legacy records preserve the historical page: category intro/sections/gallery hidden.
check_visibility(gocamp_entity_section_visible([], 'destination', 'hero'), 'Legacy destination hero');
check_visibility(gocamp_entity_section_visible([], 'program', 'card_highlights'), 'Legacy program highlights');
check_visibility(!gocamp_entity_section_visible([], 'category', 'sections'), 'Legacy category sections');
check_visibility(!gocamp_entity_section_visible([], 'category', 'intro'), 'Legacy category intro');
check_visibility(!gocamp_entity_section_visible([], 'category', 'gallery'), 'Legacy category gallery');

// Enabling a hidden section persists as a simple value, without deleting any content.
$record = ['section_visibility' => gocamp_read_visibility([
    'sections' => '1', 'hero' => '0', 'programs' => '1'
], 'category')];
check_visibility(gocamp_entity_section_visible($record, 'category', 'sections'), 'Sections enabled');
check_visibility(!gocamp_entity_section_visible($record, 'category', 'hero'), 'Hero disabled');
check_visibility($record['section_visibility']['gallery'] === false, 'Missing checkbox is hidden');
check_visibility(!gocamp_section_visible(['section_visibility' => ['faq' => '0']], 'faq'), 'String false');

// Legacy nested sections are active unless explicitly disabled.
$legacySection = ['title' => 'Learn English'];
$hiddenSection = ['title' => 'London Visit', 'is_active' => false];
check_visibility(($legacySection['is_active'] ?? true) === true, 'Legacy nested section');
check_visibility(($hiddenSection['is_active'] ?? true) === false, 'Hidden nested section');
echo "Section visibility tests passed\n";
