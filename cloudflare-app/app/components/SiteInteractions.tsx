import { useEffect } from "react";
import { useLocation } from "react-router";
type Bootstrap = { Collapse?: {getOrCreateInstance:(el:Element)=>{hide:()=>void}}; Dropdown?:{getOrCreateInstance:(el:Element)=>{show:()=>void;hide:()=>void}}; Modal?:{getOrCreateInstance:(el:Element)=>{show:()=>void}} };
const bootstrap=()=> (window as Window & {bootstrap?:Bootstrap}).bootstrap;
export function SiteInteractions() {
  const {pathname}=useLocation();
  useEffect(()=>{
    const nav=document.querySelector<HTMLElement>(".navbar.fixed-top");
    const top=document.getElementById("backToTop");
    function onScroll() { nav?.classList.toggle("scrolled",window.scrollY>8);nav?.classList.toggle("navbar-scrolled",window.scrollY>100);top?.classList.toggle("show",window.scrollY>600); }
    window.addEventListener("scroll",onScroll,{passive:true});onScroll();
    const current=pathname.replace(/\/+$/,"")||"/";
    const links=Array.from(document.querySelectorAll<HTMLAnchorElement>(".navbar .nav-link"));
    links.forEach(link=>{const href=(link.getAttribute("href")||"").replace(/\/+$/,"")||"/";link.classList.toggle("active",href!=="#"&&href===current);});
    // Bootstrap owns click toggling; stop fallback "#" navigation when its JS is late.
    const preventHashJump=(event:MouseEvent)=>{const anchor=(event.target as Element).closest<HTMLAnchorElement>("a.dropdown-toggle[href='#']");if(anchor)event.preventDefault();};
    nav?.addEventListener("click",preventHashJump);
    const toggler=nav?.querySelector<HTMLElement>(".navbar-toggler");
    const collapse=nav?.querySelector<HTMLElement>(".navbar-collapse");
    function closeMobile(){ if(window.innerWidth>=1200||!collapse?.classList.contains("show"))return;const api=bootstrap()?.Collapse?.getOrCreateInstance(collapse);if(api)api.hide();else toggler?.click(); }
    function onClickOutside(e:MouseEvent){if(collapse?.classList.contains("show")&&nav&&!nav.contains(e.target as Node))closeMobile();}
    function onNavLink(e:Event){const a=(e.target as Element).closest("a");if(a&&!a.classList.contains("dropdown-toggle"))closeMobile();}
    document.addEventListener("click",onClickOutside);
    collapse?.addEventListener("click",onNavLink);
    const dropdowns=Array.from(document.querySelectorAll<HTMLElement>(".navbar .nav-item.dropdown"));
    const cleanups:Array<()=>void>=[];
    for(const item of dropdowns){
      const toggle=item.querySelector<HTMLElement>(".dropdown-toggle");
      let delay:ReturnType<typeof setTimeout>|undefined;
      const open=()=>{if(window.innerWidth<1200||!toggle)return;if(delay)clearTimeout(delay);bootstrap()?.Dropdown?.getOrCreateInstance(toggle).show();};
      const leave=()=>{if(window.innerWidth<1200||!toggle)return;delay=setTimeout(()=>bootstrap()?.Dropdown?.getOrCreateInstance(toggle).hide(),300);};
      item.addEventListener("mouseenter",open);item.addEventListener("mouseleave",leave);
      cleanups.push(()=>{item.removeEventListener("mouseenter",open);item.removeEventListener("mouseleave",leave);if(delay)clearTimeout(delay);});
    }
    const onResize=()=>{if(window.innerWidth>=1200)return;for(const item of dropdowns){const toggle=item.querySelector<HTMLElement>(".dropdown-toggle");if(toggle)bootstrap()?.Dropdown?.getOrCreateInstance(toggle).hide();}};
    window.addEventListener("resize",onResize);
    return ()=>{window.removeEventListener("scroll",onScroll);nav?.removeEventListener("click",preventHashJump);document.removeEventListener("click",onClickOutside);collapse?.removeEventListener("click",onNavLink);window.removeEventListener("resize",onResize);cleanups.forEach(fn=>fn());};
  },[pathname]);
  useEffect(()=>{
    function lightbox(e:MouseEvent) {
      const target=e.target as HTMLElement|null;
      if(!target)return;
      const link=target.closest<HTMLAnchorElement>('a[data-toggle="lightbox"]');
      const gallery=target.closest<HTMLImageElement>("#destination-gallery img");
      if(!link&&!gallery)return;
      if(link)e.preventDefault();
      const el=document.getElementById("imgLightbox");
      const img=document.getElementById("imgLightboxImg") as HTMLImageElement|null;
      const src=link?.getAttribute("href")||gallery?.currentSrc||gallery?.src;
      if(!img||!el||!src)return;
      img.src=src;img.alt=link?.querySelector("img")?.getAttribute("alt")||gallery?.alt||"Gallery image";
      if(bootstrap()?.Modal?.getOrCreateInstance)bootstrap()!.Modal!.getOrCreateInstance(el).show();
      else window.open(src,"_blank","noopener");
    }
    document.addEventListener("click",lightbox);
    return ()=>document.removeEventListener("click",lightbox);
  },[]);
  return <>
    <div className="modal fade" id="imgLightbox" tabIndex={-1} aria-hidden="true"><div className="modal-dialog modal-dialog-centered modal-lg"><div className="modal-content bg-transparent border-0 shadow-none"><button type="button" className="btn-close btn-close-white ms-auto mb-2" data-bs-dismiss="modal" aria-label="Close"/><img id="imgLightboxImg" src="" alt="" className="img-fluid rounded-3 shadow-lg w-100" style={{maxHeight:"80vh",objectFit:"contain",background:"#000"}}/></div></div></div>
    <button id="backToTop" type="button" aria-label="Back to top" onClick={()=>window.scrollTo({top:0,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"})}><i className="bi bi-arrow-up" aria-hidden="true"/></button>
  </>;
}
