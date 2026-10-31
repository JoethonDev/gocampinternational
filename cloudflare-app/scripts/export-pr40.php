<?php
/** Local/CI source preservation audit; does not connect to databases. */
if (PHP_SAPI !== 'cli') { http_response_code(404); exit; }
$root = dirname(__DIR__, 2);
$catalogs = [
 'all_programs' => ['path' => 'data/legacy/all_programs.php', 'var' => 'all_programs'],
 'destinations' => ['path' => 'data/legacy/destinations.php', 'var' => 'destinations'],
 'programs' => ['path' => 'data/legacy/programs.php', 'var' => 'programs'],
 'camp_memories' => ['path' => 'data/legacy/camp_memories.php', 'var' => 'camp_memories'],
 'site_settings' => ['path' => 'data/legacy/site_settings.php', 'var' => 'site_settings']
];
$manifest = ['source_commit' => '80432a2a6fcb4b0de6f14710748e53781ddef58c', 'catalogs' => [], 'warnings' => []];
foreach ($catalogs as $name => $src) {
 $file = $root.'/'.$src['path'];
 $value = (static function($filename, $var) { include $filename; return $$var ?? null; })($file, $src['var']);
 if (!is_array($value)) { fwrite(STDERR, "Invalid catalog: $name\\n"); exit(1); }
 $manifest['catalogs'][$name] = ['count' => count($value), 'sha256' => hash_file('sha256',$file), 'data' => $value];
}
$faqFile=$root.'/data/faq.json';
$faq=json_decode(file_get_contents($faqFile), true, 512, JSON_THROW_ON_ERROR);
$manifest['catalogs']['faq']=['count'=>count($faq),'sha256'=>hash_file('sha256',$faqFile),'data'=>$faq];
$programs=$manifest['catalogs']['all_programs']['data'];$categories=$manifest['catalogs']['programs']['data'];
foreach($programs as $id=>$record){$slug=$record['category_slug']??''; if(!isset($categories[$slug]))$manifest['warnings'][]="Program $id uses missing category: $slug";}
if(in_array('--check',$argv,true)){
 $counts=[];foreach($manifest['catalogs'] as $n=>$v)$counts[$n]=$v['count'];
 echo json_encode(['counts'=>$counts,'warnings'=>$manifest['warnings']],JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES)."\\n";
 if($counts['all_programs']!==63||$counts['destinations']!==9||$counts['programs']!==8)return exit(2);
 exit(0);
}
$out = dirname(__DIR__).'/build/imports/legacy-pr40.json';
if(($i=array_search('--output',$argv,true))!==false && isset($argv[$i+1]))$out=$argv[$i+1];
@mkdir(dirname($out),0770,true);
file_put_contents($out, json_encode($manifest,JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES|JSON_INVALID_UTF8_SUBSTITUTE|JSON_THROW_ON_ERROR));
echo "Exported $out\\n";
