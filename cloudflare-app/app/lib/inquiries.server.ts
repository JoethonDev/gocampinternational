type Kind="contact"|"lead"|"newsletter";
type FormDataObject=Record<string,unknown>;
const fail=(message:string,status=400)=>Response.json({success:false,error:message},{status,headers:{"cache-control":"no-store"}});
const clean=(v:unknown,max:number)=>typeof v==="string"?v.replace(/[\r\n]/g,"").replace(/%0[ad]/gi,"").trim().slice(0,max+1):"";
export async function submitInquiry(request:Request,db:D1Database,kind:Kind,forceLanding=false):Promise<Response>{
  if(request.method!=="POST")return fail("Method not allowed",405);
  const origin=request.headers.get("origin");
  if(origin&&origin!==new URL(request.url).origin)return fail("Invalid request origin",403);
  const len=Number(request.headers.get("content-length")||0);
  if(len>16384)return fail("Request too large",413);
  let raw:FormDataObject={};
  try{
    const type=request.headers.get("content-type")||"";
    if(type.includes("application/json")){const input=await request.json();if(!input||typeof input!=="object"||Array.isArray(input))return fail("Invalid request");raw=input as FormDataObject;}
    else if(type.includes("application/x-www-form-urlencoded")||type.includes("multipart/form-data")){
      const form=await request.formData();
      raw=Object.fromEntries(form.entries());
      if(kind==="lead" && (forceLanding || form.get("source")==="Landing Page"))raw["interests[]"]=form.getAll("interests[]");
    }
    else return fail("Unsupported format",415);
  }catch{return fail("Invalid request");}
  // Route identity is authoritative; do not let clients bypass mandatory consent
  // by changing the hidden source field or sending an API-style payload to /landing.
  if(forceLanding)raw.source="Landing Page";
  if(raw.website)return Response.json({success:true,message:"Request received"},{headers:{"cache-control":"no-store"}});
  const name=clean(raw.name,100),email=clean(raw.email,254),phone=clean(raw.phone,30);
  const validEmail=/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if(!validEmail||email.length>254||(kind!=="newsletter"&&(name.length===0||name.length>100)))return fail("Invalid name or email");
  if(kind==="lead"&&(phone.length===0||phone.length>30))return fail("Invalid phone");
  const extra:Record<string,string>={};
  if(kind==="contact"){
    for(const [key,max] of [["country",100],["subject",200],["message",5000]] as const){
      const value=typeof raw[key]==="string"?raw[key].trim():"";
      if(value.length>max)return fail("Field too long");
      extra[key]=value;
    }
  }
  if(kind==="lead"){
    for(const [key,max] of [["interest",5000],["source",5000]] as const){
      const value=clean(raw[key],max);if(value.length>max)return fail("Field too long");extra[key]=value;
    }
    // The PR #40 marketing page collects different fields from the modal CTA.
    // Preserve all selections and enforce consent on the server, not only HTML.
    if(raw.source==="Landing Page"){
      const age=clean(raw.age,3),gender=clean(raw.gender,10);
      const interests=raw["interests[]"];
      const choices=Array.isArray(interests)?interests:interests?[interests]:[];
      const allowed=new Set(["Sports","Language","Leadership","Academic"]);
      if(!/^(?:[7-9]|1[0-8])$/.test(age)||!["Male","Female"].includes(gender)||
          !["on","1","yes"].includes(String(raw.privacyConsent||""))||
          choices.length>4||choices.some(x=>typeof x!=="string"||!allowed.has(x)))
        return fail("Please enter the child's age, gender, and privacy consent correctly");
      extra.age=age;extra.gender=gender;extra.interests=choices.join(", ");
      extra.privacyConsent="yes";
    }
  }
  if(phone.length>30)return fail("Invalid phone");
  // Fixed-size, account-free D1 window; hash address so the raw IP is not persisted.
  const ip=request.headers.get("cf-connecting-ip")||request.headers.get("x-real-ip")||"unknown";
  const period=kind==="newsletter"?600:60,max=5,now=Math.floor(Date.now()/1000);
  const keyBytes=await crypto.subtle.digest("SHA-256",new TextEncoder().encode(kind+":"+ip));
  const hash=Array.from(new Uint8Array(keyBytes)).map(x=>x.toString(16).padStart(2,"0")).join("");
  const limit=await db.prepare(`INSERT INTO submission_limits(scope,address_hash,window_start,attempts)
     VALUES(?,?,?,1) ON CONFLICT(scope,address_hash) DO UPDATE SET
     attempts=CASE WHEN window_start <= ? THEN 1 ELSE attempts+1 END,
     window_start=CASE WHEN window_start <= ? THEN ? ELSE window_start END
     WHERE window_start <= ? OR attempts < ? RETURNING attempts`)
     .bind(kind,hash,now,now-period,now-period,now,now-period,max).first<{attempts:number}>();
  if(!limit)return fail("Too many requests, try again later",429);
  const id=crypto.randomUUID(),payload={name,email,phone,...extra};
  await db.prepare("INSERT INTO inquiries(id,kind,name,email,phone,status,content_json) VALUES(?,?,?,?,?,'new',?)")
    .bind(id,kind,name,email,phone,JSON.stringify(payload)).run();
  return Response.json({success:true,message:kind==="newsletter"?"Subscribed successfully":"Message saved successfully"},{headers:{"cache-control":"no-store"}});
}
