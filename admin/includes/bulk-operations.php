<?php
declare(strict_types=1);
/** Pure validation and non-destructive status updates for admin bulk operations. */
function gocamp_bulk_status(array $records, string $type, string $status, array $ids): array {
    $allowed = [
        'destination' => ['active', 'coming-soon', 'trash'],
        'category' => ['active', 'inactive', 'trash'],
        'program' => ['active', 'inactive', 'trash'],
    ];
    if (!isset($allowed[$type]) || !in_array($status, $allowed[$type], true)) {
        throw new InvalidArgumentException('Invalid bulk action.');
    }
    if (!$ids || count($ids) > 500) {
        throw new InvalidArgumentException('Select between 1 and 500 items.');
    }
    $unique = [];
    foreach ($ids as $id) {
        if (!is_string($id) || !preg_match('/^[a-zA-Z0-9_-]{1,120}$/', $id)
            || !isset($records[$id]) || !is_array($records[$id])
            || ($records[$id]['status'] ?? '') === 'trash') {
            throw new InvalidArgumentException('Selection contains an invalid, missing or trashed item.');
        }
        $unique[$id] = true;
    }
    $changed = 0;
    foreach (array_keys($unique) as $id) {
        if (($records[$id]['status'] ?? null) !== $status) {
            $records[$id]['status'] = $status;
            $changed++;
        }
    }
    return [$records, $changed];
}
