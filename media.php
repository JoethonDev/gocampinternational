<?php
/** Authenticated fetch from private Tigris bucket; serves only approved DB-listed objects. */
require_once __DIR__ . '/app/storage.php';
if (!gc_external()) { http_response_code(404); exit; }
$key=(string)($_GET['key']??'');
if (!preg_match('~\Aimages/[a-f0-9]{2}/[a-f0-9]{64}-[a-f0-9]{8}\.(?:webp|jpe?g|png|gif)\z~D',$key)) { http_response_code(404); exit; }
try {
    $rows=gc_rows(gc_db(),'SELECT content_type,sha256 FROM media_assets WHERE object_key=? AND is_public=true',[$key]);
    if (!$rows) { http_response_code(404); exit; }
    $type=$rows[0]['content_type'];$sha=$rows[0]['sha256'];
    $dir=gc_env('GOCAMP_MEDIA_CACHE_DIR');
    if (!is_dir($dir) && !mkdir($dir,0700,true) && !is_dir($dir)) throw new RuntimeException('No image cache');
    $file=rtrim($dir,'/').'/'.hash('sha256',$key).'.bin';
    if (!is_file($file)) {
        $body=gc_s3_request('GET',$key);
        if (!hash_equals($sha,hash('sha256',$body))) throw new RuntimeException('Image checksum mismatch');
        $tmp=$file.'.'.bin2hex(random_bytes(4));
        if(file_put_contents($tmp,$body,LOCK_EX)===false)throw new RuntimeException('Cache write failed');
        @chmod($tmp,0600);@rename($tmp,$file);
    }
    header('Content-Type: '.$type);
    header('Cache-Control: public, max-age=31536000, immutable');
    header('X-Content-Type-Options: nosniff');
    header('Content-Length: '.filesize($file));
    readfile($file);
} catch (Throwable $e) { error_log('GoCamp media: '.$e->getMessage());http_response_code(503); }
