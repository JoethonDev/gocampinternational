<?php
declare(strict_types=1);

function admin_ui_expect(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}
$root = dirname(__DIR__);
$category = file_get_contents($root . '/admin/edit-program-category.php');
$destination = file_get_contents($root . '/admin/edit-destination.php');
$media = file_get_contents($root . '/admin/media-library.php');
$header = file_get_contents($root . '/admin/includes/admin-header.php');
$css = file_get_contents($root . '/admin/css/admin-modern.css');
$script = file_get_contents($root . '/admin/js/admin-scripts.js');

admin_ui_expect(str_contains($category, "\$new_data['intro_image'] = \$_POST['intro_image'] ?? '';"), 'Category intro image is persisted');
admin_ui_expect(str_contains($destination, "\$new_data['intro_image'] = \$_POST['intro_image'] ?? '';"), 'Destination intro image is persisted');
admin_ui_expect(substr_count($category, 'data-action="clear-media"') >= 2, 'Category banner and intro image can be removed');
admin_ui_expect(substr_count($destination, 'data-action="clear-media"') >= 2, 'Destination banner and intro image can be removed');
admin_ui_expect(str_contains($script, '[data-action="clear-media"]'), 'Media removal behavior is registered');
admin_ui_expect(str_contains($media, '$perPage = 24;') && str_contains($media, 'aria-label="Image library pages"'), 'Image library is paginated');
admin_ui_expect(strpos($header, "localStorage.getItem('admin-theme')") < strpos($header, "includes/styles.php"), 'Theme is applied before styles load');
admin_ui_expect(str_contains($css, 'animation: none !important;') && str_contains($css, 'border-color: var(--input-border) !important;'), 'Admin animation and input-border fixes are active');

echo "Admin UI regression tests passed\n";
