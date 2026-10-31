/* Capture original PHP and staging React at identical viewports, and verify
 * computed nav/hero behavior. Run from repository root in GitHub Actions. */
const {chromium}=require("playwright");
const fs=require("node:fs/promises"),path=require("node:path");
const legacy=process.env.LEGACY_URL||"http://127.0.0.1:8765";
const staging=process.env.STAGING_URL||"https://gocamp-migration-staging.elprincedoca.workers.dev";
const viewports=[{name:"desktop",width:1440,height:900},{name:"tablet",width:820,height:1180},{name:"mobile",width:390,height:844}];
const pages=[{name:"home",url:"/"},{name:"destination-italy",url:"/destinations/italy"},{name:"category-academic",url:"/program/category?category=adult-academic"}];
const output=path.resolve("artifacts/migration-parity");
function assert(value,msg){if(!value)throw Error(msg);}
async function metrics(page) {
  return await page.evaluate(()=>{
    const navbar=document.querySelector(".navbar.fixed-top");
    const navLink=document.querySelector(".navbar .nav-link");
    const hero=document.querySelector("#home-hero-slider .carousel-item.active .hero-section, .destination-hero, .page-content .hero-section");
    const heroStyles=hero?getComputedStyle(hero):null;
    const navStyles=navLink?getComputedStyle(navLink):null;
    return {
      navDecoration:navStyles?.textDecorationLine,
      navColor:navStyles?.color,
      navHeight:Math.round(navbar?.getBoundingClientRect().height||0),
      heroHeight:Math.round(hero?.getBoundingClientRect().height||0),
      heroBackground:heroStyles?.backgroundImage,
      fontFamily:getComputedStyle(document.body).fontFamily,
      horizontalOverflow:document.documentElement.scrollWidth>window.innerWidth+3
    };
  });
}
(async()=>{
  await fs.mkdir(output,{recursive:true});
  const browser=await chromium.launch({headless:true});
  const summary=[];
  let failed=0;
  try {
    for(const viewport of viewports){
      for(const route of pages){
        const each={page:route.name,viewport:viewport.name};
        for(const [kind,base] of [["legacy",legacy],["react",staging]]){
          const context=await browser.newContext({viewport:{width:viewport.width,height:viewport.height},deviceScaleFactor:1,reducedMotion:"reduce",ignoreHTTPSErrors:true});
          const tab=await context.newPage();
          try{
            const response=await tab.goto(base+route.url,{waitUntil:"domcontentloaded",timeout:30000});
            assert(response?.status()===200,kind+" "+route.name+" returned "+response?.status());
            await tab.locator(".navbar.fixed-top").waitFor();
            await tab.evaluate(()=>document.fonts.ready);
            await tab.waitForTimeout(800);
            const results=await metrics(tab);
            each[kind]=results;
            await tab.screenshot({path:path.join(output,route.name+"-"+viewport.name+"-"+kind+".png"),animations:"disabled",fullPage:true});
            assert(results.navDecoration==="none",kind+" "+route.name+" nav links are underlined: "+results.navDecoration);
            assert(!results.horizontalOverflow,kind+" "+route.name+" overflows horizontally");
            if(viewport.name==="desktop"&&route.name==="home"){
              for(const label of ["Programs","Destinations"]){
                const navItem=tab.locator(".navbar .nav-item.dropdown").filter({has:tab.locator(".dropdown-toggle",{hasText:label})});
                await navItem.hover();
                await tab.waitForTimeout(320);
                const visible=await navItem.locator(".dropdown-menu").isVisible();
                const hasShow=await navItem.locator(".dropdown-menu").evaluate(x=>x.classList.contains("show"));
                assert(visible&&hasShow,kind+" hover did not open "+label+" menu");
                await tab.locator(".page-content").hover({position:{x:12,y:15}});
                await tab.waitForTimeout(450);
              }
            }
          }catch(err){each[kind+"Error"]=String(err);failed++;console.error("FAIL",kind,route.name,viewport.name,String(err));}
          finally{await context.close();}
        }
        if(each.legacy&&each.react){
          for(const key of ["navHeight","heroHeight"]){
            if(Math.abs(each.legacy[key]-each.react[key])>6){failed++;console.error("FAIL",route.name,viewport.name,key,each.legacy[key],each.react[key]);}
          }
          // Every canonical banner should use the same source image as the PHP original.
          const normalize=(v)=>String(v||"").replace(/https?:\/\/[^/]+/g,"");
          if(normalize(each.legacy.heroBackground)!==normalize(each.react.heroBackground)) {
            failed++;console.error("FAIL banner image mismatch",route.name,viewport.name,each.legacy.heroBackground,each.react.heroBackground);
          }
        }
        summary.push(each);
      }
    }
  }finally{await browser.close();}
  await fs.writeFile(path.join(output,"metrics.json"),JSON.stringify(summary,null,2));
  if(failed){console.error("Visual parity checks failed:",failed);process.exitCode=1;}
  else console.log("Visual parity checks passed. Screenshot pairs:",summary.length);
})().catch(e=>{console.error(e);process.exitCode=1;});
