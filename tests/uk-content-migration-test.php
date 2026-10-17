<?php
declare(strict_types=1);
require __DIR__ . '/../data/all_programs.php';
require __DIR__ . '/../data/programs.php';
require __DIR__ . '/../data/destinations.php';

function tested(bool $condition, string $reason): void {
    if (!$condition) throw new RuntimeException($reason);
}
function write_catalog(string $dir, string $var, array $value): void {
    $file = $var === 'all_programs' ? 'all_programs.php' :
        ($var === 'programs' ? 'programs.php' : 'destinations.php');
    file_put_contents("$dir/$file", "<?php\n" . '$' . $var . ' = ' .
        var_export($value, true) . ";\n");
}
function read_catalog(string $dir, string $var): array {
    $file = $var === 'all_programs' ? 'all_programs.php' :
        ($var === 'programs' ? 'programs.php' : 'destinations.php');
    return (static function($file, $var) {
        include $file;
        return $$var;
    })("$dir/$file", $var);
}
$root = sys_get_temp_dir() . '/gocamp-migrate-' . bin2hex(random_bytes(6));
mkdir($root);
mkdir("$root/live");
mkdir("$root/staged");
try {
    // Simulate a site seeded before PR #18, including independent admin edits.
    $all_programs['uk-young-professional']['status'] = 'active';
    $all_programs['uk-pre-university']['status'] = 'active';
    $all_programs['uk-english-foundation']['status'] = 'active';
    unset($all_programs['tennis-academy'], $all_programs['uk-soccer-club-experience']);
    $all_programs['italy-football-ac-milan']['description'] = 'Custom live admin soccer description';
    $all_programs['uk-academic-engineering']['description'] = 'Edited live academic description';
    $all_programs['uk-academic-engineering']['status'] = 'inactive';
    $destinations['uk']['program_ids'] = ['uk-young-professional', 'uk-pre-university', 'uk-english-foundation'];
    $destinations['uk']['tagline'] = 'Custom live UK tagline';
    $destinations['switzerland']['program_ids'] = ['switzerland-ski-camp'];
    $destinations['switzerland']['intro_text'] = 'Custom live Swiss content';
    $programs['adult-academic']['intro'] = 'Custom live category intro';
    unset($programs['tennis']);
    foreach (['all_programs', 'programs', 'destinations'] as $var) {
        write_catalog("$root/live", $var, $$var);
    }

    $run = static function() use ($root): array {
        $proc = proc_open(
            ['php', __DIR__ . '/../deploy/migrations/apply-uk-catalog.php',
                dirname(__DIR__), "$root/live", "$root/staged"],
            [1 => ['pipe','w'], 2 => ['pipe','w']], $pipes
        );
        tested(is_resource($proc), 'Could not launch PHP catalog merge');
        $out = stream_get_contents($pipes[1]);
        $err = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);
        tested(proc_close($proc) === 0, 'Migration process failed: ' . $err);
        return json_decode($out, true, 512, JSON_THROW_ON_ERROR);
    };
    $plan = $run();
    tested(count($plan['changed']) === 3, 'Expected three changed catalogs');

    $mergedPrograms = read_catalog("$root/staged", 'all_programs');
    tested($mergedPrograms['uk-young-professional']['status'] === 'inactive', 'Legacy UK program remained active');
    tested($mergedPrograms['uk-pre-university']['status'] === 'inactive', 'Pre-university program remained active');
    tested($mergedPrograms['uk-english-foundation']['status'] === 'inactive', 'English foundation remained active');
    tested($mergedPrograms['uk-academic-engineering']['status'] === 'active', 'Academic program not activated');
    tested($mergedPrograms['uk-academic-engineering']['description'] === 'Edited live academic description', 'Admin academic description overwritten');
    tested($mergedPrograms['italy-football-ac-milan']['description'] === 'Custom live admin soccer description', 'Unrelated program overwritten');
    tested(isset($mergedPrograms['tennis-academy'], $mergedPrograms['uk-soccer-club-experience']), 'New programs not seeded');

    $mergedCategories = read_catalog("$root/staged", 'programs');
    tested(isset($mergedCategories['tennis']), 'New category missing');
    tested($mergedCategories['adult-academic']['intro'] === 'Custom live category intro', 'Admin category intro overwritten');

    $mergedDestinations = read_catalog("$root/staged", 'destinations');
    tested($mergedDestinations['uk']['tagline'] === 'Custom live UK tagline', 'Admin UK tagline overwritten');
    tested($mergedDestinations['switzerland']['intro_text'] === 'Custom live Swiss content', 'Admin Swiss intro overwritten');
    tested(in_array('tennis-academy', $mergedDestinations['switzerland']['program_ids'], true), 'Swiss tennis not linked');
    tested(count($mergedDestinations['uk']['program_ids']) === 9, 'UK should have nine reviewed programs');

    // Replaying the exact patch must be a semantic no-op.
    foreach (['all_programs','programs','destinations'] as $var) {
        write_catalog("$root/live", $var, read_catalog("$root/staged", $var));
        unlink("$root/staged/" . ($var === 'all_programs' ? 'all_programs.php' :
            ($var === 'programs' ? 'programs.php' : 'destinations.php')));
    }
    $again = $run();
    tested($again['changed'] === [], 'Migration not idempotent');
    echo "Reviewed catalog migration preservation and idempotence tests passed\n";

    // A dynamic PHP execution attempt from FTP must be rejected.
    file_put_contents("$root/live/programs.php", "<?php\n" . '$programs' . " = system('id');\n");
    $proc = proc_open(
        ['php', __DIR__ . '/../deploy/migrations/apply-uk-catalog.php',
            dirname(__DIR__), "$root/live", "$root/staged"],
        [1 => ['pipe','w'], 2 => ['pipe','w']], $pipes);
    $out = stream_get_contents($pipes[1]);
    $err = stream_get_contents($pipes[2]);
    fclose($pipes[1]); fclose($pipes[2]);
    tested(proc_close($proc) !== 0 && str_contains($err, 'blocked'), 'Executable PHP content should be rejected');
    echo "Runtime PHP code execution guard test passed\n";
} finally {
    foreach (glob("$root/live/*") as $file) unlink($file);
    foreach (glob("$root/staged/*") as $file) unlink($file);
    rmdir("$root/live");
    rmdir("$root/staged");
    rmdir($root);
}
