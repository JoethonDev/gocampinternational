<?php
declare(strict_types=1);
/**
 * Scope-limited one-time update: UK Soccer enhanced images only.
 * Live CMS edits to unrelated properties, records and image galleries survive.
 */
if (PHP_SAPI !== 'cli' || count($argv) !== 4) {
    fwrite(STDERR, "Usage: php apply-soccer-images.php REPO_ROOT LIVE_DATA OUTPUT_DIR\n");
    exit(2);
}

function fail_migration(string $reason): never {
    throw new RuntimeException($reason);
}

function read_static_catalog(string $file, string $variable): array {
    $source = @file_get_contents($file);
    if (!is_string($source) || !str_starts_with($source, '<?php')) {
        fail_migration("Expected a PHP static array file: $variable");
    }
    $variables = 0;
    $assignments = 0;
    foreach (token_get_all($source) as $token) {
        if (is_string($token)) {
            if (!in_array($token, ['=', ',', ';', '(', ')', '[', ']', '-'], true)) {
                fail_migration("Disallowed expression in $variable");
            }
            if ($token === '=') $assignments++;
            continue;
        }
        [$type, $value] = $token;
        if ($type === T_VARIABLE) {
            if ($value !== '$' . $variable) fail_migration("Foreign variable in $variable");
            $variables++;
            continue;
        }
        if (in_array($type, [T_OPEN_TAG, T_WHITESPACE, T_COMMENT, T_DOC_COMMENT,
                T_CONSTANT_ENCAPSED_STRING, T_LNUMBER, T_DNUMBER, T_DOUBLE_ARROW,
                T_ARRAY], true)) {
            continue;
        }
        if ($type === T_STRING && in_array(strtolower($value), ['null', 'true', 'false', 'array'], true)) {
            continue;
        }
        fail_migration("Executable or unexpected PHP token in $variable");
    }
    if ($variables !== 1 || $assignments !== 1) {
        fail_migration("Expected a single static array assignment in $variable");
    }
    // Static-literal-only input was validated above before evaluation.
    $value = (static function (string $path, string $variable): mixed {
        include $path;
        return $$variable ?? null;
    })($file, $variable);
    if (!is_array($value) || count($value) === 0) {
        fail_migration("Catalog $variable must be a nonempty array");
    }
    return $value;
}

function assert_record(array $records, string $id, string $status): array {
    $record = $records[$id] ?? null;
    if (!is_array($record) || ($record['status'] ?? '') !== $status) {
        fail_migration("Source record $id must exist with status $status");
    }
    return $record;
}



try {
    [$command, $repository, $liveDir, $outDir] = $argv;
    foreach ([$repository . '/data', $liveDir, $outDir] as $path) {
        if (!is_dir($path)) fail_migration("Missing catalog directory");
    }
    $id = 'uk-soccer-club-experience';
    $filename = 'all_programs.php';
    $source = read_static_catalog((is_file($repository . '/data/legacy/' . $filename) ? $repository . '/data/legacy/' . $filename : $repository . '/data/' . $filename), 'all_programs');
    $live = read_static_catalog($liveDir . '/' . $filename, 'all_programs');
    if (!isset($live[$id]) || !is_array($live[$id])) {
        fail_migration('Live UK Soccer program does not exist');
    }
    $record = $source[$id] ?? null;
    if (!is_array($record) || ($record['status'] ?? '') !== 'active') {
        fail_migration('Reviewed UK Soccer record missing or inactive');
    }
    $hero = '/images/uk-soccer-arsenal-day-hero.webp';
    if (($record['image'] ?? null) !== $hero) {
        fail_migration('Unexpected UK Soccer hero image');
    }
    $expected = [
        $hero,
        '/images/uk-soccer-camp-group-hallway.webp',
        '/images/uk-soccer-camp-group-outdoor.webp',
        '/images/uk-soccer-training-session.webp',
        '/images/uk-soccer-training-huddle.webp',
    ];
    if (!is_array($record['gallery'] ?? null) ||
        array_diff($expected, $record['gallery'])) {
        fail_migration('Expected five reviewed Soccer gallery photos not found in source');
    }
    foreach ($expected as $path) {
        if (!is_file($repository . $path)) {
            fail_migration('Missing Soccer image asset: ' . $path);
        }
    }

    // Update ONLY image and gallery in this one programme.
    // Merge extra live gallery entries to preserve admin-uploaded photography.
    $priorGallery = $live[$id]['gallery'] ?? [];
    if (!is_array($priorGallery)) fail_migration('Malformed live Soccer gallery');
    $live[$id]['image'] = $hero;
    $live[$id]['gallery'] = array_values(array_unique(array_merge(
        $record['gallery'], $priorGallery
    )));

    $before = read_static_catalog($liveDir . '/' . $filename, 'all_programs');
    $changed = [];
    if ($before !== $live) {
        $data = "<?php\n/** Scoped and reviewed Soccer imagery migration. */\n\n" .
            '$all_programs = ' . var_export($live, true) . ";\n";
        if (file_put_contents($outDir . '/' . $filename, $data) === false) {
            fail_migration('Failed to write staged Soccer catalog');
        }
        $changed[] = $filename;
    }
    echo json_encode(['changed' => $changed, 'checked' => ['all_programs.php']],
        JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES) . "\n";
} catch (Throwable $e) {
    fwrite(STDERR, 'Soccer image migration blocked: ' . $e->getMessage() . "\n");
    exit(1);
}
