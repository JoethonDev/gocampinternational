<?php
/** Legacy PHP adapter. External PostgreSQL catalog is enabled only by environment. */
require __DIR__ . '/legacy/camp_memories.php';
require_once __DIR__ . '/../app/catalog.php';
if (gc_external()) $camp_memories = gc_catalog('camp_memories');
return $camp_memories;
