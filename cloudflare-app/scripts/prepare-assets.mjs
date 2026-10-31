import { cp, mkdir, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const source=path.resolve(root,"..");
const targets={images:new Set([".png",".jpg",".jpeg",".webp",".avif",".gif",".svg",".ico"]),css:new Set([".css"]),js:new Set([".js"]),uploads:new Set([".png",".jpg",".jpeg",".webp",".avif",".gif",".svg"])};
async function copySafe(dir,from,to,allowed){
  for(const ent of await readdir(from,{withFileTypes:true})){
    if(ent.isSymbolicLink())continue;
    const origin=path.join(from,ent.name),dest=path.join(to,ent.name);
    if(ent.isDirectory()){await mkdir(dest,{recursive:true});await copySafe(dir,origin,dest,allowed);}
    else if(ent.isFile()&&allowed.has(path.extname(ent.name).toLowerCase())){await mkdir(path.dirname(dest),{recursive:true});await cp(origin,dest);}
  }
}
for(const [dir,allowed] of Object.entries(targets)) {
  const from=path.join(source,dir);try { if((await stat(from)).isDirectory()) await copySafe(dir,from,path.join(root,"public",dir),allowed); }catch(error){if(error.code!=="ENOENT") throw error;}
}
console.log("Prepared committed legacy public assets (no PHP copied).");
