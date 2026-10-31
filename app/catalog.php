<?php
/** External PostgreSQL catalog. Opt-in: GOCAMP_DATA_SOURCE=postgres; legacy is default. */
function gc_external(): bool { return in_array(getenv('GOCAMP_DATA_SOURCE'), ['postgres','worker'], true); }
function gc_worker(): bool { return getenv('GOCAMP_DATA_SOURCE') === 'worker'; }
function gc_env(string $name): string {
    $value = getenv($name);
    if (!is_string($value) || $value === '') throw new RuntimeException("Missing server setting: $name");
    return $value;
}
/** cPanel HTTPS adapter; no PostgreSQL driver required on shared hosting. */
function gc_api(string $method, string $path, ?array $payload=null): array {
    if (!gc_worker()) throw new RuntimeException('Worker API is disabled');
    $environment=gc_env('GOCAMP_ENV');
    if (!in_array($environment,['staging','production'],true)) throw new RuntimeException('Invalid environment');
    $base=rtrim(gc_env('GOCAMP_API_URL'),'/');
    $parts=parse_url($base);
    if (($parts['scheme']??'')!=='https' || empty($parts['host']) || isset($parts['user']) || isset($parts['query']) || isset($parts['fragment']))
        throw new RuntimeException('HTTPS API URL required');
    if (!preg_match('~\A(?:catalog/[a-z_]+|revision/[a-z_]+|media(?:/[a-z_]+)?(?:\?key=[a-zA-Z0-9%_.\-/]+)?)\z~', $path))
        throw new InvalidArgumentException('Invalid API endpoint');
    if (!extension_loaded('curl')) throw new RuntimeException('PHP curl extension required');
    $url=$base.'/v1/'.$path;
    $body=$payload===null?null:gc_json($payload);
    $headers=['Authorization: Bearer '.gc_env('GOCAMP_API_TOKEN'),'X-GoCamp-Environment: '.$environment,'Accept: application/json'];
    if($body!==null)$headers[]='Content-Type: application/json';
    $ch=curl_init($url);
    curl_setopt_array($ch,[CURLOPT_CUSTOMREQUEST=>$method,CURLOPT_HTTPHEADER=>$headers,CURLOPT_RETURNTRANSFER=>true,
        CURLOPT_CONNECTTIMEOUT=>4,CURLOPT_TIMEOUT=>20,CURLOPT_FOLLOWLOCATION=>false,
        CURLOPT_SSL_VERIFYPEER=>true,CURLOPT_SSL_VERIFYHOST=>2]);
    if($body!==null)curl_setopt($ch,CURLOPT_POSTFIELDS,$body);
    $result=curl_exec($ch);$error=curl_error($ch);$status=(int)curl_getinfo($ch,CURLINFO_RESPONSE_CODE);curl_close($ch);
    if($result===false || $status<200 || $status>=300) {
        error_log('GoCamp API failed with HTTP '.$status.'; '.$error);
        throw new RuntimeException($status===409?'Content changed in another editor; reload and retry':'Catalog gateway request failed (HTTP '.$status.')');
    }
    $decoded=json_decode($result,true,512,JSON_THROW_ON_ERROR);
    if(!is_array($decoded))throw new RuntimeException('Invalid catalog gateway response');
    return $decoded;
}
function gc_db(): PDO {
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;
    if (!extension_loaded('pdo_pgsql')) throw new RuntimeException('pdo_pgsql extension is required');
    $env = gc_env('GOCAMP_ENV');
    if (!in_array($env, ['staging', 'production'], true)) throw new RuntimeException('Invalid environment');
    // Fail closed if staging and production could accidentally use the same database.
    $dbname = gc_env('GOCAMP_DB_NAME');
    if ($dbname !== $env) throw new RuntimeException('Database must match GOCAMP_ENV');
    $cert = gc_env('GOCAMP_DB_CA_CERT');
    if (!is_readable($cert)) throw new RuntimeException('Aiven TLS certificate not readable');
    $dsn = sprintf('pgsql:host=%s;port=%d;dbname=%s;sslmode=verify-full;sslrootcert=%s',
        gc_env('GOCAMP_DB_HOST'), (int)gc_env('GOCAMP_DB_PORT'), $dbname, $cert);
    $pdo = new PDO($dsn, gc_env('GOCAMP_DB_USER'), gc_env('GOCAMP_DB_PASSWORD'), [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_PERSISTENT => false,
        PDO::ATTR_TIMEOUT => 5,
    ]);
    return $pdo;
}
function gc_json($value): string { return json_encode($value, JSON_THROW_ON_ERROR | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE); }
function gc_decode($value, $default = []) { return $value === null ? $default : json_decode($value, true, 512, JSON_THROW_ON_ERROR); }
function gc_rows(PDO $db, string $sql, array $params = []): array {
    $st = $db->prepare($sql); $st->execute($params); return $st->fetchAll(PDO::FETCH_ASSOC);
}
function gc_exec(PDO $db, string $sql, array $params = []): void {
    $st = $db->prepare($sql); $st->execute($params);
}
function gc_cached_path(string $kind): string {
    if (!preg_match('/\A[a-z_]+\z/', $kind)) throw new InvalidArgumentException('Invalid catalog kind');
    $dir = gc_env('GOCAMP_CACHE_DIR');
    if (!is_dir($dir) && !mkdir($dir, 0700, true) && !is_dir($dir)) throw new RuntimeException('Cache not writable');
    return rtrim($dir, '/') . '/' . gc_env('GOCAMP_ENV') . '-' . $kind . '.json';
}
function gc_cache_clear(string $kind): void { if (gc_external()) @unlink(gc_cached_path($kind)); }
function gc_admin_request(): bool {
    return PHP_SAPI === 'cli' || str_starts_with(parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '', '/admin');
}
function gc_catalog(string $kind): array {
    $kinds = ['all_programs','destinations','programs','site_settings','camp_memories','faq'];
    if (!in_array($kind, $kinds, true)) throw new InvalidArgumentException('Unsupported catalog');
    $path = gc_cached_path($kind);
    if (!gc_admin_request() && is_file($path) && filemtime($path) > time() - max(30, (int)(getenv('GOCAMP_CACHE_TTL') ?: 600))) {
        $cached = json_decode((string)file_get_contents($path), true);
        if (is_array($cached)) return $cached;
    }
    try {
        $data = gc_resolve_media_paths(gc_read_database($kind));
        if (!gc_worker()) $GLOBALS['gc_read_revisions'][$kind] = gc_revision($kind);
        $tmp = $path . '.' . bin2hex(random_bytes(4));
        if (file_put_contents($tmp, gc_json($data), LOCK_EX) !== false) { @chmod($tmp, 0600); @rename($tmp, $path); }
        return $data;
    } catch (Throwable $e) {
        error_log('GoCamp catalog read failed (' . $kind . '): ' . $e->getMessage());
        if (!gc_admin_request() && is_file($path)) {
            $cached = json_decode((string)file_get_contents($path), true);
            if (is_array($cached)) return $cached;
        }
        throw new RuntimeException('External catalog is unavailable', 0, $e);
    }
}
function gc_revision(string $kind): int {
    if (gc_worker()) return (int)(gc_api('GET','revision/'.$kind)['revision']??0);
    $rows = gc_rows(gc_db(), 'SELECT revision FROM catalog_revisions WHERE catalog = ?', [$kind]);
    return (int)($rows[0]['revision'] ?? 0);
}
function gc_item_rows(string $type, string $id): array {
    return gc_rows(gc_db(), 'SELECT * FROM catalog_items WHERE owner_type=? AND owner_id=? ORDER BY field,position', [$type,$id]);
}
function gc_add_items(array &$entry, array $items): void {
    foreach ($items as $row) {
        $field = $row['field'];
        if ($field === 'schedule') { $entry[$field][$row['label']] = $row['content']; continue; }
        if ($field === 'sections') {
            $part = ['title'=>$row['title'] ?? '', 'content'=>$row['content'] ?? '', 'image'=>$row['image'] ?? ''];
            if ($row['is_active'] !== null) $part['active'] = $row['is_active'] === true || $row['is_active'] === 't';
            $entry[$field][] = $part;
            continue;
        }
        if ($field === 'highlights' && $row['owner_type'] === 'destination') {
            $entry[$field][] = ['icon'=>$row['icon'] ?? '', 'text'=>$row['value'] ?? '']; continue;
        }
        if ($field === 'stats') { $entry[$field][] = ['number'=>$row['number'] ?? '', 'label'=>$row['label'] ?? '', 'suffix'=>$row['suffix'] ?? '', 'icon'=>$row['icon'] ?? '']; continue; }
        if ($field === 'faq') { $entry[$field][] = ['q'=>$row['label'] ?? '', 'a'=>$row['content'] ?? '']; continue; }
        if ($field === 'items' && $row['owner_type'] === 'memories') {
            $entry[$field][] = ['image'=>$row['image'] ?? '', 'caption'=>$row['content'] ?? '', 'country'=>$row['label'] ?? '', 'is_active'=>in_array($row['is_active'],[true,'t','1'],true), 'in_slider'=>in_array($row['in_slider'],[true,'t','1'],true)]; continue;
        }
        $entry[$field][] = $row['value'];
    }
}
function gc_read_database(string $kind): array {
    if (gc_worker()) {
        $reply=gc_api('GET','catalog/'.$kind);
        if (!is_array($reply['data']??null)) throw new RuntimeException('Invalid catalog payload');
        $GLOBALS['gc_read_revisions'][$kind]=(int)($reply['revision']??0);
        return $reply['data'];
    }
    $db = gc_db();
    if ($kind === 'faq') return array_map(static fn($r)=>['question'=>$r['question'],'answer'=>$r['answer']],gc_rows($db,'SELECT question,answer FROM global_faqs ORDER BY position'));
    if ($kind === 'site_settings') {
        $settings = []; foreach (gc_rows($db,'SELECT key,value FROM site_settings') as $r) $settings[$r['key']] = gc_decode($r['value']); return $settings;
    }
    if ($kind === 'camp_memories') {
        $head = gc_rows($db,"SELECT key,value FROM site_settings WHERE key IN ('memories_title','memories_facebook')");
        $out = ['title'=>'Go Campers Memories','show_facebook'=>true,'items'=>[]];
        foreach ($head as $r) { $v=gc_decode($r['value']); if ($r['key']==='memories_title') $out['title']=$v; else $out['show_facebook']=$v; }
        gc_add_items($out,gc_item_rows('memories','main')); return $out;
    }
    $table = ['programs'=>'program_categories','all_programs'=>'programs','destinations'=>'destinations'][$kind];
    $idfield = $kind === 'all_programs' ? 'id' : 'slug';
    $results = [];
    foreach (gc_rows($db, "SELECT * FROM $table ORDER BY " . ($table==='programs'?'display_order NULLS LAST,':'') . "$idfield") as $row) {
        $id = $row[$idfield];
        $out = gc_decode($row['extra']);
        foreach ($row as $key=>$value) {
            if (in_array($key,['updated_at','extra'],true)) continue;
            if (in_array($key,['section_visibility','visibility_overrides'],true)) $value=gc_decode($value);
            if ($kind==='all_programs') {
                if ($key==='age_min' || $key==='age_max') { $out['ages'][$key==='age_min'?'min':'max'] = $value; continue; }
                if ($key==='display_order') { $out['order']=$value; continue; }
            }
            if ($value!==null) $out[$key]=$value;
        }
        $type = $kind==='all_programs'?'program':($kind==='programs'?'category':'destination');
        foreach (['highlights','stats','gallery','faq','badges','includes','excludes','schedule','sections'] as $field) {
            if ($type === 'program' && in_array($field,['highlights','gallery','badges','includes','excludes','schedule'],true)
                || $type==='category' && in_array($field,['sections','gallery'],true)
                || $type==='destination' && in_array($field,['highlights','stats','gallery','faq'],true)) $out[$field]=[];
        }
        gc_add_items($out,gc_item_rows($type,$id));
        if ($kind==='destinations') {
            $out['program_ids']=array_column(gc_rows($db,'SELECT program_id FROM destination_programs WHERE destination_slug=? ORDER BY position',[$id]),'program_id');
        }
        $results[$id] = $out;
    }
    return $results;
}
/** Replace one collection atomically. Reject stale concurrent admin editors. */
function gc_save_catalog(string $kind, array $values): bool {
    if (gc_worker()) {
        $revision=$GLOBALS['gc_read_revisions'][$kind]??null;
        if (!is_int($revision)) throw new RuntimeException('Read the current catalog before saving edits');
        $result=gc_api('PUT','catalog/'.$kind,['revision'=>$revision,'data'=>$values]);
        $GLOBALS['gc_read_revisions'][$kind]=(int)$result['revision'];
        gc_cache_clear($kind);
        if(in_array($kind,['all_programs','destinations'],true))gc_cache_clear('destinations');
        return true;
    }
    $db=gc_db(); $db->beginTransaction();
    try {
        gc_exec($db, 'SELECT pg_advisory_xact_lock(hashtext(?))', ['gocamp:' . $kind]);
        $actual=gc_revision($kind);
        $known=$GLOBALS['gc_read_revisions'][$kind] ?? null;
        if ($known === null || $actual !== $known) throw new RuntimeException('Content changed in another editor. Reload and try again.');
        gc_apply_catalog($db,$kind,$values);
        gc_exec($db, 'INSERT INTO catalog_revisions(catalog,revision) VALUES (?,1) ON CONFLICT(catalog) DO UPDATE SET revision=catalog_revisions.revision+1,updated_at=now()',[$kind]);
        $db->commit();
        $GLOBALS['gc_read_revisions'][$kind]=$actual+1;
        gc_cache_clear($kind);
        if ($kind==='all_programs' || $kind==='destinations') gc_cache_clear('destinations');
        return true;
    } catch (Throwable $e) { if ($db->inTransaction()) $db->rollBack(); error_log('GoCamp catalog write: '.$e->getMessage()); throw $e; }
}
function gc_replace_items(PDO $db, string $type, string $id, array $record): void {
    gc_exec($db,'DELETE FROM catalog_items WHERE owner_type=? AND owner_id=?',[$type,$id]);
    $fields = ['program'=>['highlights','badges','includes','excludes','gallery','schedule'],
        'destination'=>['highlights','stats','gallery','faq'], 'category'=>['sections','gallery'], 'memories'=>['items']][$type];
    foreach ($fields as $field) {
        $values=$record[$field]??[];
        if (!is_array($values)) continue;
        $position=0;
        foreach ($values as $label=>$value) {
            $row=['value'=>null,'label'=>null,'icon'=>null,'title'=>null,'content'=>null,'image'=>null,'number'=>null,'suffix'=>null,'is_active'=>null,'in_slider'=>null];
            if ($field==='schedule') { $row['label']=(string)$label; $row['content']=(string)$value; }
            elseif (is_array($value)) {
                if ($field==='highlights') {$row['value']=(string)($value['text']??'');$row['icon']=(string)($value['icon']??'');}
                elseif ($field==='stats') { foreach (['number','label','suffix','icon'] as $k) $row[$k]=(string)($value[$k]??''); }
                elseif ($field==='faq') {$row['label']=(string)($value['q']??$value['question']??'');$row['content']=(string)($value['a']??$value['answer']??'');}
                elseif ($field==='sections') {$row['title']=(string)($value['title']??'');$row['content']=(string)($value['content']??'');$row['image']=(string)($value['image']??'');$row['is_active']=isset($value['active'])?(bool)$value['active']:null;}
                elseif ($field==='items') {$row['image']=(string)($value['image']??'');$row['content']=(string)($value['caption']??'');$row['label']=(string)($value['country']??'');$row['is_active']=(bool)($value['is_active']??false);$row['in_slider']=(bool)($value['in_slider']??false);}
            } else $row['value']=(string)$value;
            gc_exec($db,'INSERT INTO catalog_items(owner_type,owner_id,field,position,value,label,icon,title,content,image,number,suffix,is_active,in_slider) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)',
                [$type,$id,$field,$position++,...array_values($row)]);
        }
    }
}
function gc_upsert(PDO $db, string $table, array $fields, string $pk): void {
    $names=array_keys($fields);
    $quoted=implode(',',array_map(static fn($x)=>'"'.$x.'"',$names));
    $placeholders=implode(',',array_fill(0,count($fields),'?'));
    $updates=implode(',',array_map(static fn($x)=>'"'.$x.'"=EXCLUDED."'.$x.'"',array_filter($names,static fn($x)=>$x!==$pk)));
    gc_exec($db,"INSERT INTO $table ($quoted) VALUES ($placeholders) ON CONFLICT ($pk) DO UPDATE SET $updates,updated_at=now()",array_values($fields));
}
function gc_apply_catalog(PDO $db,string $kind,array $values): void {
    if ($kind==='faq') {gc_exec($db,'DELETE FROM global_faqs');foreach(array_values($values) as $i=>$r)gc_exec($db,'INSERT INTO global_faqs(position,question,answer) VALUES(?,?,?)',[$i,$r['question'],$r['answer']]);return;}
    if ($kind==='site_settings') {foreach($values as $k=>$v)gc_exec($db,'INSERT INTO site_settings(key,value) VALUES(?,?::jsonb) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()',[$k,gc_json($v)]);return;}
    if ($kind==='camp_memories') {
        foreach(['memories_title'=>$values['title'],'memories_facebook'=>(bool)$values['show_facebook']] as $key=>$v)
            gc_exec($db,'INSERT INTO site_settings(key,value) VALUES(?,?::jsonb) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()',[$key,gc_json($v)]);
        gc_replace_items($db,'memories','main',$values);return;
    }
    $tables=['programs'=>'program_categories','all_programs'=>'programs','destinations'=>'destinations'];
    $types=['programs'=>'category','all_programs'=>'program','destinations'=>'destination'];
    $table=$tables[$kind];$type=$types[$kind];$idfield=$kind==='all_programs'?'id':'slug';
    $known=[];
    foreach ($values as $id=>$record) {
        if (!is_array($record)) throw new InvalidArgumentException('Invalid catalog row');
        $id=(string)$id; if ($id==='' || strlen($id)>160 || !preg_match('/\A[a-z0-9][a-z0-9_-]*\z/', $id)) throw new InvalidArgumentException('Invalid content ID');
        $known[]=$id;
        $fields=[]; $extra=$record;
        $cols = match($kind) {
            'programs'=>['name','status','banner','intro','intro_image','color','section_visibility'],
            'destinations'=>['name','status','banner','tagline','intro_image','intro_text','section_visibility','visibility_overrides'],
            'all_programs'=>['name','category_slug','status','image','duration','price','color','description','tagline','level','visibility_overrides'],
        };
        foreach ($cols as $col) {
            $fallback=in_array($col,['section_visibility','visibility_overrides'],true)?[]:'';
            $value=$record[$col]??$fallback;
            $fields[$col]=in_array($col,['section_visibility','visibility_overrides'],true)?gc_json($value):$value;
            unset($extra[$col]);
        }
        unset($extra[$idfield]);
        foreach(['highlights','stats','gallery','faq','sections','badges','includes','excludes','schedule','program_ids'] as $remove)unset($extra[$remove]);
        if ($kind==='all_programs') {
            $fields['display_order']=isset($record['order'])&&$record['order']!==''?(int)$record['order']:null;
            $fields['age_min']=isset($record['ages']['min'])?(int)$record['ages']['min']:null;
            $fields['age_max']=isset($record['ages']['max'])?(int)$record['ages']['max']:null;
            unset($extra['order'],$extra['ages']);
            $fields['duration']=isset($record['duration'])?(int)$record['duration']:null;
        }
        $fields[$idfield]=$id;$fields['extra']=gc_json($extra);
        gc_upsert($db,$table,$fields,$idfield);
        gc_replace_items($db,$type,$id,$record);
        if ($kind==='destinations') {
            gc_exec($db,'DELETE FROM destination_programs WHERE destination_slug=?',[$id]);
            foreach (array_values(array_unique($record['program_ids']??[])) as $order=>$programId) {
                if (gc_rows($db,'SELECT id FROM programs WHERE id=?',[$programId]))
                    gc_exec($db,'INSERT INTO destination_programs(destination_slug,program_id,position) VALUES(?,?,?)',[$id,$programId,$order]);
                else error_log('GoCamp migration: unmatched destination program '.$programId);
            }
        }
    }
    // Remove records omitted from the current authoritative collection, but never delete from another catalog.
    $existing=gc_rows($db,"SELECT $idfield FROM $table");
    foreach ($existing as $row) if (!in_array($row[$idfield],$known,true)) {
        gc_exec($db,'DELETE FROM catalog_items WHERE owner_type=? AND owner_id=?',[$type,$row[$idfield]]);
        gc_exec($db,"DELETE FROM $table WHERE $idfield=?",[$row[$idfield]]);
    }
}
/** Rewrite only source-image references backed by an imported object. */
function gc_resolve_media_paths(array $data): array {
    static $mapping=null;
    if ($mapping===null) {
        $mapping=[];
        if(gc_worker()) $mapping=gc_api('GET','media/mappings')['mapping']??[];
        else foreach(gc_rows(gc_db(),'SELECT legacy_path,public_path FROM media_assets WHERE legacy_path IS NOT NULL') as $row) {
            $mapping[$row['legacy_path']]=$row['public_path'];
        }
    }
    if (!$mapping) return $data;
    $walk=static function($value)use (&$walk,$mapping){
        if (is_array($value)) return array_map($walk,$value);
        if (!is_string($value)) return $value;
        if (isset($mapping[$value])) return $mapping[$value];
        if (isset($mapping['/images/'.$value])) return $mapping['/images/'.$value];
        // Replace paths embedded in HTML. Do not replace arbitrary substrings in prose.
        if (str_contains($value,'/images/') || str_contains($value,'/uploads/')) return strtr($value,$mapping);
        return $value;
    };
    return $walk($data);
}