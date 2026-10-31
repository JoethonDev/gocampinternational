import { verifyAdminPost } from "./admin.server";
export type Kind="program"|"destination"|"category";
const validId=(s:string)=>/^[a-z0-9][a-z0-9_-]{0,159}$/.test(s);
const statuses:Record<Kind,string[]>={program:["active","inactive","trash"],destination:["active","inactive","coming-soon","trash"],category:["active","inactive","trash"]};
const toText=(v:FormDataEntryValue|null,max:number)=>typeof v==="string"?v.trim().slice(0,max+1):"";
export function ensureKind(raw:string):Kind {
  if(raw!=="program"&&raw!=="destination"&&raw!=="category")throw new Response("Not Found",{status:404});
  return raw;
}
function readFields(form:FormData,kind:Kind,previous:Record<string,unknown>) {
  const name=toText(form.get("name"),160),status=toText(form.get("status"),40);
  if(!name||name.length>160||!statuses[kind].includes(status))throw new Response("Invalid name or status",{status:400});
  const data:{[key:string]:unknown}={...previous,name,status};
  const fields:Record<Kind,Array<[string,number]>>={
    program:[["category_slug",160],["image",2048],["tagline",1500],["price",120],["level",160],["color",60],["description",50000]],
    destination:[["banner",2048],["tagline",1500],["intro_text",50000],["intro_image",2048]],
    category:[["banner",2048],["intro",50000],["intro_image",2048],["color",60]]
  };
  for(const [field,max] of fields[kind]) {
    const value=toText(form.get(field),max);
    if(value.length>max)throw new Response("Field exceeds maximum length",{status:400});
    if(value===""&&!Object.hasOwn(previous,field))continue;
    data[field]=value;
  }

  const jsonList=(field:string,allowed:Array<[string,number,"string"|"boolean"]>)=>{
    const raw=form.get("json_"+field);
    if(raw===null)return null;
    if(typeof raw!=="string"||raw.length>120000)throw new Response("Structured field too large",{status:413});
    let parsed:unknown;
    try{parsed=JSON.parse(raw);}catch{throw new Response("Invalid structured field",{status:400});}
    if(!Array.isArray(parsed)||parsed.length>150)throw new Response("Invalid list length",{status:400});
    return parsed.map(entry=>{
      if(!entry||typeof entry!=="object"||Array.isArray(entry))throw new Response("Invalid list item",{status:400});
      const row=entry as Record<string,unknown>,cleaned:Record<string,unknown>={};
      for(const [name,max,type] of allowed){
        if(type==="boolean"){cleaned[name]=row[name]!==false;continue;}
        const str=String(row[name]??"").trim();
        if(str.length>max)throw new Response("Field too long",{status:400});
        cleaned[name]=str;
      }
      return cleaned;
    });
  };
  if(kind==="program") {
    const order=toText(form.get("order"),12),duration=toText(form.get("duration"),12);
    const min=toText(form.get("ages_min"),3),max=toText(form.get("ages_max"),3);
    if([order,duration,min,max].some(v=>v&&!/^\d+$/.test(v)))throw new Response("Invalid numeric field",{status:400});
    if(min!==""&&max!==""&&Number(min)>Number(max))throw new Response("Invalid ages",{status:400});
    data.order=order===""?null:Number(order);
    data.duration=duration===""?null:Number(duration);
    if(form.get("price")===""&&Object.hasOwn(previous,"price"))data.price=null;
    data.ages={min:min===""?null:Number(min),max:max===""?null:Number(max)};
    for(const field of ["highlights","includes","excludes","badges","gallery"]) {
      const raw=toText(form.get(field),25000);
      if(raw.length>25000)throw new Response("Field too large",{status:400});
      if(raw===""&&!Object.hasOwn(previous,field))continue;
      data[field]=raw.split("\n").map(v=>v.trim()).filter(Boolean).slice(0,150);
    }
    const schedule=jsonList("schedule",[["time",100,"string"],["description",3000,"string"]]);
    if(schedule){
      const scheduled=schedule.filter(x=>x.time);
      if(scheduled.length)data.schedule=Object.fromEntries(scheduled.map(x=>[x.time,x.description]));
      else if(Array.isArray(previous.schedule))data.schedule=[];
      else if(Object.hasOwn(previous,"schedule"))data.schedule={};
      else delete data.schedule;
    }
    data.id=String(previous.id||form.get("slug")||"");
  }
  if(kind==="destination") {
    const ids=toText(form.get("program_ids"),20000);
    data.program_ids=ids.split(/[\n,]+/).map(x=>x.trim()).filter(Boolean).slice(0,150);
    const h=jsonList("highlights",[["icon",160,"string"],["text",3000,"string"]]);if(h)data.highlights=h;
    const stats=jsonList("stats",[["number",100,"string"],["suffix",100,"string"],["label",300,"string"],["icon",160,"string"]]);if(stats)data.stats=stats;
    const faq=jsonList("faq",[["q",3000,"string"],["a",20000,"string"]]);if(faq)data.faq=faq;
  }
  if(kind==="category") {
    data.section_visibility=previous.section_visibility||{};
    const sections=jsonList("sections",[["title",500,"string"],["content",40000,"string"],["image",2048,"string"],["is_active",0,"boolean"]]);if(sections)data.sections=sections;
    const gallery=toText(form.get("gallery"),20000);data.gallery=gallery.split("\n").map(s=>s.trim()).filter(Boolean).slice(0,150);
  }
  const overrides=toText(form.get("visibility_overrides"),25000);
  if(overrides) {
    let parsed:unknown;
    try{parsed=JSON.parse(overrides);}catch{throw new Response("Invalid visibility JSON",{status:400});}
    if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Response("Visibility overrides must be an object",{status:400});
    data.visibility_overrides=parsed;
  }
  return data;
}
export async function saveEntity(request:Request,db:D1Database,kind:Kind,form:FormData,originalSlug?:string) {
  await verifyAdminPost(request,db,form);
  const slug=toText(form.get("slug"),160).toLowerCase();
  if(!validId(slug))throw new Response("Invalid ID / slug",{status:400});
  const original=originalSlug||slug;
  // Slugs remain stable during editing; migrating references during rename is a later acceptance gate.
  if(originalSlug&&slug!==originalSlug)throw new Response("Changing the slug is not supported yet",{status:409});
  const row=await db.prepare("SELECT content_json,revision,sort_order FROM catalog_entities WHERE kind=? AND slug=?").bind(kind,original).first<{content_json:string;revision:number;sort_order:number}>();
  const previous=row?JSON.parse(row.content_json) as Record<string,unknown>:{};
  const data=readFields(form,kind,previous);
  if(kind==="destination")data.slug=slug;
  if(kind==="category")data.slug=slug;
  const revision=Number(form.get("revision")||0);
  const category=kind==="program"?String(data.category_slug||""):null;
  // A content-only edit must not silently reorder categories/destinations or
  // records whose order is intentionally unspecified in source data.
  const order=kind==="program"&&data.order!==null&&data.order!==undefined?Number(data.order):(row?.sort_order??0);
  const jobs:D1PreparedStatement[]=[];
  if(kind==="destination") {
    const ids=[...new Set((data.program_ids as string[])||[])];
    data.program_ids=ids;
    const valid=ids.length ? await db.prepare("SELECT slug FROM catalog_entities WHERE kind='program' AND slug IN ("+ids.map(()=>"?").join(",")+")").bind(...ids).all<{slug:string}>():{results:[] as Array<{slug:string}>};
    if(valid.results.length!==ids.length)throw new Response("Destination references an unknown program",{status:400});
  }
  if(row) {
    if(revision!==row.revision)throw new Response("This record was changed by another editor. Reload before saving.",{status:409});
    jobs.push(db.prepare("UPDATE catalog_entities SET name=?,status=?,category_slug=?,sort_order=?,content_json=?,revision=revision+1,updated_at=unixepoch() WHERE kind=? AND slug=? AND revision=?")
      .bind(data.name,data.status,category,order,JSON.stringify(data),kind,slug,revision));
  } else {
    jobs.push(db.prepare("INSERT INTO catalog_entities(kind,slug,name,status,category_slug,sort_order,content_json,revision) VALUES(?,?,?,?,?,?,?,0)")
      .bind(kind,slug,data.name,data.status,category,order,JSON.stringify(data)));
  }
  if(kind==="destination") {
    const ids=(data.program_ids as string[])||[];
    jobs.push(db.prepare("DELETE FROM destination_programs WHERE destination_slug=?").bind(slug));
    jobs.push(...ids.map((id,i)=>db.prepare("INSERT INTO destination_programs(destination_slug,program_slug,position) VALUES(?,?,?)").bind(slug,id,i)));
  }
  // D1 batch executes the entity write and every destination association in a single transaction.
  const result=await db.batch(jobs);
  if(result[0].meta.changes!==1)throw new Response("Concurrent update or duplicate ID",{status:409});
  return slug;
}
export async function changeBulkStatus(request:Request,db:D1Database,kind:Kind,form:FormData) {
  await verifyAdminPost(request,db,form);
  const status=toText(form.get("status"),40);
  if(!statuses[kind].includes(status))throw new Response("Invalid status",{status:400});
  const ids=form.getAll("ids").map(x=>String(x)).filter(validId);
  if(ids.length===0||ids.length>100)throw new Response("Select 1 to 100 records",{status:400});
  const unique=[...new Set(ids)];
  const rows=await db.prepare("SELECT slug,content_json,revision FROM catalog_entities WHERE kind=? AND slug IN ("+unique.map(()=>"?").join(",")+")").bind(kind,...unique).all<{slug:string;content_json:string;revision:number}>();
  if(rows.results.length!==unique.length)throw new Response("One or more records are unavailable",{status:409});
  const jobs=rows.results.map(row=>{
    const data={...(JSON.parse(row.content_json) as Record<string,unknown>),status};
    return db.prepare("UPDATE catalog_entities SET status=?,content_json=?,revision=revision+1,updated_at=unixepoch() WHERE kind=? AND slug=? AND revision=?")
      .bind(status,JSON.stringify(data),kind,row.slug,row.revision);
  });
  const results=await db.batch(jobs);
  if(results.some(v=>v.meta.changes!==1))throw new Response("Concurrent update detected",{status:409});
  return results.length;
}
export async function saveDocument(request:Request,db:D1Database,key:"site_settings"|"camp_memories"|"faq",form:FormData) {
  await verifyAdminPost(request,db,form);
  const raw=toText(form.get("content"),250000);
  if(raw.length>250000)throw new Response("Document too large",{status:413});
  let value:unknown;
  try{value=JSON.parse(raw);}catch{throw new Response("Invalid JSON",{status:400});}
  if(key==="faq"&&(!Array.isArray(value)||value.length>500||value.some(x=>!x||typeof x.question!=="string"||typeof x.answer!=="string")))throw new Response("Invalid FAQ entries",{status:400});
  if(key==="camp_memories"&&(!value||typeof value!=="object"||Array.isArray(value)||!Array.isArray((value as {items?:unknown}).items)))throw new Response("Invalid memories data",{status:400});
  if(key==="site_settings"&&(!value||typeof value!=="object"||Array.isArray(value)))throw new Response("Invalid settings data",{status:400});
  const rev=Number(form.get("revision")||0);
  const result=await db.prepare("UPDATE site_documents SET content_json=?,revision=revision+1,updated_at=unixepoch() WHERE key=? AND revision=?")
    .bind(JSON.stringify(value),key,rev).run();
  if(result.meta.changes!==1)throw new Response("Document changed; reload to avoid overwriting",{status:409});
}
