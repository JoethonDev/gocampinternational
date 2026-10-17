<?php
declare(strict_types=1);

require_once __DIR__ . '/../admin/media-library-helpers.php';

function media_expect(bool $condition, string $message): void {
    if (!$condition) {
        throw new RuntimeException($message);
    }
}
function media_write(string $file, string $contents): void {
    if (file_put_contents($file, $contents) === false) {
        throw new RuntimeException('Unable to write test fixture ' . $file);
    }
}
function media_remove_tree(string $folder): void {
    if (!is_dir($folder)) return;
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($folder, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );
    foreach ($iterator as $item) {
        if ($item->isDir() && !$item->isLink()) {
            rmdir($item->getPathname());
        } else {
            unlink($item->getPathname());
        }
    }
    rmdir($folder);
}

$root = sys_get_temp_dir() . '/gocamp-media-test-' . bin2hex(random_bytes(6));
mkdir($root, 0700, true);
foreach (['images', 'uploads', 'data', 'sections'] as $folder) {
    mkdir($root . '/' . $folder, 0700);
}
try {
    media_write($root . '/images/old-photo.webp', 'image bytes');
    media_write($root . '/images/old-photo.webp-backup', 'not an image');
    media_write($root . '/images/conflict.webp', 'other image');
    media_write($root . '/uploads/legacy.gif', 'gif bytes');
    media_write($root . '/data/all_programs.php', "<?php\n\$all_programs = ['image' => '/images/old-photo.webp', 'gallery' => ['/images/old-photo.webp','/images/old-photo.webp-backup'], 'nested' => '<img src=\"/images/old-photo.webp\">'];\n");
    media_write($root . '/data/destinations.php', "<?php\n\$destinations = ['banner' => '/images/old-photo.webp?version=1'];\n");
    media_write($root . '/data/faq.json', '{"photo":"/images/old-photo.webp","legacy":"/uploads/legacy.gif"}');

    $files = gocamp_media_list($root);
    media_expect(count($files) === 3, 'Both image folders are scanned, non-image files skipped');
    media_expect(count(gocamp_media_data_usage($root, '/images/old-photo.webp')) === 3, 'Reference inventory includes PHP and JSON');

    $invalid = gocamp_media_rename($root, '/images/old-photo.webp', '../unsafe');
    media_expect(!$invalid['success'] && file_exists($root . '/images/old-photo.webp'), 'Directory traversal is rejected');
    $collision = gocamp_media_rename($root, '/images/old-photo.webp', 'conflict');
    media_expect(!$collision['success'] && file_exists($root . '/images/old-photo.webp'), 'Existing destination cannot be overwritten');
    $missing = gocamp_media_rename($root, '/images/missing.webp', 'anything');
    media_expect(!$missing['success'], 'Missing images are not renamed');

    $renamed = gocamp_media_rename($root, '/images/old-photo.webp', 'new-photo');
    media_expect($renamed['success'] === true, 'Rename succeeds');
    media_expect($renamed['references'] === 5, 'Every matching reference is counted');
    media_expect(!file_exists($root . '/images/old-photo.webp') && is_file($root . '/images/new-photo.webp'), 'Image was moved');
    $programs = file_get_contents($root . '/data/all_programs.php');
    $destination = file_get_contents($root . '/data/destinations.php');
    $faq = file_get_contents($root . '/data/faq.json');
    media_expect(substr_count($programs, '/images/new-photo.webp') === 2, 'Program image and gallery updated');
    media_expect(str_contains($programs, '/images/old-photo.webp-backup'), 'Longer image name remains untouched');
    media_expect(str_contains($destination, '/images/new-photo.webp?version=1'), 'Query-string references are mapped');
    media_expect(json_decode($faq, true)['photo'] === '/images/new-photo.webp', 'JSON references are mapped');
    media_expect(gocamp_media_data_usage($root, '/images/old-photo.webp') === [], 'No stale references in data');

    $legacy = gocamp_media_rename($root, '/uploads/legacy.gif', 'renamed-legacy');
    media_expect($legacy['success'] && is_file($root . '/uploads/renamed-legacy.gif'), 'Legacy uploads are supported');
    media_expect(json_decode(file_get_contents($root . '/data/faq.json'), true)['legacy'] === '/uploads/renamed-legacy.gif', 'Legacy upload reference updated');

    media_write($root . '/images/logo.webp', 'logo image');
    media_write($root . '/sections/template.php', "<img src=\"/images/logo.webp\">");
    $blocked = gocamp_media_rename($root, '/images/logo.webp', 'renamed-logo');
    media_expect(!$blocked['success'] && is_file($root . '/images/logo.webp'), 'Images hardcoded in templates are protected');

    $stageFiles = glob($root . '/data/.media-*') ?: [];
    media_expect($stageFiles === [], 'Temporary rename files are cleaned up');
    echo "Media library rename tests passed\n";
} finally {
    media_remove_tree($root);
}
