<?php
declare(strict_types=1);
/**
 * Merge the public development-host catalogs into the Git feature branch.
 * Hosted/admin changes win for shared record fields, while Git-only records and
 * destination->program links are retained. The three explicitly approved
 * destination banner paths remain Git-managed.
 *
 * Data is validated as literal-only PHP before it is evaluated. Never sync
 * inquiries, uploads, secrets or executable PHP from hosting.
 */
if (PHP_SAPI !== 'cli' || count($argv) !== 3) {
    fwrite(STDERR, "Usage: php sync-development-catalogs.php REPO_ROOT HOSTED_DATA_DIR\n");
    exit(2);
}

function read_static_array(string $file, string $variable): array {
    $source = file_get_contents($file);
    if (!is_string($source) || !str_starts_with($source, '<?php')) {
        throw new RuntimeException("Not a PHP catalog: $variable");
    }
    $variables = 0;
    $assignments = 0;
    foreach (token_get_all($source) as $token) {
        if (is_string($token)) {
            if (!in_array($token, ['=', ',', ';', '(', ')', '[', ']', '-'], true)) {
                throw new RuntimeException("Unsafe PHP expression in $variable");
            }
            if ($token === '=') $assignments++;
            continue;
        }
        [$type, $value] = $token;
        if ($type === T_VARIABLE) {
            if ($value !== '$' . $variable) throw new RuntimeException("Foreign PHP variable in $variable");
            $variables++;
            continue;
        }
        if (in_array($type, [
            T_OPEN_TAG, T_WHITESPACE, T_COMMENT, T_DOC_COMMENT, T_CONSTANT_ENCAPSED_STRING,
            T_LNUMBER, T_DNUMBER, T_DOUBLE_ARROW, T_ARRAY,
        ], true)) continue;
        if ($type === T_STRING && in_array(strtolower($value), ['null', 'true', 'false', 'array'], true)) continue;
        throw new RuntimeException("Nonliteral PHP content in $variable");
    }
    if ($variables !== 1 || $assignments !== 1) {
        throw new RuntimeException("Unexpected catalog schema: $variable");
    }
    $value = (static function(string $file, string $variable): mixed {
        include $file;
        return $$variable ?? null;
    })($file, $variable);
    if (!is_array($value)) throw new RuntimeException("Catalog must be an array: $variable");
    return $value;
}

function save_static_array(string $file, string $variable, array $value): void {
    $content = "<?php\n/** Merged from development hosting; preserves Git-only records. */\n\n"
        . '$' . $variable . ' = ' . var_export($value, true) . ";\n";
    if (file_put_contents($file, $content) === false) {
        throw new RuntimeException("Could not write merged " . basename($file));
    }
}

function merge_catalog(array $repo, array $host, string $type): array {
    $merged = $repo;
    foreach ($host as $id => $record) {
        if (!is_string($id) || !preg_match('/^[a-zA-Z0-9_-]+$/', $id) || !is_array($record)) {
            throw new RuntimeException("Invalid hosted $type entry");
        }
        if (!isset($repo[$id])) {
            $merged[$id] = $record;
            continue;
        }
        if (!is_array($repo[$id])) throw new RuntimeException("Invalid Git $type record");
        $combined = array_replace($repo[$id], $record);
        if ($type === 'destinations') {
            $hostIds = $record['program_ids'] ?? [];
            $repoIds = $repo[$id]['program_ids'] ?? [];
            if (!is_array($hostIds) || !is_array($repoIds)) {
                throw new RuntimeException("Invalid destination program_ids");
            }
            // Keep live ordering and add Git-only links without reactivating other fields.
            $combined['program_ids'] = array_values(array_unique(array_merge($hostIds, $repoIds)));
        }
        $merged[$id] = $combined;
    }
    return $merged;
}

