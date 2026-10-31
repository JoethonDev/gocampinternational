<?php
/** CLI staging import from committed /images and /uploads. No CRON or FTP. */
if(PHP_SAPI!=='cli'){http_response_code(403);exit('CLI only');}
require_once __DIR__.'/../app/storage.php';
if(!gc_external() || gc_env('GOCAMP_ENV')!=='staging' || ($argv[1]??'')!=='--confirm-staging')
    throw new RuntimeException('Staging-only image import requires --confirm-staging');
$root=dirname(__DIR__);
foreach(['images','uploads'] as $folder){
    $path=$root.'/'.$folder; if(!is_dir($path)) continue;
    foreach(new DirectoryIterator($path) as $file){
        if(!$file->isFile() || $file->isLink() || !preg_match('/\.(?:webp|png|jpe?g|gif)$/i',$file->getFilename()))continue;
        $legacy='/'.$folder.'/'.$file->getFilename();
        if(gc_worker())throw new RuntimeException('Image import requires direct PostgreSQL mode in GitHub Actions');
        if(gc_rows(gc_db(),'SELECT 1 FROM media_assets WHERE legacy_path=?',[$legacy]))continue;
        $mime=(new finfo(FILEINFO_MIME_TYPE))->file($file->getPathname());
        if(!in_array($mime,['image/jpeg','image/png','image/gif','image/webp'],true))continue;
        if($file->getSize()>5*1024*1024){echo 'SKIP (size): '.$legacy."\n";continue;}
        $uploaded=gc_media_upload($file->getPathname(),$file->getFilename(),$mime);
        gc_exec(gc_db(),'UPDATE media_assets SET legacy_path=? WHERE object_key=?',[$legacy,$uploaded['key']]);
        echo 'Imported '.$legacy."\n";
    }
}
foreach(['all_programs','destinations','programs','camp_memories'] as $kind)gc_cache_clear($kind);
echo "Image import complete.\n";