import {useRef,useState} from "react";
import {SafeRichText} from "./SafeRichText";
export function RichTextInput({name,label,initial,externalValue,onChange}:{name?:string;label:string;initial?:string;externalValue?:string;onChange?:(value:string)=>void}){
  const [local,setLocal]=useState(initial||"");
  const [preview,setPreview]=useState(false),textarea=useRef<HTMLTextAreaElement>(null);
  const html=externalValue??local;
  const setHtml=(next:string)=>{if(externalValue===undefined)setLocal(next);onChange?.(next);};
  const wrap=(a:string,b:string)=>{
    const element=textarea.current;
    const start=element?.selectionStart??html.length,end=element?.selectionEnd??start;
    const chosen=html.slice(start,end);
    const next=html.slice(0,start)+a+chosen+b+html.slice(end);
    setHtml(next);
    requestAnimationFrame(()=>{element?.focus();element?.setSelectionRange(start+a.length,start+a.length+chosen.length);});
  };
  return <div className="col-12">
    <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2"><label className="form-label mb-0 fw-semibold" htmlFor={"rich-"+(name||label)}>{label}</label>
      <button className="btn btn-sm btn-outline-secondary" type="button" onClick={()=>setPreview(v=>!v)}>{preview?"Edit source":"Preview formatted text"}</button></div>
    {preview?<div className="border rounded-3 p-3 bg-white" style={{minHeight:120}}><SafeRichText html={html}/></div>:
      <><div className="d-flex flex-wrap gap-2 mb-2" role="toolbar" aria-label={label+" formatting"}>
        <button className="btn btn-sm btn-outline-secondary" type="button" onClick={()=>wrap("<strong>","</strong>")}>Bold</button>
        <button className="btn btn-sm btn-outline-secondary" type="button" onClick={()=>wrap("<em>","</em>")}>Italic</button>
        <button className="btn btn-sm btn-outline-secondary" type="button" onClick={()=>wrap("<p>","</p>")}>Paragraph</button>
        <button className="btn btn-sm btn-outline-secondary" type="button" onClick={()=>wrap("<ul><li>","</li></ul>")}>Bullets</button>
      </div><textarea ref={textarea} id={"rich-"+(name||label)} name={name} rows={8} className="form-control font-monospace" value={html} onChange={e=>setHtml(e.target.value)}/></>}
    {preview&&name&&<input type="hidden" name={name} value={html}/>}
    <p className="small text-secondary mt-1 mb-0">Preview uses the same safe HTML renderer as the public site. Formatting preserves the underlying source.</p>
  </div>;
}
