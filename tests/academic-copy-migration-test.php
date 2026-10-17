<?php
declare(strict_types=1);
require __DIR__ . '/../data/all_programs.php';
require __DIR__ . '/../data/programs.php';
require __DIR__ . '/../data/destinations.php';
function check_copy_migration(bool $condition, string $message): void {
    if (!$condition) throw new RuntimeException($message);
}
function catalog_filename(string $variable): string {
    return match ($variable) {
        'all_programs' => 'all_programs.php',
        'programs' => 'programs.php',
        'destinations' => 'destinations.php',
        default => throw new RuntimeException('Invalid variable'),
    };
}
function write_copy_catalog(string $directory, string $variable, array $records): void {
    file_put_contents($directory . '/' . catalog_filename($variable),
        "<?php\n" . '$' . $variable . ' = ' . var_export($records, true) . ";\n");
}
function read_copy_catalog(string $directory, string $variable): array {
    return (static function(string $file, string $variable): array {
        include $file;
        return $$variable;
    })($directory . '/' . catalog_filename($variable), $variable);
}
$root = sys_get_temp_dir() . '/gocamp-copy-' . bin2hex(random_bytes(6));
mkdir($root);
mkdir("$root/live");
mkdir("$root/staged");
try {
    $selected = array_values(array_filter($destinations['uk']['program_ids'],
        static fn(string $id): bool => ($all_programs[$id]['category_slug'] ?? '') === 'adult-academic'
            && ($all_programs[$id]['status'] ?? '') === 'active'));
    check_copy_migration(count($selected) === 7, 'Invalid test fixture: expected seven academics');
    foreach ($selected as $id) {
        $all_programs[$id]['description'] = '<p>Old website copy</p>';
        $all_programs[$id]['highlights'] = [];
    }
    $all_programs[$selected[0]]['tagline'] = 'Custom live admin tagline';
    $all_programs['italy-football-ac-milan']['description'] = 'Independent Italian admin edit';
    $all_programs['tennis-academy']['description'] = '<p>UK Exsportise course text</p>';
    $all_programs['tennis-academy']['highlights'] = ['UK-only reference'];
    $all_programs['tennis-academy']['includes'] = ['UK-only residential details'];
    $programs['tennis']['intro'] = '<p>UK-exclusive tennis</p>';
    $programs['tennis']['sections'] = [];
    $programs['adult-academic']['intro'] = '<p>Custom academic category text</p>';
    $destinations['switzerland']['intro_text'] = '<p>Custom Swiss destination text</p>';
    foreach (['all_programs', 'programs', 'destinations'] as $variable) {
        write_copy_catalog("$root/live", $variable, $$variable);
    }
    $run = static function() use ($root): array {
        $process = proc_open([
            'php', __DIR__ . '/../deploy/migrations/apply-academic-copy.php',
            dirname(__DIR__), "$root/live", "$root/staged"
        ], [1 => ['pipe', 'w'], 2 => ['pipe', 'w']], $pipes);
        check_copy_migration(is_resource($process), 'Cannot start academic content migration');
        $stdout = stream_get_contents($pipes[1]);
        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[1]); fclose($pipes[2]);
        check_copy_migration(proc_close($process) === 0, 'Academic migration failed: ' . $stderr);
        return json_decode($stdout, true, 512, JSON_THROW_ON_ERROR);
    };
    $first = $run();
    check_copy_migration($first['changed'] === ['all_programs.php', 'programs.php'], 'Unexpected catalogs modified');
    $merged = read_copy_catalog("$root/staged", 'all_programs');
    $source = read_copy_catalog(dirname(__DIR__) . '/data', 'all_programs');
    foreach ($selected as $id) {
        check_copy_migration($merged[$id]['description'] === $source[$id]['description'],
            "Academic description not updated: $id");
        check_copy_migration($merged[$id]['highlights'] === $source[$id]['highlights'],
            "Academic highlights not updated: $id");
    }
    check_copy_migration($merged[$selected[0]]['tagline'] === 'Custom live admin tagline',
        'Other academic fields were overwritten');
    check_copy_migration($merged['italy-football-ac-milan']['description'] === 'Independent Italian admin edit',
        'Unrelated live program was overwritten');
    check_copy_migration($merged['tennis-academy']['description'] === $source['tennis-academy']['description'],
        'Shared Tennis text not refreshed');
    check_copy_migration($merged['tennis-academy']['includes'] === $source['tennis-academy']['includes'],
        'Shared Tennis inclusions not refreshed');
    $categories = read_copy_catalog("$root/staged", 'programs');
    check_copy_migration($categories['adult-academic']['intro'] === '<p>Custom academic category text</p>',
        'Unrelated live category edited');
    check_copy_migration($categories['tennis']['intro'] !== '<p>UK-exclusive tennis</p>',
        'Tennis intro not updated');
    check_copy_migration(!is_file("$root/staged/destinations.php"), 'Live destination catalog was rewritten');

    // Reapply staged output as live input: reviewed migration must be idempotent.
    foreach (['all_programs','programs'] as $variable) {
        write_copy_catalog("$root/live", $variable, read_copy_catalog("$root/staged", $variable));
        unlink("$root/staged/" . catalog_filename($variable));
    }
    check_copy_migration($run()['changed'] === [], 'Repeating editorial migration changed content');
    echo "Academic editorial content migration safety and idempotence tests passed\n";
} finally {
    foreach (glob("$root/live/*") as $file) unlink($file);
    foreach (glob("$root/staged/*") as $file) unlink($file);
    rmdir("$root/live"); rmdir("$root/staged"); rmdir($root);
}
