<?php
/** Legacy PHP adapter. External PostgreSQL catalog is enabled only by environment. */
require __DIR__ . '/legacy/destinations.php';
require_once __DIR__ . '/../app/catalog.php';
if (gc_external()) $destinations = gc_catalog('destinations');
return $destinations;
