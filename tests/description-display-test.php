<?php
declare(strict_types=1);

require_once __DIR__ . '/../includes/content-description.php';
require_once __DIR__ . '/../includes/section-visibility.php';

function expect_description(bool $condition, string $message): void {
    if (!$condition) {
        throw new RuntimeException($message);
    }
}

$richText = '<p class="lead">Medicine &amp; Science</p><p onclick="alert(1)">Learn <strong style="color:red">together</strong>.</p>';
expect_description(gocamp_description_text($richText) === 'Medicine & Science Learn together.', 'Plain text from CMS paragraphs');
expect_description(gocamp_description_excerpt($richText, 18) === 'Medicine & Science…', 'UTF-8-safe preview truncation');
$safe = gocamp_description_markup($richText . '<script>alert(2)</script><a href="javascript:alert(3)">Read more</a>');
expect_description(str_contains($safe, '<strong>together</strong>'), 'Formatting is retained');
expect_description(!str_contains($safe, 'onclick') && !str_contains($safe, 'style=') && !str_contains($safe, '<script') && !str_contains($safe, 'href='), 'Untrusted HTML attributes and tags are removed');

// Legacy destination intros are visible, but explicit admin deactivation wins.
expect_description(gocamp_entity_section_visible([], 'destination', 'intro'), 'Destination description is visible by default');
expect_description(!gocamp_entity_section_visible(['section_visibility' => ['intro' => false]], 'destination', 'intro'), 'Admin-hidden description remains hidden');

$program = [
    'id' => 'test-medicine',
    'name' => 'Medicine',
    'tagline' => 'Short tagline',
    'description' => '<p>Practical &amp; interactive medicine course.</p>',
    'status' => 'active',
];
ob_start();
include __DIR__ . '/../sections/program_card_modern.php';
$card = (string)ob_get_clean();
expect_description(!str_contains($card, 'Practical &amp; interactive medicine course.'), 'Program description stays out of the card');
expect_description(str_contains($card, 'Short tagline'), 'Program card may show its separate tagline');
expect_description(str_contains($card, 'data-bs-target="#programModal-test-medicine"'), 'Card links to detail modal');

ob_start();
include __DIR__ . '/../sections/program_detail_modal.php';
$modal = (string)ob_get_clean();
expect_description(str_contains($modal, 'id="programModal-test-medicine"'), 'Matching program details modal renders');
expect_description(str_contains($modal, 'Practical &amp; interactive medicine course.'), 'Program details show full description');

$program['description'] = '';
ob_start();
include __DIR__ . '/../sections/program_detail_modal.php';
$modalFallback = (string)ob_get_clean();
expect_description(str_contains($modalFallback, 'Short tagline'), 'Program details fall back to tagline only when description is missing');

$public_destinations = [
    [
        'name' => 'Example Destination',
        'slug' => 'example-destination',
        'status' => 'active',
        'banner' => '/images/placeholder.webp',
        'tagline' => '',
        'intro_text' => '<p>Travel &amp; learn together.</p>',
    ],
];
ob_start();
include __DIR__ . '/../sections/destination-cards.php';
$destinations = (string)ob_get_clean();
expect_description(str_contains($destinations, 'Travel &amp; learn together.'), 'Destination card shows the saved intro text');
expect_description(str_contains($destinations, '/destinations/example-destination'), 'Destination card links to its detail page');

echo "Description display tests passed\n";
