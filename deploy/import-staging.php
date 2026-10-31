<?php
/** CLI-only, explicit one-time import. No cron, FTP or automatic deployment. */
if(PHP_SAPI!=='cli'){http_response_code(403);exit('CLI only');}
require_once __DIR__.'/../app/catalog.php';
if(!gc_external() || gc_env('GOCAMP_ENV')!=='staging')throw new RuntimeException('Imports are staging-only');
if(($argv[1]??'')!=='--confirm-staging')throw new RuntimeException('Provide --confirm-staging');
$root=dirname(__DIR__);
$paths=['programs'=>['programs.php','programs'], 'all_programs'=>['all_programs.php','all_programs'],
    'destinations'=>['destinations.php','destinations'], 'site_settings'=>['site_settings.php','site_settings'],
    'camp_memories'=>['camp_memories.php','camp_memories']];
foreach($paths as $kind=>[$filename,$variable]){
    $path=$root.'/data/legacy/'.$filename;
    if(!is_file($path))throw new RuntimeException('Missing source: '.$path);
    $load=static function($path,$variable){require $path;return $$variable??[];};
    $values=$load($path,$variable);
    if(!is_array($values))throw new RuntimeException('Invalid source catalog: '.$kind);
    // Explicit overwrite guard. Re-running an import on an edited database is unsafe.
    if(gc_revision($kind)!==0)throw new RuntimeException('Refusing to overwrite imported/edited catalog: '.$kind);
    $db=gc_db();$db->beginTransaction();
    try {gc_apply_catalog($db,$kind,$values);gc_exec($db,'INSERT INTO catalog_revisions(catalog,revision) VALUES (?,1)',[$kind]);$db->commit();}
    catch(Throwable $e){$db->rollBack();throw $e;}
    echo $kind.' imported ('.count($values).")\n";
}
$faqs=json_decode(file_get_contents($root.'/data/faq.json'),true,512,JSON_THROW_ON_ERROR);
if(gc_revision('faq')===0){$db=gc_db();$db->beginTransaction();try{gc_apply_catalog($db,'faq',$faqs);gc_exec($db,"INSERT INTO catalog_revisions(catalog,revision) VALUES ('faq',1)");$db->commit();}catch(Throwable $e){$db->rollBack();throw $e;}}
echo 'Staging import complete; no production changes made.' . PHP_EOL;
