<?php
declare(strict_types=1);
require __DIR__ . '/../data/all_programs.php';

function assert_soccer(bool $ok, string $reason): void {
    if (!$ok) throw new RuntimeException($reason);
}
$root = sys_get_temp_dir() . '/gocamp-soccer-' . bin2hex(random_bytes(6));
mkdir($root); mkdir("$root/live"); mkdir("$root/staged");
try {
    $id = 'uk-soccer-club-experience';
    $all_programs[$id]['image'] = '/images/soccer_1.webp';
    $all_programs[$id]['gallery'] = ['/images/soccer_2.webp', '/images/admin-photo.webp'];
    $all_programs[$id]['description'] = 'Admin-authored description';
    $all_programs['italy-football-ac-milan']['description'] = 'Unrelated admin edit';
    $liveFile = "$root/live/all_programs.php";
    $store = static function (array $records) use ($liveFile): void {
        file_put_contents($liveFile, "<?php\n" . '$all_programs = ' .
            var_export($records, true) . ";\n");
    };
    $read = static function(string $file): array {
        return (static function(string $p): array {
            include $p; return $all_programs;
        })($file);
    };
    $run = static function() use ($root): array {
        $proc = proc_open([
            'php', __DIR__ . '/../deploy/migrations/apply-soccer-images.php',
            dirname(__DIR__), "$root/live", "$root/staged"
        ], [1 => ['pipe','w'], 2 => ['pipe','w']], $pipes);
        assert_soccer(is_resource($proc), 'Cannot launch image migration');
        $stdout = stream_get_contents($pipes[1]);
        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[1]); fclose($pipes[2]);
        assert_soccer(proc_close($proc) === 0, 'Image migration failed: ' . $stderr);
        return json_decode($stdout, true, 512, JSON_THROW_ON_ERROR);
    };
    $store($all_programs);
    $first = $run();
    assert_soccer($first['changed'] === ['all_programs.php'], 'Only program catalog should change');
    $merged = $read("$root/staged/all_programs.php");
    $source = $read(__DIR__ . '/../data/all_programs.php');
    assert_soccer($merged[$id]['image'] === '/images/uk-soccer-arsenal-day-hero.webp',
        'Fourth photo not set as cover');
    foreach ($source[$id]['gallery'] as $photo) {
        assert_soccer(in_array($photo, $merged[$id]['gallery'], true), "Source gallery photo missing: $photo");
    }
    assert_soccer(in_array('/images/admin-photo.webp', $merged[$id]['gallery'], true),
        'Prior admin-added Soccer image was lost');
    assert_soccer($merged[$id]['description'] === 'Admin-authored description',
        'Admin Soccer description lost');
    assert_soccer($merged['italy-football-ac-milan']['description'] === 'Unrelated admin edit',
        'Another programme changed');
    $store($merged);
    unlink("$root/staged/all_programs.php");
    assert_soccer($run()['changed'] === [], 'Second migration unexpectedly modifies data');
    echo "Soccer imagery live-content migration preserves admin data and is idempotent\n";
} finally {
    foreach (glob("$root/live/*") as $f) unlink($f);
    foreach (glob("$root/staged/*") as $f) unlink($f);
    rmdir("$root/live"); rmdir("$root/staged"); rmdir($root);
}
