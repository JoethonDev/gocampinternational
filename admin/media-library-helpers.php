<?php
/**
 * Shared media-library operations for the admin dashboard and media selector.
 * No data file is executed or re-serialized during an image rename.
 */

function gocamp_media_folders(string $root): array {
    return ['images' => $root . '/images', 'uploads' => $root . '/uploads'];
}

function gocamp_media_is_image(string $name): bool {
    return in_array(strtolower(pathinfo($name, PATHINFO_EXTENSION)), ['jpg', 'jpeg', 'png', 'gif', 'webp'], true);
}

function gocamp_media_list(string $root): array {
    if (function_exists('gc_external') && gc_external()) return gc_media_files();
    $files = [];
    foreach (gocamp_media_folders($root) as $directory => $folder) {
        if (!is_dir($folder)) {
            continue;
        }
        foreach (new DirectoryIterator($folder) as $entry) {
            if ($entry->isDot() || !$entry->isFile() || $entry->isLink() || !gocamp_media_is_image($entry->getFilename())) {
                continue;
            }
            $name = $entry->getFilename();
            $files[] = [
                'name' => $name,
                'path' => '/' . $directory . '/' . $name,
                'url' => '/' . $directory . '/' . rawurlencode($name),
                'folder' => $directory,
                'size' => $entry->getSize(),
                'modified' => $entry->getMTime(),
            ];
        }
    }
    usort($files, static fn(array $a, array $b): int => strnatcasecmp($a['path'], $b['path']));
    return $files;
}

/** Match the exact path, not an image name prefix such as photo.webp.backup. */
function gocamp_media_reference_count(string $content, string $publicPath): int {
    $pattern = '~' . preg_quote($publicPath, '~') . '(?![a-zA-Z0-9_.-])~';
    return preg_match_all($pattern, $content) ?: 0;
}

function gocamp_media_reference_replace(string $content, string $from, string $to): string {
    $pattern = '~' . preg_quote($from, '~') . '(?![a-zA-Z0-9_.-])~';
    return preg_replace_callback($pattern, static fn(): string => $to, $content) ?? $content;
}

/** Enumerate only site-owned data files; never follow a symlink outside data/. */
function gocamp_media_data_files(string $root): array {
    $folder = $root . '/data';
    if (!is_dir($folder)) {
        throw new RuntimeException('The data directory is missing.');
    }
    $result = [];
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($folder, FilesystemIterator::SKIP_DOTS)
    );
    foreach ($iterator as $item) {
        if ($item->isLink() || !$item->isFile()) {
            continue;
        }
        $extension = strtolower(pathinfo($item->getFilename(), PATHINFO_EXTENSION));
        if (in_array($extension, ['php', 'json'], true)) {
            $result[] = $item->getPathname();
        }
    }
    sort($result);
    return $result;
}

/** Inventory usage across every editable PHP/JSON data file. */
function gocamp_media_data_usage(string $root, string $publicPath): array {
    if (function_exists('gc_external') && gc_external()) return ['external-database' => gc_media_reference_count_db($publicPath)];
    $usage = [];
    foreach (gocamp_media_data_files($root) as $path) {
        $content = @file_get_contents($path);
        if ($content === false) {
            throw new RuntimeException('Unable to read all data files.');
        }
        $count = gocamp_media_reference_count($content, $publicPath);
        if ($count > 0) {
            $usage[substr($path, strlen($root) + 1)] = $count;
        }
    }
    return $usage;
}

/**
 * Static references outside data/ cannot be changed safely as part of an
 * admin content edit. Refuse to rename these application assets instead.
 */
function gocamp_media_code_usage(string $root, string $publicPath): array {
    $paths = glob($root . '/*.php') ?: [];
    foreach (['sections', 'includes', 'css', 'js', 'admin'] as $dir) {
        $folder = $root . '/' . $dir;
        if (!is_dir($folder)) {
            continue;
        }
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($folder, FilesystemIterator::SKIP_DOTS)
        );
        foreach ($iterator as $item) {
            if (!$item->isFile() || $item->isLink()) {
                continue;
            }
            if (in_array(strtolower(pathinfo($item->getFilename(), PATHINFO_EXTENSION)), ['php', 'css', 'js'], true)) {
                $paths[] = $item->getPathname();
            }
        }
    }
    $found = [];
    foreach ($paths as $path) {
        $source = @file_get_contents($path);
        if ($source === false) {
            throw new RuntimeException('Unable to inspect site templates.');
        }
        if (gocamp_media_reference_count($source, $publicPath) > 0) {
            $found[] = substr($path, strlen($root) + 1);
        }
    }
    return $found;
}

/**
 * Filesystem rename plus coordinated data-file replacement.
 * Stages original backups and new versions in the same directory before the
 * image is moved; rolls back data and the image if any write fails.
 */
