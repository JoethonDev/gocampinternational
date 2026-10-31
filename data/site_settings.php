<?php
/** Legacy PHP adapter. External PostgreSQL catalog is enabled only by environment. */
require __DIR__ . '/legacy/site_settings.php';
require_once __DIR__ . '/../app/catalog.php';
if (gc_external()) $site_settings = gc_catalog('site_settings');
return $site_settings;
