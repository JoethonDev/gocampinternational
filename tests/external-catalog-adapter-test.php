<?php
/** Offline safety regression: checks opt-in mode and preservation of legacy catalog. */
require_once __DIR__.'/../app/catalog.php';
require_once __DIR__.'/../includes/camp-memories.php';
if (gc_external()) throw new RuntimeException('Run this offline test without GOCAMP_DATA_SOURCE=postgres');
foreach (['all_programs'=>63,'destinations'=>9,'programs'=>8] as $name=>$count) {
    $variable=$name;
    $value=(static function($name,$variable){require __DIR__.'/../data/'.$name.'.php';return $$variable??null;})($name,$variable);
    if (!is_array($value) || count($value)<$count) throw new RuntimeException("Legacy $name count changed");
}
$memories=gocamp_load_memories();
if (count($memories['items'])!==28)throw new RuntimeException('ZIP memories not preserved');
if (gocamp_memory_url('example.webp')!=='/images/example.webp')throw new RuntimeException('Legacy image URL regression');
if (gocamp_memory_url('/media.php?key=images%2Ffoo')!=='/media.php?key=images%2Ffoo')
    throw new RuntimeException('Private media gateway URL regression');
if (!str_contains(file_get_contents(__DIR__.'/../database/001_catalog.sql'),'CREATE TABLE IF NOT EXISTS media_assets'))
    throw new RuntimeException('Missing media SQL table');
echo "Offline Aiven/Tigris adapter regression passed\n";
