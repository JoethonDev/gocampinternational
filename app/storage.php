<?php
/** Private Tigris S3 API (AWS Signature V4), no Composer or SSH required. */
require_once __DIR__ . '/catalog.php';
function gc_s3_request(string $method,string $key,string $body='',string $type='application/octet-stream'): string {
    if (!in_array($method,['GET','PUT','DELETE','HEAD'],true)) throw new InvalidArgumentException('Unsupported S3 operation');
    if ($key==='' || str_contains($key,'..') || str_contains($key,"\0")) throw new InvalidArgumentException('Invalid object key');
    if (!extension_loaded('curl')) throw new RuntimeException('cURL is required for Tigris');
    $endpoint=rtrim(getenv('TIGRIS_ENDPOINT') ?: 'https://t3.storage.dev','/');
    $parts=parse_url($endpoint);
    if (($parts['scheme']??'')!=='https' || empty($parts['host']) || isset($parts['user']) || isset($parts['query']))
        throw new RuntimeException('Use an HTTPS Tigris endpoint');
    $bucket=gc_env('TIGRIS_BUCKET');
    if ($bucket !== 'gocamp-' . (gc_env('GOCAMP_ENV')==='production'?'prod':'staging'))
        throw new RuntimeException('Tigris bucket does not match environment');
    $uri='/'.rawurlencode($bucket).'/'.implode('/',array_map('rawurlencode',explode('/',$key)));
    $host=$parts['host']; $date=gmdate('Ymd\THis\Z'); $short=substr($date,0,8);
    $hash=hash('sha256',$body);
    $headers="host:$host\nx-amz-content-sha256:$hash\nx-amz-date:$date\n";
    $signed='host;x-amz-content-sha256;x-amz-date';
    $canonical="$method\n$uri\n\n$headers\n$signed\n$hash";
    $scope="$short/auto/s3/aws4_request";
    $message="AWS4-HMAC-SHA256\n$date\n$scope\n".hash('sha256',$canonical);
    $secret=gc_env('TIGRIS_SECRET_KEY');
    $kdate=hash_hmac('sha256',$short,'AWS4'.$secret,true);
    $kregion=hash_hmac('sha256','auto',$kdate,true);
    $kservice=hash_hmac('sha256','s3',$kregion,true);
    $signing=hash_hmac('sha256','aws4_request',$kservice,true);
    $signature=hash_hmac('sha256',$message,$signing);
    $authorization='AWS4-HMAC-SHA256 Credential='.gc_env('TIGRIS_ACCESS_KEY').'/'.$scope.', SignedHeaders='.$signed.', Signature='.$signature;
    $ch=curl_init($endpoint.$uri);
    $send=["x-amz-content-sha256: $hash","x-amz-date: $date","Authorization: $authorization","Content-Type: $type"];
    curl_setopt_array($ch,[CURLOPT_CUSTOMREQUEST=>$method,CURLOPT_HTTPHEADER=>$send,
        CURLOPT_RETURNTRANSFER=>true,CURLOPT_CONNECTTIMEOUT=>5,CURLOPT_TIMEOUT=>30,
        CURLOPT_FOLLOWLOCATION=>false,CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2]);
    if ($method==='PUT')curl_setopt($ch,CURLOPT_POSTFIELDS,$body);
    $response=curl_exec($ch);$error=curl_error($ch);$status=(int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE);curl_close($ch);
    if ($response===false || $status<200 || $status>=300)
        throw new RuntimeException('Tigris '.$method.' failed (HTTP '.$status.'): '.$error);
    return (string)$response;
}
function gc_media_url(string $key): string { return '/media.php?key='.rawurlencode($key); }
function gc_media_upload(string $tmpFile,string $originalName,string $mime): array {
    if (!is_file($tmpFile) || !in_array($mime,['image/jpeg','image/png','image/gif','image/webp'],true))
        throw new InvalidArgumentException('Unsupported image');
    if (filesize($tmpFile)>5*1024*1024 || @getimagesize($tmpFile)===false) throw new InvalidArgumentException('Invalid image or file too large');
    $temp=null;$ext=$mime==='image/gif'?'gif':'webp';
    if ($mime!=='image/gif' && function_exists('compress_to_webp')) {
        $temp=tempnam(sys_get_temp_dir(),'gc-img-');
        if ($temp && compress_to_webp($tmpFile,$temp,$mime)) { $tmpFile=$temp;$mime='image/webp'; }
        else {if($temp)@unlink($temp);$temp=null;$ext=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'][$mime];}
    } elseif ($mime!=='image/gif') $ext=['image/jpeg'=>'jpg','image/png'=>'png','image/webp'=>'webp'][$mime];
    try {
        $body=file_get_contents($tmpFile); if ($body===false) throw new RuntimeException('Could not read processed image');
        $sha=hash('sha256',$body);$key='images/'.substr($sha,0,2).'/'.$sha.'-'.bin2hex(random_bytes(4)).'.'.$ext;
        gc_s3_request('PUT',$key,$body,$mime);
        $size=getimagesize($tmpFile);$url=gc_media_url($key);
        try {
            if(gc_worker()) gc_api('POST','media',[
                'object_key'=>$key,'original_name'=>substr(basename($originalName),0,240),
                'content_type'=>$mime,'bytes'=>strlen($body),'sha256'=>$sha,
                'width'=>$size[0]??null,'height'=>$size[1]??null]);
            else gc_exec(gc_db(),'INSERT INTO media_assets(object_key,public_path,original_name,content_type,bytes,sha256,width,height,is_public) VALUES (?,?,?,?,?,?,?,?,true)',
                [$key,$url,substr(basename($originalName),0,240),$mime,strlen($body),$sha,$size[0]??null,$size[1]??null]);
        } catch (Throwable $e) {
            try {gc_s3_request('DELETE',$key);}catch(Throwable $ignore){}
            throw $e;
        }
        return ['name'=>basename($originalName),'url'=>$url,'key'=>$key];
    } finally {if($temp)@unlink($temp);}
}
function gc_media_files(): array {
    $out=[];
    $rows=gc_worker()?(gc_api('GET','media/list')['files']??[]):gc_rows(gc_db(),'SELECT object_key,public_path,original_name,bytes,created_at FROM media_assets ORDER BY created_at DESC');
    foreach($rows as $row) {
        $out[]=['name'=>$row['original_name'],'path'=>$row['public_path'],'url'=>$row['public_path'],
            'folder'=>'images','size'=>(int)$row['bytes'],'modified'=>strtotime($row['created_at'])];
    }
    return $out;
}
function gc_media_label_rename(string $publicPath,string $newBase): array {
    if (!preg_match('/\A[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}\z/', $newBase))
        return ['success'=>false,'message'=>'Invalid image name.'];
    if(gc_worker())return gc_api('PATCH','media/rename',['public_path'=>$publicPath,'new_base'=>$newBase]);
    $rows=gc_rows(gc_db(),'SELECT original_name FROM media_assets WHERE public_path=?',[$publicPath]);
    if (!$rows) return ['success'=>false,'message'=>'Image not found in storage.'];
    $ext=strtolower(pathinfo($rows[0]['original_name'],PATHINFO_EXTENSION));
    gc_exec(gc_db(),'UPDATE media_assets SET original_name=? WHERE public_path=?',[$newBase.'.'.$ext,$publicPath]);
    return ['success'=>true,'message'=>'Display name updated. The stable image URL and all references remain valid.'];
}
function gc_media_reference_count_db(string $path): int {
    static $catalogText=null;
    if($catalogText===null){$catalogText='';foreach(['all_programs','programs','destinations','camp_memories','site_settings','faq'] as $kind)$catalogText.=gc_json(gc_catalog($kind));}
    return substr_count($catalogText,$path);
}