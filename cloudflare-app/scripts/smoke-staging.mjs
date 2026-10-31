// Read-only HTTP smoke tests executed after the Cloudflare staging Worker deploy.
// Intentionally never POSTs, creates records, or requires credentials.
const base=(process.env.GOCAMP_STAGING_URL||"https://gocamp-migration-staging.elprincedoca.workers.dev").replace(/\/$/,"");
const tests=[
  {path:"/health",status:200,contains:"gocamp"},
  {path:"/",status:200,contains:"Go Camp"},
  {path:"/about",status:200,contains:"About Us"},
  {path:"/faq",status:200},
  {path:"/contact",status:200},
  {path:"/destinations/italy",status:200,contains:"Italy"},
  {path:"/program/category?category=adult-academic",status:200},
  {path:"/program/category?category=kids-camps",status:200,contains:"Kids Camps"},
  {path:"/admin/login",status:200,contains:"GoCamp Administration"},
  {path:"/admin",status:302,location:"/admin/login"},
  {path:"/programs",status:404},
  {path:"/gallery",status:404},
  {path:"/media/00000000-0000-0000-0000-000000000000",status:404},
  {path:"/images/hero.webp",status:200,method:"HEAD"},
  {path:"/images/bannnner.webp",status:200,method:"HEAD"},
  {path:"/home",status:301,location:"/"},
  {path:"/index.php",status:301,location:"/"},
  {path:"/home.php",status:301,location:"/"},
  {path:"/about_us.php",status:301,location:"/about"},
  {path:"/contact_us.php",status:301,location:"/contact"},
  {path:"/faq.php",status:301,location:"/faq"},
  {path:"/program/index",status:404},
  {path:"/program/index.php",status:404},
  {path:"/gallery.php",status:404},
  {path:"/not-a-legacy-page",status:404},
  {path:"/landing",status:200,contains:"Transform Your Teen"},
  {path:"/landing.php",status:301,location:"/landing"}
];
let failed=0;
function sleep(ms){return new Promise(resolve=>setTimeout(resolve,ms));}
for(const test of tests){
  let result=null,error="";
  for(let attempt=0;attempt<5;attempt++){
    try {
      const res=await fetch(base+test.path,{method:test.method||"GET",redirect:"manual",signal:AbortSignal.timeout(20000),headers:{accept:"text/html,application/json,image/*"}});
      const text=test.method==="HEAD"?"":await res.text();
      const location=res.headers.get("location")||"";
      const passed=res.status===test.status&&(!test.contains||text.toLowerCase().includes(test.contains.toLowerCase()))&&(!test.location||location.includes(test.location));
      result={status:res.status,passed,location:location.slice(0,120),snippet:text.slice(0,160)};
      if(passed)break;
      error="Unexpected response";
    }catch(e){error=String(e);}
    if(attempt<4)await sleep(1800);
  }
  if(result?.passed) console.log("PASS",test.path,result.status);
  else{console.error("FAIL",test.path,JSON.stringify({expected:test.status,result,error}));failed++;}
}
if(failed){console.error(failed+" staging smoke check(s) failed");process.exitCode=1;}
else console.log("Staging HTTP smoke checks passed:",tests.length);
