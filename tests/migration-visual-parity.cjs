/* Capture original PHP and staging React at identical viewports, and verify
 * computed nav/hero behavior. Run from repository root in GitHub Actions. */
const {chromium}=require("playwright");
const fs=require("node:fs/promises"),path=require("node:path");
const legacy=process.env.LEGACY_URL||"http://127.0.0.1:8765";
const staging=process.env.STAGING_URL||"https://gocamp-migration-staging.elprincedoca.workers.dev";
const viewports=[{name:"desktop",width:1440,height:900},{name:"tablet",width:820,height:1180},{name:"mobile",width:390,height:844}];
const pages=[{name:"home",url:"/",memories:true},{name:"destination-italy",url:"/destinations/italy",memories:true},{name:"category-academic",url:"/program/category?category=adult-academic",memories:true},{name:"category-kids",url:"/program/category?category=kids-camps",memories:true},{name:"about",url:"/about",memories:false},{name:"faq",url:"/faq",memories:false},{name:"contact",url:"/contact",memories:false},{name:"landing",url:"/landing",memories:false}];
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
    const landingHero=document.querySelector(".hero-landing");
    const landingForm=document.querySelector("#landingPageForm");
    const landingFields=landingForm?Array.from(landingForm.querySelectorAll("[name]")).map(x=>x.getAttribute("name")).filter(x=>x!=="source").sort():[];
    const navStyles=navLink?getComputedStyle(navLink):null;
    return {
      navDecoration:navStyles?.textDecorationLine,
      landingHeroHeight:Math.round(landingHero?.getBoundingClientRect().height||0),
      landingFormWidth:Math.round(landingForm?.getBoundingClientRect().width||0),
      landingFields,
      navDecorations:Array.from(document.querySelectorAll(".navbar .nav-link")).map(link=>getComputedStyle(link).textDecorationLine),
      navColor:navStyles?.color,
      navHeight:Math.round(navbar?.getBoundingClientRect().height||0),
      heroHeight:Math.round(hero?.getBoundingClientRect().height||0),
      heroBackground:heroStyles?.backgroundImage,
      fontFamily:getComputedStyle(document.body).fontFamily,
      horizontalOverflow:document.documentElement.scrollWidth>window.innerWidth+3,
      documentHeight:document.documentElement.scrollHeight,
      // XFBML is an external iframe with nondeterministic load/height. Track
      // it explicitly so first-party layout is still tested at 16px tolerance.
      facebookEmbedHeight:Math.round(document.querySelector(".camp-memories .fb-page")?.getBoundingClientRect().height||0),
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
            if(route.name==="landing"){
              assert(results.landingHeroHeight>0,kind+" landing hero missing");
              assert(results.landingFormWidth>0,kind+" landing form missing");
              assert(results.landingFields.includes("privacyConsent") && results.landingFields.filter(n=>n==="interests[]").length===4,kind+" landing original form options missing");
            }
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
              if(kind==="react"){
                // Regression: click Programs (which retains keyboard focus), then
                // move directly to Destinations without visiting page content.
                // Previously CSS :focus-within kept Programs visible too.
                const programs=tab.locator("#programsDropdown");
                const destinations=tab.locator("#destinationsDropdown");
                await programs.click();
                assert(await tab.locator("#programsDropdown + .dropdown-menu").isVisible(),"React Programs menu did not open on click");
                await destinations.hover();
                await tab.waitForTimeout(250);
                assert(await tab.locator("#destinationsDropdown + .dropdown-menu").isVisible(),"React Destinations did not open on hover transition");
                assert(!(await tab.locator("#programsDropdown + .dropdown-menu").isVisible()),"React Programs remained open under Destinations");
                await tab.keyboard.press("Escape");
                await tab.waitForTimeout(220);
                assert(!(await tab.locator("#destinationsDropdown + .dropdown-menu").isVisible()),"React dropdown remained visible after Escape");
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
          const comparisonKeys=route.name==="landing"?["navHeight","landingHeroHeight","landingFormWidth"]:["navHeight","heroHeight","documentHeight","memoryCardCount"];
          for(const key of comparisonKeys){
            const tolerance=key==="documentHeight"?16:key==="memoryCardCount"?0:key==="landingHeroHeight"?32:key==="landingFormWidth"?12:6;
            // Below the desktop breakpoint the Facebook iframe is stacked in
            // document flow; its remote SDK can expand on one origin and fail
            // on the other. Compare the remaining first-party document height
            // strictly, rather than weakening the tolerance for the whole page.
            const normalizeFacebook=key==="documentHeight"&&route.memories&&viewport.width<992;
            const legacyValue=normalizeFacebook?each.legacy.documentHeight-each.legacy.facebookEmbedHeight:each.legacy[key];
            const reactValue=normalizeFacebook?each.react.documentHeight-each.react.facebookEmbedHeight:each.react[key];
            if(Math.abs(legacyValue-reactValue)>tolerance){
              failed++;console.error("FAIL",route.name,viewport.name,normalizeFacebook?"documentHeight excluding external Facebook embed":key,legacyValue,reactValue,
                normalizeFacebook?"raw heights "+each.legacy.documentHeight+"/"+each.react.documentHeight+" fb "+each.legacy.facebookEmbedHeight+"/"+each.react.facebookEmbedHeight:"");
            }
          }
          if(route.name==="landing" && JSON.stringify(each.legacy.landingFields)!==JSON.stringify(each.react.landingFields)){
            failed++;console.error("FAIL landing form field mapping",viewport.name,each.legacy.landingFields,each.react.landingFields);
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
      // Admin has no public navbar. The original site's body top padding used
      // to leave a white band and make the 100vh login background overflow.
      const adminContext=await browser.newContext({
        viewport:{width:viewport.width,height:viewport.height},
        deviceScaleFactor:1,reducedMotion:"reduce",ignoreHTTPSErrors:true
      });
      const adminTab=await adminContext.newPage();
      try {
        const response=await adminTab.goto(staging+"/admin/login",{waitUntil:"domcontentloaded",timeout:30000});
        assert(response?.status()===200,"React admin login returned "+response?.status());
        await adminTab.locator(".gc-admin-login").waitFor();
        await adminTab.evaluate(()=>document.fonts.ready);
        const layout=await adminTab.evaluate(()=>{
          const login=document.querySelector(".gc-admin-login");
          const rect=login.getBoundingClientRect();
          return {
            bodyPaddingTop:parseFloat(getComputedStyle(document.body).paddingTop),
            top:rect.top,
            height:rect.height,
            viewHeight:window.innerHeight,
            docHeight:document.documentElement.scrollHeight,
            gradient:getComputedStyle(login).backgroundImage
          };
        });
        assert(layout.bodyPaddingTop===0,"Admin login inherits public navbar padding: "+layout.bodyPaddingTop);
        assert(Math.abs(layout.top)<=1,"Admin login background starts below viewport: "+layout.top);
        assert(layout.height>=layout.viewHeight-1,"Admin login background does not fill viewport");
        assert(layout.docHeight<=layout.viewHeight+2,"Admin login unexpectedly scrolls: "+layout.docHeight+" > "+layout.viewHeight);
        assert(layout.gradient.includes("radial-gradient"),"Admin login gradient missing");
        await adminTab.screenshot({path:path.join(output,"admin-login-"+viewport.name+"-react.png"),animations:"disabled",fullPage:true});
      }catch(err){
        failed++;
        console.error("FAIL react admin-login",viewport.name,String(err));
      }finally{await adminContext.close();}
    }
  }finally{await browser.close();}
  await fs.writeFile(path.join(output,"metrics.json"),JSON.stringify(summary,null,2));
  if(failed){console.error("Visual parity checks failed:",failed);process.exitCode=1;}
  else console.log("Visual parity checks passed. Screenshot pairs:",summary.length);
})().catch(e=>{console.error(e);process.exitCode=1;});
