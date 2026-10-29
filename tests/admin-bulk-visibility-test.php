<?php
declare(strict_types=1);
require __DIR__ . '/../admin/includes/bulk-operations.php';
require __DIR__ . '/../includes/section-visibility.php';

function bulk_check(bool $cond, string $message): void {
    if (!$cond) throw new RuntimeException($message);
}
$original = [
  'one' => ['name' => 'One', 'status' => 'active', 'other' => 'preserved'],
  'two' => ['name' => 'Two', 'status' => 'inactive', 'other' => 'preserved'],
  'three' => ['name' => 'Three', 'status' => 'trash'],
];
[$updated, $count] = gocamp_bulk_status($original, 'program', 'inactive', ['one', 'two', 'one']);
bulk_check($count === 1, 'Only genuinely changed statuses count');
bulk_check($updated['one']['status'] === 'inactive' && $updated['one']['other'] === 'preserved', 'Other attributes preserved');
bulk_check($updated['two']['status'] === 'inactive' && $updated['three']['status'] === 'trash', 'Unselected records unchanged');
bulk_check($original['one']['status'] === 'active', 'Original source array remains unchanged');
foreach ([['destination', 'inactive', ['one']], ['program','invalid',['one']],
          ['program','active',['missing']], ['program','trash',['three']],
          ['program','active',[]]] as [$type, $action, $ids]) {
    $rejected = false;
    try { gocamp_bulk_status($original, $type, $action, $ids); }
    catch (InvalidArgumentException $e) { $rejected = true; }
    bulk_check($rejected, "Unsafe operation must fail: $type / $action");
}
[$destination, $n] = gocamp_bulk_status($original, 'destination', 'coming-soon', ['one']);
bulk_check($destination['one']['status'] === 'coming-soon' && $n === 1, 'Destination coming-soon works');

$inherit = gocamp_read_visibility_overrides(['hero' => 'inherit', 'intro' => '1', 'programs' => '0'],
    'destination', ['hero' => false, 'faq' => true]);
bulk_check(!array_key_exists('hero', $inherit), 'Inherit clears record override');
bulk_check($inherit['intro'] === true && $inherit['programs'] === false, 'Explicit overrides persist');
bulk_check($inherit['faq'] === true, 'Unsubmitted controls remain unchanged');
bulk_check(gocamp_visibility_override($inherit ? ['section_visibility' => $inherit] : [], 'hero') === null,
    'Cleared override is absent');
bulk_check(gocamp_visibility_override(['section_visibility' => $inherit], 'programs') === false,
    'Explicit hide overrides global');
bulk_check(gocamp_effective_visibility(['section_visibility' => ['intro' => false]], 'destination', 'intro', true) === false,
    'Explicit hide wins over global default');
bulk_check(gocamp_effective_visibility(['visibility_overrides' => ['hero' => true]], 'destination', 'hero', false) === true,
    'Explicit show wins over global default');
bulk_check(gocamp_visibility_override(['section_visibility' => ['hero' => true]], 'hero', 'destination') === null,
    'Legacy default values do not block global settings');
bulk_check(gocamp_visibility_override(['section_visibility' => ['intro' => false]], 'intro', 'destination') === false,
    'Legacy custom values remain explicitly hidden');
bulk_check(gocamp_visibility_override(['visibility_overrides' => [] ,
    'section_visibility' => ['intro' => false]], 'intro', 'destination') === null,
    'New empty overrides allow clearing old flags');
echo "Admin bulk and visibility inheritance tests passed\n";
