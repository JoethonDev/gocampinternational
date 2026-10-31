#!/usr/bin/env node
/** Convert PR #40 immutable PHP snapshot export to an idempotent D1 SQL seed.
 * No external packages or network. NEVER run against live production without review.
 */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export const q = v => v === null || v === undefined ? "NULL" : "'" + String(v).replaceAll("'","''") + "'";
export function makeSeed(snapshot) {
  const required = ["all_programs","destinations","programs","camp_memories","site_settings","faq"];
  for (const kind of required) if (!snapshot.catalogs?.[kind] || !snapshot.catalogs[kind].sha256) throw Error("Missing PR40 catalog: " + kind);
  const out = ["-- Immutable source commit "+snapshot.source_commit,"PRAGMA foreign_keys=ON;","BEGIN TRANSACTION;"];
  const stats = {program:0,destination:0,category:0,documents:0,links:0,unresolvedLinks:[]};
  for (const [source, kind] of [["all_programs","program"],["destinations","destination"],["programs","category"]]) {
    const records = snapshot.catalogs[source].data;
    for (const [key, record] of Object.entries(records)) {
      if (!record || typeof record !== "object" || Array.isArray(record)) throw Error("Malformed "+source+"/"+key);
      const slug = kind === "program" ? (record.id || key) : (record.slug || key);
      if (slug !== key) throw Error("Unexpected mismatched ID: "+key+"/"+slug);
      const order = Number(record.order ?? record.display_order);
      out.push("INSERT OR IGNORE INTO catalog_entities(kind,slug,name,status,category_slug,sort_order,content_json) VALUES ("+
        [q(kind),q(slug),q(record.name||""),q(record.status||"inactive"),q(kind==="program"?(record.category_slug||null):null),Number.isFinite(order)?Math.trunc(order):0,q(JSON.stringify(record))].join(",")+");");
      stats[kind]++;
    }
  }
  for(const source of ["site_settings","camp_memories","faq"]){
    out.push("INSERT OR IGNORE INTO site_documents(key,content_json) VALUES ("+q(source)+","+q(JSON.stringify(snapshot.catalogs[source].data))+");");
    stats.documents++;
  }
  const validDest = new Set(Object.keys(snapshot.catalogs.destinations.data));
  const validProgram = new Set(Object.keys(snapshot.catalogs.all_programs.data));
  for(const [slug,d] of Object.entries(snapshot.catalogs.destinations.data)){
    for(const [i,id] of (d.program_ids||[]).entries()){
      if(!validDest.has(slug)||!validProgram.has(id)){stats.unresolvedLinks.push(slug+":"+id);continue;}
      out.push("INSERT OR IGNORE INTO destination_programs(destination_slug,program_slug,position) VALUES ("+q(slug)+","+q(id)+","+i+");");
      stats.links++;
    }
  }
  for(const source of required){
    const file = ({all_programs:"data/legacy/all_programs.php",destinations:"data/legacy/destinations.php",programs:"data/legacy/programs.php",camp_memories:"data/legacy/camp_memories.php",site_settings:"data/legacy/site_settings.php",faq:"data/faq.json"})[source];
    out.push("INSERT OR IGNORE INTO import_sources(source_path,sha256) VALUES ("+q(file)+","+q(snapshot.catalogs[source].sha256)+");");
  }
  out.push("COMMIT;");
  return {sql:out.join("\n")+"\n",stats};
}
if(process.argv[1]&&import.meta.url===new URL("file://"+path.resolve(process.argv[1])).href){
  const input = process.argv[2] || "build/imports/legacy-pr40.json";
  const output = process.argv[3] || "build/imports/seed-pr40.sql";
  const snapshot = JSON.parse(await readFile(input,"utf8"));
  if(snapshot.source_commit!=="80432a2a6fcb4b0de6f14710748e53781ddef58c") throw Error("Refusing mismatched source commit");
  const {sql,stats} = makeSeed(snapshot);
  if(stats.program!==63||stats.destination!==9||stats.category!==8) throw Error("Entity count mismatch");
  await mkdir(path.dirname(output),{recursive:true}); await writeFile(output,sql);
  console.log(JSON.stringify({path:output,stats},null,2));
}
