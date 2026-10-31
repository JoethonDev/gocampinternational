/** GoCamp catalog gateway; authenticated server-to-server API, no arbitrary SQL endpoints. */

const KINDS = Object.freeze(['all_programs', 'destinations', 'programs', 'site_settings', 'camp_memories', 'faq']);
const CATALOG = {
  all_programs: { table: 'programs', id: 'id', type: 'program', columns: ['name','category_slug','status','image','duration','price','color','description','tagline','level','visibility_overrides'] },
  programs: { table: 'program_categories', id: 'slug', type: 'category', columns: ['name','status','banner','intro','intro_image','color','section_visibility'] },
  destinations: { table: 'destinations', id: 'slug', type: 'destination', columns: ['name','status','banner','tagline','intro_image','intro_text','section_visibility','visibility_overrides'] }
};
const ITEM_FIELDS = {
  program: ['highlights','badges','includes','excludes','gallery','schedule'],
  category: ['sections','gallery'],
  destination: ['highlights','stats','gallery','faq'],
  memories: ['items']
};
const ITEM_COLS = ['value','label','icon','title','content','image','number','suffix','is_active','in_slider'];
const MEDIA_KEY = /^images\/[a-f0-9]{2}\/[a-f0-9]{64}-[a-f0-9]{8}\.(?:webp|jpe?g|png|gif)$/;
const MEDIA_MIMES = new Set(['image/webp','image/jpeg','image/png','image/gif']);
const badRequest = (message='Invalid request',status=400) => Object.assign(new Error(message),{httpStatus:status});
const validId = (id) => typeof id==='string' && /^[a-z0-9][a-z0-9_-]{0,159}$/.test(id);
const obj = (v) => v && typeof v === 'object' && !Array.isArray(v);
const decode = (v,fallback={}) => v===null||v===undefined ? fallback : (typeof v==='string' ? JSON.parse(v) : v);
const asText = (v) => v===null||v===undefined?'':String(v);
const publicPath = key=>'/media.php?key='+encodeURIComponent(key);