function gocamp_media_rename(string $root, string $publicPath, string $newBase): array {
    if (function_exists('gc_external') && gc_external()) return gc_media_label_rename($publicPath,$newBase);
    if (!preg_match('~^/(images|uploads)/([^/\\\\\x00]+)$~D', $publicPath, $parts)
        || !gocamp_media_is_image($parts[2])) {
        return ['success' => false, 'message' => 'Invalid image path.'];
    }
    if (!preg_match('/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/D', $newBase)) {
        return ['success' => false, 'message' => 'Use 1–100 letters, numbers, hyphens or underscores, starting with a letter or number.'];
    }

    $folders = gocamp_media_folders($root);
    $folder = $folders[$parts[1]];
    $oldName = $parts[2];
    $ext = pathinfo($oldName, PATHINFO_EXTENSION);
    $newName = $newBase . '.' . $ext;
    $from = $folder . '/' . $oldName;
    $to = $folder . '/' . $newName;
    $newPublic = '/' . $parts[1] . '/' . $newName;

    $lockPath = sys_get_temp_dir() . '/gocamp-image-rename-' . hash('sha256', realpath($root) ?: $root) . '.lock';
    $lock = @fopen($lockPath, 'c');
    if (!$lock || !flock($lock, LOCK_EX)) {
        if ($lock) fclose($lock);
        return ['success' => false, 'message' => 'Could not acquire media rename lock.'];
    }

    $staged = [];
    $completed = [];
    $moved = false;
    $rollbackFailed = false;
    try {
        if (!is_file($from) || is_link($from) || !is_writable($folder)) {
            throw new RuntimeException('The selected image is missing or cannot be renamed.');
        }
        // Collision detection also covers case-insensitive filesystems.
        foreach (new DirectoryIterator($folder) as $entry) {
            if (!$entry->isDot() && strcasecmp($entry->getFilename(), $newName) === 0) {
                throw new RuntimeException('An image with that filename already exists.');
            }
        }
        $codeReferences = gocamp_media_code_usage($root, $publicPath);
        if ($codeReferences !== []) {
            throw new RuntimeException('This image is used directly by site code (' . implode(', ', array_slice($codeReferences, 0, 3)) . '). Change its code references before renaming.');
        }

        $updates = [];
        $referenceCount = 0;
        foreach (gocamp_media_data_files($root) as $path) {
            $original = @file_get_contents($path);
            if ($original === false) {
                throw new RuntimeException('Cannot read ' . basename($path) . '.');
            }
            $count = gocamp_media_reference_count($original, $publicPath);
            if (!$count) {
                continue;
            }
            if (!is_writable($path) || !is_writable(dirname($path))) {
                throw new RuntimeException('Cannot update ' . basename($path) . ': check file permissions.');
            }
            $updated = gocamp_media_reference_replace($original, $publicPath, $newPublic);
            if (strtolower(pathinfo($path, PATHINFO_EXTENSION)) === 'json') {
                json_decode($updated);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    throw new RuntimeException('Refusing to rewrite invalid JSON in ' . basename($path) . '.');
                }
            }
            $updates[$path] = ['original' => $original, 'updated' => $updated];
            $referenceCount += $count;
        }

        // Stage all new data and backups before touching the image or live data.
        foreach ($updates as $path => $contents) {
            $backup = @tempnam(dirname($path), '.media-backup-');
            $next = @tempnam(dirname($path), '.media-stage-');
            if ($backup === false || $next === false) {
                if ($backup !== false) @unlink($backup);
                if ($next !== false) @unlink($next);
                throw new RuntimeException('Unable to stage data file changes.');
            }
            $staged[$path] = ['backup' => $backup, 'next' => $next, 'hash' => hash('sha256', $contents['original'])];
            if (file_put_contents($backup, $contents['original']) !== strlen($contents['original'])
                || file_put_contents($next, $contents['updated']) !== strlen($contents['updated'])) {
                throw new RuntimeException('Unable to stage data file changes.');
            }
            $permissions = fileperms($path);
            if ($permissions !== false) {
                @chmod($backup, $permissions & 0777);
                @chmod($next, $permissions & 0777);
            }
        }

        if (!@rename($from, $to)) {
            throw new RuntimeException('Unable to rename the image file.');
        }
        $moved = true;
        foreach ($staged as $path => $files) {
            // Avoid silently discarding data edited while the operation staged.
            if (@hash_file('sha256', $path) !== $files['hash']) {
                throw new RuntimeException('A data file changed during the rename. Please retry.');
            }
            if (!@rename($files['next'], $path)) {
                throw new RuntimeException('Unable to update ' . basename($path) . '.');
            }
            $completed[] = $path;
        }
        return [
            'success' => true,
            'message' => 'Image renamed. Updated ' . $referenceCount . ' reference(s) in ' . count($updates) . ' data file(s).',
            'path' => $newPublic,
            'references' => $referenceCount,
            'files' => array_map(static fn(string $p): string => substr($p, strlen($root) + 1), array_keys($updates)),
        ];
    } catch (Throwable $error) {
        foreach (array_reverse($completed) as $path) {
            if (!@rename($staged[$path]['backup'], $path)) {
                $rollbackFailed = true;
            }
        }
        if ($moved && !@rename($to, $from)) {
            $rollbackFailed = true;
        }
        error_log('GoCamp media rename: ' . $error->getMessage() . ($rollbackFailed ? ' (ROLLBACK FAILED)' : ''));
        return ['success' => false, 'message' => $rollbackFailed
            ? 'Rename failed and automatic recovery was incomplete. Contact the administrator; staged backups were retained.'
            : $error->getMessage()];
    } finally {
        foreach ($staged as $path => $files) {
            if (!$rollbackFailed) {
                @unlink($files['backup']);
                @unlink($files['next']);
            }
        }
        flock($lock, LOCK_UN);
        fclose($lock);
    }
}
