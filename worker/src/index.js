import postgres from "postgres";
import { dispatch, response } from "./core.js";

export default {
  async fetch(request,env,ctx){
    // No CORS; only a PHP server with a secret may call protected endpoints.
    if(!env.GOCAMP_ENV||!['staging','production'].includes(env.GOCAMP_ENV)||!env.HYPERDRIVE)
      return response({error:'Gateway configuration incomplete'},503);
    let sql;
    try{
      // Hyperdrive owns the origin connection pool, avoiding Aiven's 20-connection limit for each PHP request.
      sql=postgres(env.HYPERDRIVE.connectionString,{max:1,fetch_types:false,prepare:true});
      return await dispatch(request,env,sql);
    }catch(e){
      const status=e.httpStatus||503;
      if(status>=500)console.error('Catalog API failure',e.message);
      return response({error:status>=500?'Catalog service unavailable':e.message},status);
    }finally{if(sql)ctx.waitUntil(sql.end({timeout:1}));}
  }
};