export function validateEnvironment(env,head){
  if(!['staging','production'].includes(env.GOCAMP_ENV) || head!==env.GOCAMP_ENV)throw badRequest('Environment mismatch',403);
}
export async function authorize(request,env){
  const bearer=request.headers.get('authorization')||'';
  if(!env.API_TOKEN || !bearer.startsWith('Bearer '))throw badRequest('Unauthorized',401);
  const val=bearer.slice(7);
  if(val.length===0 || val.length>512)throw badRequest('Unauthorized',401);
  const encoder=new TextEncoder();
  const [a,b]=await Promise.all([crypto.subtle.digest('SHA-256',encoder.encode(val)),crypto.subtle.digest('SHA-256',encoder.encode(env.API_TOKEN))]);
  const aa=new Uint8Array(a),bb=new Uint8Array(b);let mismatch=0;
  for(let i=0;i<aa.length;i++)mismatch|=aa[i]^bb[i];
  if(mismatch!==0)throw badRequest('Unauthorized',401);
}
function result(data,revision){return {data,revision};}
async function query(sql,q,params=[]){return sql.unsafe(q,params);}
function addItem(entry,row){
  const field=row.field;
  if(field==='schedule'){(entry.schedule??={})[row.label]=row.content;return;}
  if(field==='sections'){
    const part={title:row.title??'',content:row.content??'',image:row.image??''};
    if(row.is_active!==null)part.active=row.is_active===true;
    (entry.sections??=[]).push(part);return;
  }
  if(field==='highlights'&&row.owner_type==='destination'){(entry.highlights??=[]).push({icon:row.icon??'',text:row.value??''});return;}
  if(field==='stats'){(entry.stats??=[]).push({number:row.number??'',label:row.label??'',suffix:row.suffix??'',icon:row.icon??''});return;}
  if(field==='faq'){(entry.faq??=[]).push({q:row.label??'',a:row.content??''});return;}
  if(field==='items'&&row.owner_type==='memories'){
    (entry.items??=[]).push({image:row.image??'',caption:row.content??'',country:row.label??'',is_active:row.is_active===true,in_slider:row.in_slider===true});return;
  }
  (entry[field]??=[]).push(row.value);
}
export async function readCatalog(sql,kind){
  if(!KINDS.includes(kind))throw badRequest();
  let data;
  if(kind==='faq'){
    const faqs=await query(sql,'SELECT question,answer FROM global_faqs ORDER BY position');
    data=faqs.map(x=>({question:x.question,answer:x.answer}));
  }else if(kind==='site_settings'){
    data={};for(const x of await query(sql,'SELECT key,value FROM site_settings'))data[x.key]=decode(x.value);
  }else if(kind==='camp_memories'){
    data={title:'Go Campers Memories',show_facebook:true,items:[]};
    for(const x of await query(sql,"SELECT key,value FROM site_settings WHERE key IN ('memories_title','memories_facebook')")){
      if(x.key==='memories_title')data.title=decode(x.value);else data.show_facebook=decode(x.value);
    }
    for(const row of await query(sql,"SELECT * FROM catalog_items WHERE owner_type='memories' AND owner_id='main' ORDER BY field,position"))addItem(data,row);
  }else{
    const conf=CATALOG[kind];
    const order=kind==='all_programs'?'display_order NULLS LAST, id':conf.id;
    const [rows,items,associations]=await Promise.all([
      query(sql,`SELECT * FROM ${conf.table} ORDER BY ${order}`),
      query(sql,'SELECT * FROM catalog_items WHERE owner_type=$1 ORDER BY owner_id,field,position',[conf.type]),
      kind==='destinations' ? query(sql,'SELECT destination_slug,program_id FROM destination_programs ORDER BY destination_slug,position') : Promise.resolve([])
    ]);
    const groups=new Map();for(const row of items){if(!groups.has(row.owner_id))groups.set(row.owner_id,[]);groups.get(row.owner_id).push(row);}
    const links=new Map();for(const link of associations){if(!links.has(link.destination_slug))links.set(link.destination_slug,[]);links.get(link.destination_slug).push(link.program_id);}
    data={};
    for(const row of rows){
      const id=row[conf.id];const entry={...decode(row.extra)};
      for(const [key,value] of Object.entries(row)){
        if(key==='extra'||key==='updated_at'||value===null)continue;
        if(['section_visibility','visibility_overrides'].includes(key)){entry[key]=decode(value);continue;}
        if(kind==='all_programs'&&key==='display_order'){entry.order=value;continue;}
        if(kind==='all_programs'&&key==='age_min'){(entry.ages??={}).min=value;continue;}
        if(kind==='all_programs'&&key==='age_max'){(entry.ages??={}).max=value;continue;}
        entry[key]=value;
      }
      for(const field of ITEM_FIELDS[conf.type])entry[field]=field==='schedule'?{}:[];
      for(const rowItem of groups.get(id)||[])addItem(entry,rowItem);
      if(kind==='destinations')entry.program_ids=links.get(id)||[];
      data[id]=entry;
    }
  }
  const rev=await query(sql,'SELECT revision FROM catalog_revisions WHERE catalog=$1',[kind]);
  return result(data,Number(rev[0]?.revision??0));
}
function validateInput(kind,data){
  if(kind==='faq'){
    if(!Array.isArray(data)||data.length>500||data.some(x=>!obj(x)||typeof x.question!=='string'||typeof x.answer!=='string'))throw badRequest('Invalid FAQ');
  }else if(kind==='camp_memories'){
    if(!obj(data)||!Array.isArray(data.items)||data.items.length>500||typeof data.title!=='string')throw badRequest('Invalid memories');
  }else if(!obj(data)||Object.keys(data).length>1000)throw badRequest('Invalid catalog');
}
async function replaceItems(sql,type,id,record){
  await query(sql,'DELETE FROM catalog_items WHERE owner_type=$1 AND owner_id=$2',[type,id]);
  for(const field of ITEM_FIELDS[type]){
    const values=record[field]??(field==='schedule'?{}:[]);
    if(!obj(values)&&!Array.isArray(values))continue;
    let i=0;
    for(const [label,value] of Object.entries(values)){
      const row={value:null,label:null,icon:null,title:null,content:null,image:null,number:null,suffix:null,is_active:null,in_slider:null};
      if(field==='schedule'){row.label=String(label);row.content=asText(value);}
      else if(obj(value)){
        if(field==='highlights'){row.value=asText(value.text);row.icon=asText(value.icon);}
        else if(field==='stats')for(const key of ['number','label','suffix','icon'])row[key]=asText(value[key]);
        else if(field==='faq'){row.label=asText(value.q??value.question);row.content=asText(value.a??value.answer);}
        else if(field==='sections'){row.title=asText(value.title);row.content=asText(value.content);row.image=asText(value.image);row.is_active=value.active===undefined?null:Boolean(value.active);}
        else if(field==='items'){row.image=asText(value.image);row.content=asText(value.caption);row.label=asText(value.country);row.is_active=Boolean(value.is_active);row.in_slider=Boolean(value.in_slider);}
      }else row.value=asText(value);
      await query(sql,'INSERT INTO catalog_items(owner_type,owner_id,field,position,value,label,icon,title,content,image,number,suffix,is_active,in_slider) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)',[type,id,field,i++,...ITEM_COLS.map(key=>row[key])]);
    }
  }
}
async function upsert(sql,conf,id,record,kind){
  const extra={...record};delete extra[conf.id];
  const fields={};for(const col of conf.columns){
    const value=record[col]??(['section_visibility','visibility_overrides'].includes(col)?{}:'');
    fields[col]=['section_visibility','visibility_overrides'].includes(col)?JSON.stringify(value):value;
    delete extra[col];
  }
  for(const field of [...ITEM_FIELDS[conf.type],'program_ids'])delete extra[field];
  if(kind==='all_programs'){
    fields.display_order=record.order===''||record.order===undefined?null:Number(record.order);
    fields.age_min=record.ages?.min??null;fields.age_max=record.ages?.max??null;
    fields.duration=record.duration===undefined||record.duration===''?null:Number(record.duration);
    delete extra.order;delete extra.ages;
  }
  fields.extra=JSON.stringify(extra);fields[conf.id]=id;
  const keys=Object.keys(fields),params=Object.values(fields);
  const cols=keys.map(x=>'"'+x+'"').join(',');
  const placeholders=keys.map((_,i)=>'$'+(i+1)).join(',');
  const updates=keys.filter(x=>x!==conf.id).map(x=>'"'+x+'"=EXCLUDED."'+x+'"').join(',');
  await query(sql,`INSERT INTO ${conf.table} (${cols}) VALUES (${placeholders}) ON CONFLICT (${conf.id}) DO UPDATE SET ${updates}, updated_at=now()`,params);
  await replaceItems(sql,conf.type,id,record);
}
export async function applyCatalog(sql,kind,data){
  validateInput(kind,data);
  if(kind==='faq'){
    await query(sql,'DELETE FROM global_faqs');
    for(const [i,x] of data.entries())await query(sql,'INSERT INTO global_faqs(position,question,answer) VALUES($1,$2,$3)',[i,x.question,x.answer]);
    return;
  }
  if(kind==='site_settings'){
    for(const [key,value] of Object.entries(data))await query(sql,'INSERT INTO site_settings(key,value) VALUES($1,$2::jsonb) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()',[key,JSON.stringify(value)]);
    return;
  }
  if(kind==='camp_memories'){
    for(const [key,value] of Object.entries({memories_title:data.title,memories_facebook:Boolean(data.show_facebook)}))
      await query(sql,'INSERT INTO site_settings(key,value) VALUES($1,$2::jsonb) ON CONFLICT(key) DO UPDATE SET value=EXCLUDED.value,updated_at=now()',[key,JSON.stringify(value)]);
    await replaceItems(sql,'memories','main',data);return;
  }
  const conf=CATALOG[kind],ids=Object.keys(data);
  for(const id of ids){
    if(!validId(id)||!obj(data[id]))throw badRequest('Invalid record ID');
    await upsert(sql,conf,id,data[id],kind);
  }
  if(kind==='destinations'){
    for(const [id,record] of Object.entries(data)){
      await query(sql,'DELETE FROM destination_programs WHERE destination_slug=$1',[id]);
      let pos=0;for(const programId of new Set(record.program_ids||[])){
        if(!validId(programId))throw badRequest('Invalid program ID');
        const matching=await query(sql,'SELECT 1 FROM programs WHERE id=$1',[programId]);
        if(matching.length)await query(sql,'INSERT INTO destination_programs(destination_slug,program_id,position) VALUES($1,$2,$3)',[id,programId,pos++]);
      }
    }
  }
  const existing=await query(sql,`SELECT ${conf.id} FROM ${conf.table}`);
  for(const row of existing){
    if(ids.includes(row[conf.id]))continue;
    await query(sql,'DELETE FROM catalog_items WHERE owner_type=$1 AND owner_id=$2',[conf.type,row[conf.id]]);
    await query(sql,`DELETE FROM ${conf.table} WHERE ${conf.id}=$1`,[row[conf.id]]);
  }
}
export async function saveCatalog(sql,kind,expectedRevision,data){
  if(!KINDS.includes(kind)||!Number.isSafeInteger(expectedRevision)||expectedRevision<0)throw badRequest('Invalid revision');
  return sql.begin(async tx=>{
    await query(tx,'INSERT INTO catalog_revisions(catalog,revision) VALUES($1,0) ON CONFLICT(catalog) DO NOTHING',[kind]);
    const current=await query(tx,'SELECT revision FROM catalog_revisions WHERE catalog=$1 FOR UPDATE',[kind]);
    if(Number(current[0].revision)!==expectedRevision)throw badRequest('Catalog changed in another editor; reload and retry',409);
    await applyCatalog(tx,kind,data);
    const updated=await query(tx,'UPDATE catalog_revisions SET revision=revision+1,updated_at=now() WHERE catalog=$1 RETURNING revision',[kind]);
    return Number(updated[0].revision);
  });
}
export function response(data,status=200){return Response.json(data,{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});}
async function parseBody(request){
  const length=Number(request.headers.get('content-length')||0);
  if(!Number.isFinite(length)||length>2*1024*1024)throw badRequest('Request too large',413);
  const raw=await request.text();if(raw.length>2*1024*1024)throw badRequest('Request too large',413);
  try{return JSON.parse(raw)}catch{throw badRequest('Invalid JSON')}
}
async function mediaRoute(sql,path,request,url){
  if(request.method==='GET'&&path==='/v1/media/list')return response({files:await query(sql,'SELECT original_name,public_path,bytes,created_at FROM media_assets ORDER BY created_at DESC')});
  if(request.method==='GET'&&path==='/v1/media/mappings'){
    const rows=await query(sql,'SELECT legacy_path,public_path FROM media_assets WHERE legacy_path IS NOT NULL');
    return response({mapping:Object.fromEntries(rows.map(x=>[x.legacy_path,x.public_path]))});
  }
  if(request.method==='GET'&&path==='/v1/media/object'){
    const key=url.searchParams.get('key');if(!key||!MEDIA_KEY.test(key))throw badRequest('Invalid object key');
    const rows=await query(sql,'SELECT content_type,sha256 FROM media_assets WHERE object_key=$1 AND is_public=true',[key]);
    if(!rows.length)throw badRequest('Not found',404);
    return response({media:rows[0]});
  }
  const body=await parseBody(request);
  if(request.method==='POST'&&path==='/v1/media'){
    const {object_key,original_name,content_type,bytes,sha256,width,height,legacy_path}=body;
    if(!MEDIA_KEY.test(object_key)||!MEDIA_MIMES.has(content_type)||typeof original_name!=='string'||original_name.length>240||
       !Number.isSafeInteger(bytes)||bytes<=0||bytes>5*1024*1024||!String(sha256||'').match(/^[a-f0-9]{64}$/)||
       (width!==null&&width!==undefined&&(!Number.isInteger(width)||width<1||width>30000))||
       (height!==null&&height!==undefined&&(!Number.isInteger(height)||height<1||height>30000))||
       (legacy_path!==null&&legacy_path!==undefined&&!/^\/(images|uploads)\/[a-zA-Z0-9_.-]+$/.test(legacy_path)))throw badRequest('Invalid media metadata');
    await query(sql,'INSERT INTO media_assets(object_key,public_path,original_name,content_type,bytes,sha256,width,height,legacy_path,is_public) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,true)',[object_key,publicPath(object_key),original_name,content_type,bytes,sha256,width??null,height??null,legacy_path??null]);
    return response({url:publicPath(object_key)},201);
  }
  if(request.method==='PATCH'&&path==='/v1/media/legacy'){
    if(!MEDIA_KEY.test(body.object_key)||typeof body.legacy_path!=='string'||!/^\/(images|uploads)\/[a-zA-Z0-9_.-]+$/.test(body.legacy_path))throw badRequest('Invalid legacy path');
    const r=await query(sql,'UPDATE media_assets SET legacy_path=$1 WHERE object_key=$2 RETURNING object_key',[body.legacy_path,body.object_key]);
    if(!r.length)throw badRequest('Media not found',404);
    return response({success:true});
  }
  if(request.method==='PATCH'&&path==='/v1/media/rename'){
    if(typeof body.public_path!=='string'||typeof body.new_base!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9_-]{0,99}$/.test(body.new_base))throw badRequest('Invalid rename');
    const rows=await query(sql,'SELECT original_name FROM media_assets WHERE public_path=$1',[body.public_path]);
    if(!rows.length)throw badRequest('Media not found',404);
    const ext=(rows[0].original_name.split('.').pop()||'webp').toLowerCase();
    await query(sql,'UPDATE media_assets SET original_name=$1 WHERE public_path=$2',[body.new_base+'.'+ext,body.public_path]);
    return response({success:true,message:'Display name updated. Stable object URL preserved.'});
  }
  throw badRequest('Not found',404);
}
export async function dispatch(request,env,sql){
  const url=new URL(request.url),path=url.pathname;
  if(path==='/health'&&request.method==='GET')return response({healthy:true,environment:env.GOCAMP_ENV});
  await authorize(request,env);validateEnvironment(env,request.headers.get('x-gocamp-environment'));
  const match=path.match(/^\/v1\/catalog\/([a-z_]+)$/);
  if(match&&KINDS.includes(match[1])){
    const kind=match[1];
    if(request.method==='GET')return response(await readCatalog(sql,kind));
    if(request.method==='PUT'){
      const payload=await parseBody(request);
      const revision=await saveCatalog(sql,kind,payload.revision,payload.data);
      return response({success:true,revision});
    }
  }
  const revision=path.match(/^\/v1\/revision\/([a-z_]+)$/);
  if(revision&&KINDS.includes(revision[1])&&request.method==='GET'){
    const rows=await query(sql,'SELECT revision FROM catalog_revisions WHERE catalog=$1',[revision[1]]);
    return response({revision:Number(rows[0]?.revision??0)});
  }
  if(path.startsWith('/v1/media'))return mediaRoute(sql,path,request,url);
  throw badRequest('Not found',404);
}