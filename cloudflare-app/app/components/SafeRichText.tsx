import { createElement, Fragment, type ReactNode } from "react";

/* PR40 CMS formatting: allow only structural text tags. Never run stored HTML. */
type Tag = "p"|"ul"|"ol"|"li"|"br"|"strong"|"em"|"a"|"b"|"i";
const allowed = new Set<Tag>(["p","ul","ol","li","br","strong","em","a","b","i"]);
const decode = (s:string) => s.replace(/&(#x[0-9a-f]+|#[0-9]+|amp|lt|gt|quot|apos|nbsp);/gi, (_m,code:string) => {
  const c=code.toLowerCase();
  if(c.startsWith("#")) {
    const hex=c.startsWith("#x"), n=parseInt(c.slice(hex?2:1),hex?16:10);
    return n>0&&n<=0x10ffff&&!(n>=0xd800&&n<=0xdfff)?String.fromCodePoint(n):"";
  }
  return ({amp:"&",lt:"<",gt:">",quot:'"',apos:"'",nbsp:"\u00a0"} as Record<string,string>)[c]||"";
});
const safeUrl=(attrs:string):string|undefined=>{
  const m=attrs.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
  if(!m)return;
  const url=decode(m[1]||m[2]||m[3]||"").trim();
  return /^(https?:\/\/|mailto:|\/[^/]|#)/i.test(url)?url:undefined;
};
type Frame={tag:Tag;key:number;href?:string;children:ReactNode[]};
export function renderSafeRichText(value:string):ReactNode {
  if(!value.includes("<"))return decode(value);
  const result:ReactNode[]=[],stack:Frame[]=[];
  let next=0;
  const append=(node:ReactNode)=>{(stack.length?stack[stack.length-1].children:result).push(node);};
  const element=(frame:Frame)=>createElement(frame.tag,frame.tag==="a"?{href:frame.href||"#",rel:"nofollow noopener noreferrer",key:frame.key}:{key:frame.key},...frame.children);
  const close=(tag:Tag)=>{
    let idx=-1;
    for(let i=stack.length-1;i>=0;i--){if(stack[i].tag===tag){idx=i;break;}}
    if(idx<0)return;
    while(stack.length>idx)append(element(stack.pop()!));
  };
  for(const token of (value.match(/<[^>]*>|[^<]+/g)||[]).slice(0,10000)){
    if(!token.startsWith("<")){append(decode(token));continue;}
    const match=token.match(/^<\s*(\/?)\s*([a-z][a-z0-9]*)\b([^>]*)>/i);
    if(!match)continue;
    const tag=match[2].toLowerCase() as Tag;
    if(!allowed.has(tag))continue;
    if(match[1]){close(tag);continue;}
    const frame:Frame={tag,key:next++,href:tag==="a"?safeUrl(match[3]):undefined,children:[]};
    if(tag==="br"||/\/\s*>$/.test(token))append(element(frame));else stack.push(frame);
  }
  while(stack.length)append(element(stack.pop()!));
  return createElement(Fragment,null,...result);
}
export function SafeRichText({html}:{html:string}){return <>{renderSafeRichText(html)}</>;}
