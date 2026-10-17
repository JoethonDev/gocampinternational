<?php
declare(strict_types=1);

/**
 * Read public route slugs from the actual catalogs.
 * CLI output is consumed by responsive browser tests; no hardcoded destinations/categories.
 */
require __DIR__ . '/../data/destinations.php';
require __DIR__ . '/../data/programs.php';

$routes = ['destinations' => [], 'categories' => [], 'screenshotDestination' => null];
foreach ($destinations as $key => $destination) {
    $slug = $destination['slug'] ?? $key;
    if (($destination['status'] ?? '') === 'trash') {
        continue;
    }
    if (!is_string($slug) || !preg_match('/^[a-zA-Z0-9_-]+$/', $slug)) {
        fwrite(STDERR, "Invalid public destination slug for: $key\n");
        exit(1);
    }
    $route = '/destinations/' . $slug;
    $routes['destinations'][] = $route;
    if ($routes['screenshotDestination'] === null &&
        ($destination['status'] ?? '') === 'active' &&
        !empty($destination['program_ids'])) {
        $routes['screenshotDestination'] = $route;
    }
}
foreach ($programs as $key => $category) {
    $slug = $category['slug'] ?? $key;
    if (($category['status'] ?? '') !== 'active') {
        continue;
    }
    if (!is_string($slug) || !preg_match('/^[a-zA-Z0-9_-]+$/', $slug)) {
        fwrite(STDERR, "Invalid active category slug for: $key\n");
        exit(1);
    }
    $routes['categories'][] = '/program/category?category=' . rawurlencode($slug);
}
sort($routes['destinations']);
sort($routes['categories']);
echo json_encode($routes, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES) . PHP_EOL;
