/* Capture original PHP and staging React at identical viewports, and verify
 * computed nav/hero behavior. Run from repository root in GitHub Actions. */
const {chromium}=require("playwright");
const fs=require("node:fs/promises"),path=require("node:path");
const legacy=process.env.LEGACY_URL||"http://127.0.0.1:8765";
const staging=process.env.STAGING_URL||"https://gocamp-migration-staging.elprincedoca.workers.dev";
const viewports=[{name:"desktop",width:1440,height:900},{name:"tablet",width:820,height:1180},{name:"mobile",width:390,height:844}];
const pages=[{name:"home",url:"/",memories:true},{name:"destination-italy",url:"/destinations/italy",memories:true},{name:"category-academic",url:"/program/category?category=adult-academic",memories:true},{name:"category-kids",url:"/program/category?category=kids-camps",memories:true},{name:"about",url:"/about",memories:false},{name:"faq",url:"/faq",memories:false},{name:"contact",url:"/contact",memories:false}];
const output=path.resolve("artifacts/migration-parity");
async function requireMatchingStagingRevision(){
  const expected=process.env.GITHUB_SHA;
  if(!expected)return; // Optional local/manual run; CI always provides GITHUB_SHA.
  const url=staging.replace(/\/$/,"")+"/migration-commit.txt";
  const timeoutMs=180000,start=Date.now();
  let observed="unavailable";
  while(Date.now()-start<timeoutMs){
    try {
      const response=await fetch(url+"?r="+expected,{headers:{"Cache-Control":"no-cache"},signal:AbortSignal.timeout(10000)});
      if(response.ok){observed=(await response.text()).trim();if(observed===expected){console.log("Confirmed staging deploy revision:",observed);return;}}
    }catch(err){observed=String(err);}
    await new Promise(resolve=>setTimeout(resolve,5000));
  }
  throw new Error("Staging revision did not match GitHub SHA; visual comparison aborted to avoid cross-commit false positives. Expected "+expected+" but saw "+observed);
}

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
      navDecorations:Array.from(document.querySelectorAll(".navbar .nav-link")).map(link=>getComputedStyle(link).textDecorationLine),
      navColor:navStyles?.color,
      navHeight:Math.round(navbar?.getBoundingClientRect().height||0),
      heroHeight:Math.round(hero?.getBoundingClientRect().height||0),
      heroBackground:heroStyles?.backgroundImage,
      fontFamily:getComputedStyle(document.body).fontFamily,
      horizontalOverflow:document.documentElement.scrollWidth>window.innerWidth+3,
      documentHeight:document.documentElement.scrollHeight,
      memorySectionCount:document.querySelectorAll(".camp-memories").length,
      memoryCardCount:document.querySelectorAll(".camp-memories .camp-memory").length,
      bannerOverlay:hero?getComputedStyle(hero,"::before").backgroundImage:"none",
      staticBannerSrc:document.querySelector("#main-content > .container-fluid.p-0 img, #main-content .page-content > .container-fluid.p-0 img")?.getAttribute("src")||null
    };
  });
}
(async()=>{
  await fs.mkdir(output,{recursive:true});
  await requireMatchingStagingRevision();
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
            assert(results.navDecorations.every(decoration=>decoration==="none"),kind+" "+route.name+" contains underlined navigation links: "+results.navDecorations.join(","));
            assert(!results.horizontalOverflow,kind+" "+route.name+" overflows horizontally");
            if(route.memories){
              assert(results.memorySectionCount===1,kind+" "+route.name+" lost the shared memories section");
              assert(results.memoryCardCount>0,kind+" "+route.name+" has no memories cards");
            }
            if(route.name.startsWith("category-"))assert(results.bannerOverlay.includes("linear-gradient"),kind+" category banner lost the PR40 dark overlay");
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
            if(viewport.name==="mobile" && route.name==="home"){
              await tab.locator(".navbar-toggler").click();
              await tab.locator("#mainNavbar").waitFor({state:"visible"});
              await tab.locator("#programsDropdown").click();
              await tab.waitForTimeout(180);
              assert(await tab.locator("#programsDropdown + .dropdown-menu").isVisible(),kind+" mobile Programs dropdown does not open on tap");
            }
          }catch(err){each[kind+"Error"]=String(err);failed++;console.error("FAIL",kind,route.name,viewport.name,String(err));}
          finally{await context.close();}
        }
        if(each.legacy&&each.react){
          for(const key of ["navHeight","heroHeight","documentHeight","memoryCardCount"]){
            if(Math.abs(each.legacy[key]-each.react[key])>(key==="documentHeight"?16:key==="memoryCardCount"?0:6)){failed++;console.error("FAIL",route.name,viewport.name,key,each.legacy[key],each.react[key]);}
          }
          // Every canonical banner should use the same source image as the PHP original.
          const normalize=(v)=>String(v||"").replace(/https?:\/\/[^/]+/g,"");
          if(normalize(each.legacy.heroBackground)!==normalize(each.react.heroBackground)) {
            failed++;console.error("FAIL banner image mismatch",route.name,viewport.name,each.legacy.heroBackground,each.react.heroBackground);
          }
          if(each.legacy.staticBannerSrc!==each.react.staticBannerSrc){
            failed++;console.error("FAIL static banner image mismatch",route.name,viewport.name,each.legacy.staticBannerSrc,each.react.staticBannerSrc);
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
