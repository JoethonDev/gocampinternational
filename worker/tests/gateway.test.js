import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {dispatch,readCatalog,saveCatalog,applyCatalog} from '../src/core.js';
const env={API_TOKEN:'test-local-only',GOCAMP_ENV:'staging'};
function request(path,method='GET',body=null,token='test-local-only',environment='staging'){
 const headers={'authorization':'Bearer '+token,'x-gocamp-environment':environment};
 if(body!==null)headers['content-type']='application/json';
 return new Request('https://test.example'+path,{method,headers,body:body!==null?JSON.stringify(body):null});
}
function mockDb(){
 const writes=[];let revision=0;
 const sql={async unsafe(query,params=[]){
  writes.push({query,params});
  if(query.includes('SELECT revision FROM catalog_revisions'))return [{revision}];
  if(query.includes('UPDATE catalog_revisions'))return [{revision:++revision}];
  if(query.includes('FROM global_faqs'))return [{question:'Q',answer:'A'}];
  if(query.includes('FROM media_assets WHERE object_key'))return [{content_type:'image/webp',sha256:'0'.repeat(64)}];
  if(query.includes('FROM media_assets WHERE public_path'))return [{original_name:'test.webp'}];
  if(query.includes('FROM media_assets ORDER'))return [];
  if(query.includes('FROM media_assets WHERE legacy_path'))return [];
  if(query.includes('SELECT')&&query.includes('FROM site_settings'))return [];
  if(query.includes('SELECT')&&query.includes('FROM catalog_items'))return [];
  if(query.includes('SELECT')&&query.includes('FROM program_categories'))return [];
  if(query.includes('SELECT')&&query.includes('FROM programs'))return [];
  if(query.includes('SELECT')&&query.includes('FROM destinations'))return [];
  if(query.includes('SELECT')&&query.includes('FROM destination_programs'))return [];
  return [];
 },async begin(callback){return callback(this)}};
 return {sql,writes};
}
test('authentication is required',async()=>{
 const {sql}=mockDb();
 await assert.rejects(()=>dispatch(request('/v1/catalog/faq','GET',null,'invalid'),env,sql),{httpStatus:401});
 await assert.rejects(()=>dispatch(request('/v1/catalog/faq','GET',null,'test-local-only','production'),env,sql),{httpStatus:403});
});
test('public health returns no catalog',async()=>{
 const {sql}=mockDb();const r=await dispatch(new Request('https://test.example/health'),env,sql);
 assert.equal((await r.json()).environment,'staging');
});
test('normalized catalog response and revision',async()=>{
 const {sql}=mockDb();const r=await dispatch(request('/v1/catalog/faq'),env,sql);
 assert.deepEqual(await r.json(),{data:[{question:'Q',answer:'A'}],revision:0});
});
test('complete FAQ write uses transaction and revision guard',async()=>{
 const {sql,writes}=mockDb();
 const response=await dispatch(request('/v1/catalog/faq','PUT',{revision:0,data:[{question:'New',answer:'Yes'}]}),env,sql);
 assert.equal((await response.json()).revision,1);
 assert.equal(writes.some(x=>x.query.startsWith('DELETE FROM global_faqs')),true);
 await assert.rejects(()=>dispatch(request('/v1/catalog/faq','PUT',{revision:0,data:[]}),env,sql),{httpStatus:409});
});
test('media metadata is validated and cannot contain arbitrary object path',async()=>{
 const {sql,writes}=mockDb();
 const sample={object_key:'images/ab/'+'1'.repeat(64)+'-12345678.webp',content_type:'image/webp',original_name:'image.webp',bytes:50,sha256:'1'.repeat(64),width:100,height:100};
 await dispatch(request('/v1/media','POST',sample),env,sql);
 assert(writes.some(x=>x.query.includes('INSERT INTO media_assets')));
 await assert.rejects(()=>dispatch(request('/v1/media','POST',{...sample,object_key:'../../something'}),env,sql),{httpStatus:400});
});
test('missing methods and unknown catalog operations are not exposed',async()=>{
 const {sql}=mockDb();
 await assert.rejects(()=>dispatch(request('/v1/sql','POST',{query:'DROP TABLE programs'}),env,sql),{httpStatus:404});
});