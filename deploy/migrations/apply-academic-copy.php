<?php
declare(strict_types=1);
/**
 * One-time academic description + Tennis copy update for InfinityFree.
 * Only replaces the requested editorial fields, keeping all other live CMS edits.
 */
if (PHP_SAPI !== 'cli' || count($argv) !== 4) {
    fwrite(STDERR, "Usage: php apply-academic-copy.php REPO_ROOT LIVE_DATA OUTPUT_DIR\n");
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
        if (!is_dir($path)) fail_migration("Missing migration directory");
    }
    $schema = ['all_programs.php' => 'all_programs',
        'programs.php' => 'programs', 'destinations.php' => 'destinations'];
    $source = [];
    $live = [];
    foreach ($schema as $filename => $variable) {
        $source[$variable] = read_static_catalog($repository . '/data/' . $filename, $variable);
        $live[$variable] = read_static_catalog($liveDir . '/' . $filename, $variable);
    }

    $academic = [];
    foreach (($source['destinations']['uk']['program_ids'] ?? []) as $id) {
        if (($source['all_programs'][$id]['category_slug'] ?? '') === 'adult-academic' &&
            ($source['all_programs'][$id]['status'] ?? '') === 'active') {
            $academic[] = $id;
        }
    }
    if (count($academic) !== 7) fail_migration('Expected exactly seven reviewed UK academic subjects');
    foreach ($academic as $id) {
        if (!isset($live['all_programs'][$id]) || !is_array($live['all_programs'][$id])) {
            fail_migration("Missing live academic program $id");
        }
        foreach (['description', 'highlights'] as $field) {
            if (empty($source['all_programs'][$id][$field])) {
                fail_migration("Source academic field missing: $id/$field");
            }
            $live['all_programs'][$id][$field] = $source['all_programs'][$id][$field];
        }
    }

    foreach (['description', 'highlights', 'includes'] as $field) {
        $id = 'tennis-academy';
        if (!isset($live['all_programs'][$id]) || !is_array($live['all_programs'][$id]) ||
            empty($source['all_programs'][$id][$field])) {
            fail_migration("Missing reviewed Tennis field $id/$field");
        }
        $live['all_programs'][$id][$field] = $source['all_programs'][$id][$field];
    }
    if (!isset($live['programs']['tennis']) || !is_array($live['programs']['tennis'])) {
        fail_migration('Live Tennis category does not exist');
    }
    foreach (['intro', 'sections'] as $field) {
        if (empty($source['programs']['tennis'][$field])) {
            fail_migration("Source Tennis category field missing: $field");
        }
        $live['programs']['tennis'][$field] = $source['programs']['tennis'][$field];
    }

    // Destination and other programme records are untouched. The gallery policy
    // is enforced centrally by includes/section-visibility.php, not data deletion.
    $changed = [];
    foreach ($schema as $filename => $variable) {
        $before = read_static_catalog($liveDir . '/' . $filename, $variable);
        if ($before === $live[$variable]) continue;
        $data = "<?php\n/** Generated by GoCamp reviewed academic editorial migration. */\n\n" .
            '$' . $variable . ' = ' . var_export($live[$variable], true) . ";\n";
        if (file_put_contents($outDir . '/' . $filename, $data) === false) {
            fail_migration("Cannot write staged file $filename");
        }
        $changed[] = $filename;
    }
    echo json_encode(['changed' => $changed, 'checked' => array_keys($schema)],
        JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES) . "\n";
} catch (Throwable $e) {
    fwrite(STDERR, "Catalog migration blocked: " . $e->getMessage() . "\n");
    exit(1);
}
