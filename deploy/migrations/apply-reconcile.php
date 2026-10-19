<?php
declare(strict_types=1);
/**
 * Reconcile Git-managed development content while retaining unrelated CMS fields.
 */
if (PHP_SAPI !== 'cli' || count($argv) !== 4) {
    fwrite(STDERR, "Usage: php apply-reconcile.php REPO_ROOT LIVE_DATA OUTPUT_DIR\n");
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
        if (!is_dir($path)) fail_migration('Missing catalog directory');
    }
    $schema = ['all_programs.php' => 'all_programs', 'programs.php' => 'programs',
        'destinations.php' => 'destinations'];
    $source = $live = [];
    foreach ($schema as $filename => $variable) {
        $source[$variable] = read_static_catalog($repository . '/data/' . $filename, $variable);
        $live[$variable] = read_static_catalog($liveDir . '/' . $filename, $variable);
    }

    // Explicitly Git-managed records only. Unlisted admin-created records remain untouched.
    $managedIds = [
        'germany-german-language-course', 'tennis-academy', 'uk-soccer-club-experience',
        'uk-academic-engineering', 'uk-academic-architecture', 'uk-academic-medicine',
        'uk-academic-business-management', 'uk-academic-computer-science',
        'uk-academic-artificial-intelligence', 'uk-academic-economics',
    ];
    foreach ($managedIds as $id) {
        $record = $source['all_programs'][$id] ?? null;
        if (!is_array($record) || ($record['status'] ?? '') !== 'active') {
            fail_migration("Missing active Git-managed program $id");
        }
        // Reconcile requested editorial content, not prices, availability or other admin fields.
        $fields = ['name', 'tagline', 'description', 'highlights', 'includes', 'image',
                   'category_slug', 'ages', 'duration', 'level', 'badges', 'gallery'];
        if (!isset($live['all_programs'][$id])) {
            $live['all_programs'][$id] = $record;
        } else {
            foreach ($fields as $field) {
                if (array_key_exists($field, $record)) {
                    $live['all_programs'][$id][$field] = $record[$field];
                }
            }
        }
    }
    // All existing catalogue programmes participate in the requested copy rewrite.
    // Do not create retired records or change live prices, status, media or schedules.
    foreach ($source['all_programs'] as $id => $record) {
        if (!isset($live['all_programs'][$id]) || !is_array($live['all_programs'][$id])) continue;
        foreach (['description', 'tagline'] as $field) {
            if (array_key_exists($field, $record)) {
                $live['all_programs'][$id][$field] = $record[$field];
            }
        }
    }
    foreach ($live['all_programs'] as &$record) {
        if (($record['tagline'] ?? '') === 'Academic Insights summer course') $record['tagline'] = '';
    }
    unset($record);
    // Reconcile destination information only where this project explicitly manages it.
    foreach (['germany', 'uk'] as $slug) {
        if (!isset($source['destinations'][$slug], $live['destinations'][$slug])) {
            fail_migration("Missing managed destination $slug");
        }
        $ids = array_values(array_filter($source['destinations'][$slug]['program_ids'] ?? [],
            static fn($id): bool => in_array($id, $managedIds, true)));
        $existing = $live['destinations'][$slug]['program_ids'] ?? [];
        $existing = is_array($existing) ? $existing : [];
        $live['destinations'][$slug]['program_ids'] = array_values(array_unique(
            array_merge($existing, $ids)
        ));
    }
    $germany = $source['destinations']['germany'];
    foreach (['status', 'tagline', 'intro_text', 'highlights'] as $field) {
        $live['destinations']['germany'][$field] = $germany[$field];
    }
    // Apply category prose while preserving live section images, titles and added sections.
    foreach ($source['programs'] as $slug => $category) {
        if (!isset($live['programs'][$slug]) || !is_array($live['programs'][$slug])) continue;
        if (array_key_exists('intro', $category)) {
            $live['programs'][$slug]['intro'] = $category['intro'];
        }
        foreach (($category['sections'] ?? []) as $index => $section) {
            $existing = $live['programs'][$slug]['sections'][$index] ?? null;
            if (is_array($existing) && ($existing['title'] ?? '') === ($section['title'] ?? '') &&
                array_key_exists('content', $section)) {
                $live['programs'][$slug]['sections'][$index]['content'] = $section['content'];
            }
        }
    }

    $changed = [];
    foreach ($schema as $filename => $variable) {
        $before = read_static_catalog($liveDir . '/' . $filename, $variable);
        if ($before === $live[$variable]) continue;
        $data = "<?php\n/** Generated by GoCamp recurring development catalog reconciliation. */\n\n"
            . '$' . $variable . ' = ' . var_export($live[$variable], true) . ";\n";
        if (file_put_contents($outDir . '/' . $filename, $data) === false) {
            fail_migration("Could not stage catalog $filename");
        }
        $changed[] = $filename;
    }
    echo json_encode(['changed' => $changed, 'checked' => array_keys($schema)],
        JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES) . "\n";
} catch (Throwable $e) {
    fwrite(STDERR, "Catalog reconciliation blocked: " . $e->getMessage() . "\n");
    exit(1);
}
