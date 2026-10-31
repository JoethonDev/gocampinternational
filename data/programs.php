<?php
/** Legacy PHP adapter. External PostgreSQL catalog is enabled only by environment. */
require __DIR__ . '/legacy/programs.php';
require_once __DIR__ . '/../app/catalog.php';
if (gc_external()) $programs = gc_catalog('programs');
return $programs;
