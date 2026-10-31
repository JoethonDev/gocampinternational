import test from "node:test";import assert from "node:assert/strict";import {makeSeed,q} from "../scripts/make-d1-seed.mjs";
test("escapes SQL safely",()=>assert.equal(q("O'Reilly"),"'O''Reilly'"));
test("seed retains payload, ignores duplicate entries and maps relations",()=>{
 const h=x=>({sha256:"hash-"+x,data:x});
 const m={source_commit:"test",catalogs:{
  all_programs:{sha256:"x",data:{p1:{id:"p1",name:"Test 'Program'",status:"active",category_slug:"a",extra:{unmapped:123}}}},
  destinations:{sha256:"x",data:{uk:{slug:"uk",name:"UK",status:"active",program_ids:["p1","absent"]}}},
  programs:{sha256:"x",data:{a:{slug:"a",name:"A",status:"active"}}},
  site_settings:{sha256:"x",data:{section_visibility:{}}},camp_memories:{sha256:"x",data:{items:[]}},faq:{sha256:"x",data:[]}
 }};
 const {sql,stats}=makeSeed(m);
 assert.equal(stats.program,1);assert.equal(stats.links,1);assert.deepEqual(stats.unresolvedLinks,["uk:absent"]);
 assert.match(sql,/Test ''Program''/);assert.match(sql,/unmapped/);assert.match(sql,/INSERT OR IGNORE/);
});
