<?php
declare(strict_types=1);

/**
 * Dynamic public HTTP smoke tests. Expectations come from the current PHP
 * catalogs and section-visibility settings rather than named UK records.
 *
 * Usage: php tests/catalog-http-smoke-test.php http://127.0.0.1:8765
 */
require __DIR__ . '/../data/all_programs.php';
require __DIR__ . '/../data/destinations.php';
require __DIR__ . '/../data/programs.php';
require __DIR__ . '/../includes/section-visibility.php';

function catalog_check(bool $condition, string $error): void {
    if (!$condition) {
        throw new RuntimeException($error);
    }
}

function catalog_slug(string $slug): string {
    catalog_check((bool)preg_match('/^[a-zA-Z0-9_-]+$/', $slug), "Unsafe catalog slug: $slug");
    return $slug;
}

function fetch_catalog_page(string $base, string $path, int $expectedStatus = 200): string {
    $context = stream_context_create(['http' => [
        'timeout' => 12,
        'ignore_errors' => true,
        'follow_location' => 1,
        'max_redirects' => 5,
        'header' => "Connection: close\r\n",
    ]]);
    $page = @file_get_contents($base . $path, false, $context);
    $status = null;
    foreach ($http_response_header ?? [] as $header) {
        if (preg_match('/^HTTP\/[\d.]+\s+(\d{3})/', $header, $match)) {
            $status = (int)$match[1];
        }
    }
    catalog_check($status === $expectedStatus,
        "$path: expected HTTP $expectedStatus, got " . ($status ?? 'no response'));
    catalog_check(is_string($page) && $page !== '', "$path: response body is empty");
    return $page;
}

function catalog_modal_ids(string $html, string $route): array {
    preg_match_all('/\bid="programModal-([^"]+)"/', $html, $matches);
    $ids = array_map(static fn(string $value): string =>
        html_entity_decode($value, ENT_QUOTES | ENT_HTML5, 'UTF-8'), $matches[1]);
    catalog_check(count($ids) === count(array_unique($ids)),
        "$route: duplicate program modal IDs detected");
    sort($ids);
    return $ids;
}

function expect_catalog_modals(string $html, string $route, array $expected): void {
    $actual = catalog_modal_ids($html, $route);
    $expected = array_values(array_unique($expected));
    sort($expected);
    catalog_check($actual === $expected,
        "$route: rendered program IDs differ from active catalog.\nMissing: " .
        json_encode(array_values(array_diff($expected, $actual))) .
        "\nUnexpected: " . json_encode(array_values(array_diff($actual, $expected))));
    foreach ($expected as $id) {
        $target = 'data-bs-target="#programModal-' .
            htmlspecialchars($id, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '"';
        catalog_check(str_contains($html, $target),
            "$route: missing program card link to modal for $id");
    }
}

function catalog_visible_program(string $id, array $destinations): bool {
    // Matches public program page behavior: the first assigned destination
    // decides whether a program belongs to a trashed destination.
    foreach ($destinations as $destination) {
        if (in_array($id, $destination['program_ids'] ?? [], true)) {
            return ($destination['status'] ?? '') !== 'trash';
        }
    }
    return true; // Active standalone programs are publicly listed.
}

try {
    catalog_check(PHP_SAPI === 'cli', 'Run this test using PHP CLI.');
    $base = rtrim($argv[1] ?? 'http://127.0.0.1:8765', '/');
    catalog_check((bool)filter_var($base, FILTER_VALIDATE_URL),
        'Expected a valid HTTP server URL.');

    foreach (['/', '/about', '/contact', '/faq', '/landing', '/admin'] as $route) {
        fetch_catalog_page($base, $route);
    }

    // Catalog referential integrity + active-program expectations.
    $visible = [];
    foreach ($all_programs as $key => $program) {
        catalog_check(is_array($program), "Program $key must be an array");
        catalog_slug((string)$key);
        catalog_check(($program['id'] ?? $key) === $key,
            "Program key/id mismatch: $key");
        $status = $program['status'] ?? '';
        catalog_check(in_array($status, ['active', 'inactive', 'trash'], true),
            "Unexpected program status for $key: $status");
        if ($status === 'active' && catalog_visible_program((string)$key, $destinations)) {
            $visible[$key] = $program;
        }
    }
    foreach ($destinations as $key => $destination) {
        catalog_check(is_array($destination), "Destination $key must be an array");
        $seen = [];
        foreach (($destination['program_ids'] ?? []) as $id) {
            catalog_check(isset($all_programs[$id]),
                "Destination $key references missing program $id");
            catalog_check(!isset($seen[$id]),
                "Destination $key links program $id more than once");
            $seen[$id] = true;
        }
    }

    $allHtml = fetch_catalog_page($base, '/programs');
    expect_catalog_modals($allHtml, '/programs', array_keys($visible));
    foreach ($destinations as $key => $destination) {
        $slug = catalog_slug((string)($destination['slug'] ?? $key));
        $route = '/destinations/' . $slug;
        $status = $destination['status'] ?? '';
        if ($status === 'trash') {
            fetch_catalog_page($base, $route, 404);
            continue;
        }
        $html = fetch_catalog_page($base, $route);
        $expected = [];
        $hasPrograms = $status !== 'coming-soon' &&
            gocamp_entity_section_visible($destination, 'destination', 'programs');
        if ($hasPrograms) {
            foreach (($destination['program_ids'] ?? []) as $id) {
                if (($all_programs[$id]['status'] ?? '') === 'active') {
                    $expected[] = $id;
                }
            }
        }
        expect_catalog_modals($html, $route, $expected);
        if ($status !== 'coming-soon') {
            $showIntro = gocamp_entity_section_visible($destination, 'destination', 'intro');
            catalog_check(str_contains($html, 'id="destination-intro"') === $showIntro,
                "$route: intro section does not match visibility data");
        }
    }

    foreach ($programs as $key => $category) {
        $slug = catalog_slug((string)($category['slug'] ?? $key));
        $route = '/program/category?category=' . rawurlencode($slug);
        if (($category['status'] ?? '') !== 'active') {
            fetch_catalog_page($base, $route, 404);
            continue;
        }
        $html = fetch_catalog_page($base, $route);
        $expected = [];
        if (gocamp_entity_section_visible($category, 'category', 'programs')) {
            foreach ($visible as $id => $program) {
                if (($program['category_slug'] ?? '') === $key) {
                    $expected[] = $id;
                }
            }
        }
        expect_catalog_modals($html, $route, $expected);
    }

    echo "Catalog HTTP smoke tests passed: " . count($visible) .
        " visible programs, " . count($destinations) . " destinations, " .
        count($programs) . " categories checked.\n";
} catch (Throwable $error) {
    fwrite(STDERR, "Catalog HTTP smoke test failed: " . $error->getMessage() . "\n");
    exit(1);
}
