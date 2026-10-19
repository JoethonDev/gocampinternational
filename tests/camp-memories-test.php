<?php
require __DIR__ . '/../includes/camp-memories.php';
function check_memory($condition, $label) {
    if (!$condition) throw new RuntimeException($label);
}
$original = gocamp_load_memories();
$image = $original['items'][0]['image'];
$input = ['title' => 'Our memories', 'show_facebook' => '1', 'memories' => [
    ['image' => '/images/' . $image, 'caption' => '<b>A real caption</b>', 'country' => ' Germany ', 'is_active' => '1', 'in_slider' => '1'],
    ['image' => $image, 'caption' => 'Hidden memory'],
]];
$validated = gocamp_validate_memories($input);
check_memory($validated['items'][0]['image'] === $image, 'Normalize library image');
check_memory($validated['items'][0]['caption'] === '<b>A real caption</b>', 'Preserve plain caption for escaped rendering');
check_memory($validated['items'][1]['is_active'] === false, 'Unchecked memory stays hidden');
check_memory($validated['items'][0]['country'] === 'Germany' && $validated['items'][0]['in_slider'], 'Country and slider visibility saved');
check_memory(!$validated['items'][1]['in_slider'], 'Gallery-only photo excluded from slider');
$groups = gocamp_group_memories([
    ['country' => '', 'image' => 'unknown'],
    ['country' => 'Switzerland', 'image' => 'swiss'],
    ['country' => 'Germany', 'image' => 'german'],
    ['country' => 'Germany', 'image' => 'hidden', 'is_active' => false],
]);
check_memory(array_keys($groups) === ['Germany', 'Switzerland', ''], 'Alphabetical countries and unknown group last');
check_memory(count($groups['Germany']) === 1, 'Hidden photos excluded from gallery');
foreach (['../init.php', '/images/../init.php', 'https://example.com/photo.webp', ['bad'], '/images/missing.webp'] as $bad) {
    check_memory(gocamp_memory_image($bad) === false, 'Reject invalid image');
}
foreach ([['title' => ''], ['memories' => 'bad'], ['memories' => [['image' => $image, 'caption' => '']]], ['memories' => array_fill(0, 101, [])]] as $patch) {
    try {
        gocamp_validate_memories(array_replace($input, $patch));
        throw new RuntimeException('Invalid input accepted');
    } catch (InvalidArgumentException $expected) {}
}
$empty = gocamp_validate_memories(['title' => 'No memories']);
check_memory($empty['items'] === [] && !$empty['show_facebook'], 'Allow removing all memories');
echo "Camp memories validation tests passed\n";