try {
    $repoRoot = realpath($argv[1]);
    $hostedDir = realpath($argv[2]);
    if (!$repoRoot || !$hostedDir || !is_dir($repoRoot . '/data')) {
        throw new RuntimeException('Missing repository or hosted catalog snapshot');
    }
    $schema = ['all_programs.php' => 'all_programs',
               'programs.php' => 'programs', 'destinations.php' => 'destinations'];
    $parsed = [];
    foreach ($schema as $name => $variable) {
        $repoFile = $repoRoot . '/data/' . $name;
        $hostFile = $hostedDir . '/' . $name;
        if (!is_file($hostFile)) throw new RuntimeException("Required hosted file missing: $name");
        $git = read_static_array($repoFile, $variable);
        $host = read_static_array($hostFile, $variable);
        if (!$git || !$host) throw new RuntimeException("Empty catalog: $name");
        $parsed[$variable] = merge_catalog($git, $host, $variable);
        echo "Merged data/$name: " . count($host) . " hosted records, "
            . count($git) . " Git records\n";
    }

    // These three images are the only destination fields deliberately set by this PR.
    foreach (['italy' => '/images/italy-destination-upscaled.webp',
              'uk' => '/images/uk-destination-upscaled.webp',
              'france' => '/images/france-destination-upscaled.webp'] as $slug => $banner) {
        if (!isset($parsed['destinations'][$slug])) {
            throw new RuntimeException("Expected destination missing: $slug");
        }
        $parsed['destinations'][$slug]['banner'] = $banner;
    }

    // Stage validated results only after all mandatory inputs have been checked.
    foreach ($schema as $name => $variable) {
        $repoFile = $repoRoot . '/data/' . $name;
        if (read_static_array($repoFile, $variable) !== $parsed[$variable]) {
            save_static_array($repoFile, $variable, $parsed[$variable]);
            echo "Updated data/$name\n";
        }
    }

    // Optional public content settings: preserve Git-only keys, hosted values win.
    foreach (['site_settings.php' => 'site_settings',
              'camp_memories.php' => 'camp_memories'] as $name => $variable) {
        $hostFile = $hostedDir . '/' . $name;
        if (!is_file($hostFile)) continue;
        $repoFile = $repoRoot . '/data/' . $name;
        $git = read_static_array($repoFile, $variable);
        $host = read_static_array($hostFile, $variable);
        $merged = array_replace_recursive($git, $host);
        if ($name === 'camp_memories.php') {
            // The hosting photo collection is authoritative; avoid indexed-array
            // replacement that mixes captions with images from different records.
            if (isset($host['items'])) $merged['items'] = $host['items'];
        }
        if ($git !== $merged) {
            save_static_array($repoFile, $variable, $merged);
            echo "Updated data/$name from hosting\n";
        }
    }
    $hostFaq = $hostedDir . '/faq.json';
    if (is_file($hostFaq)) {
        $repoFaq = $repoRoot . '/data/faq.json';
        $git = json_decode((string)file_get_contents($repoFaq), true, 512, JSON_THROW_ON_ERROR);
        $host = json_decode((string)file_get_contents($hostFaq), true, 512, JSON_THROW_ON_ERROR);
        if (!is_array($git) || !is_array($host) || !array_is_list($host)) {
            throw new RuntimeException('Invalid hosted FAQ JSON');
        }
        $merged = $host;
        $seen = [];
        foreach ($host as $faq) if (is_array($faq)) $seen[(string)($faq['question'] ?? '')] = true;
        foreach ($git as $faq) {
            if (is_array($faq) && !isset($seen[(string)($faq['question'] ?? '')])) {
                $merged[] = $faq;
            }
        }
        if ($merged !== $git) {
            file_put_contents($repoFaq, json_encode($merged, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES |
                JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR) . "\n");
            echo "Updated data/faq.json from hosting\n";
        }
    }
    echo "Hosted public data merged successfully; no runtime files were changed.\n";
} catch (Throwable $error) {
    fwrite(STDERR, "Development catalog merge failed: " . $error->getMessage() . "\n");
    exit(1);
}
