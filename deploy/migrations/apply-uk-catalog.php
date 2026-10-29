<?php
declare(strict_types=1);

/**
 * One-time, targeted catalog migration for InfinityFree development.
 *
 * CLI-only. Arguments: repository root, downloaded live data directory,
 * writable output directory. Never writes to the live site directly.
 *
 * The input PHP files are accepted only when they consist of a static
 * array literal assignment; reject executable PHP from the FTP server.
 */
if (PHP_SAPI !== 'cli' || count($argv) !== 4) {
    fwrite(STDERR, "Usage: php apply-uk-catalog.php REPO_ROOT LIVE_DATA OUTPUT_DIR\n");
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

    $academic = [
        'uk-academic-engineering', 'uk-academic-architecture',
        'uk-academic-medicine', 'uk-academic-business-management',
        'uk-academic-computer-science', 'uk-academic-artificial-intelligence',
        'uk-academic-economics',
    ];
    $legacy = ['uk-young-professional', 'uk-pre-university',
        'uk-english-foundation'];
    $newPrograms = ['tennis-academy', 'uk-soccer-club-experience',
        'uk-young-leader-oxford', 'uk-mini-mba'];
    $programSource = $source['all_programs'];
    $programLive = &$live['all_programs'];

    foreach ($legacy as $id) {
        assert_record($programSource, $id, 'inactive');
        if (isset($programLive[$id])) {
            if (!is_array($programLive[$id])) fail_migration("Invalid live record $id");
            $programLive[$id]['status'] = 'inactive';
        }
    }
    foreach ($academic as $id) {
        $desired = assert_record($programSource, $id, 'active');
        if (!isset($programLive[$id])) {
            $programLive[$id] = $desired;
        } else {
            if (!is_array($programLive[$id])) fail_migration("Invalid live record $id");
            // Preserve all admin-edited fields except the requested visibility.
            $programLive[$id]['status'] = 'active';
        }
    }
    foreach ($newPrograms as $id) {
        $desired = assert_record($programSource, $id, 'active');
        if (!isset($programLive[$id])) {
            $programLive[$id] = $desired;
        } elseif (!is_array($programLive[$id])) {
            fail_migration("Invalid existing program $id");
        }
        // Existing records are deliberately retained; repeat runs never wipe edits.
    }

    $categorySource = assert_record($source['programs'], 'tennis', 'active');
    if (!array_key_exists('tennis', $live['programs'])) {
        $live['programs']['tennis'] = $categorySource;
    } elseif (!is_array($live['programs']['tennis'])) {
        fail_migration('Invalid existing tennis category');
    }

    foreach (['uk', 'switzerland'] as $slug) {
        if (!isset($source['destinations'][$slug], $live['destinations'][$slug]) ||
            !is_array($live['destinations'][$slug])) {
            fail_migration("Missing destination $slug");
        }
    }
    $requestedUK = $source['destinations']['uk']['program_ids'] ?? null;
    if (!is_array($requestedUK) ||
        count($requestedUK) !== count($academic) + count($newPrograms) ||
        array_values($requestedUK) !== array_merge($academic, $newPrograms)) {
        fail_migration('Source UK links differ from reviewed migration');
    }
    $live['destinations']['uk']['program_ids'] = $requestedUK;
    $swiss = $live['destinations']['switzerland']['program_ids'] ?? [];
    if (!is_array($swiss)) fail_migration('Invalid Swiss program links');
    if (!in_array('tennis-academy', $swiss, true)) $swiss[] = 'tennis-academy';
    $live['destinations']['switzerland']['program_ids'] = array_values(array_unique($swiss));

    // Do not change any other existing program, category or destination record.
    $changed = [];
    foreach ($schema as $filename => $variable) {
        $before = read_static_catalog($liveDir . '/' . $filename, $variable);
        if ($before === $live[$variable]) continue;
        $data = "<?php\n/** Generated by GoCamp reviewed development catalog migration. */\n\n" .
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
