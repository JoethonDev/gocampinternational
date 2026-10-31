<?php
/** Legacy PHP adapter. External PostgreSQL catalog is enabled only by environment. */
require __DIR__ . '/legacy/all_programs.php';
require_once __DIR__ . '/../app/catalog.php';
if (gc_external()) $all_programs = gc_catalog('all_programs');
return $all_programs;
