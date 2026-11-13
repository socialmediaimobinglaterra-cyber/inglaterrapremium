import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as policy from "../lib/blob-policy";
const url="https://fixture.private.blob.vercel-storage.com/home-banners/image.webp";
function harness(active=false, role:string|null=null, type="image/webp", dbFails=false) {
  let gets=0,auth=0;
  const mod={exports:{} as any};
  vm.runInNewContext(ts.transpileModule(readFileSync("app/api/blob-image/route.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{
    module:mod,exports:mod.exports,process:{env:{BLOB_READ_WRITE_TOKEN:"synthetic"}},console:{error(){}},
    require(name:string){
      if(name==="next/server") return {NextResponse:Response};
      if(name==="@/lib/runtime-policy") return {productionEffectsAllowed:()=>true};
      if(name==="@/lib/blob-policy") return policy;
      if(name==="@/lib/db") return {getPool:()=>({query:async(sql:string,args:string[])=>{assert.match(sql,/imagem = \$1 and ativo = true/);assert.equal(args[0],url);if(dbFails)throw new Error("private details");return {rows:active?[{}]:[]};}})};
      if(name==="@/lib/admin/auth") return {getCurrentAdminUser:async()=>{auth++;return role?{role}:null;}};
      if(name==="@vercel/blob") return {get:async()=>{gets++;return {statusCode:200,stream:"synthetic bytes",blob:{contentType:type}};}};
      throw new Error(name);
    },
  });
  return {setActive:(value:boolean)=>{active=value;},run:(value=url)=>mod.exports.GET({nextUrl:new URL(`https://example.invalid/api/blob-image?url=${encodeURIComponent(value)}`)}),gets:()=>gets,auth:()=>auth};
}
test("active public banners preserve original URL and bytes without session or public caching",async()=>{
 const h=harness(true);const r=await h.run();assert.equal(r.status,200);assert.equal(await r.text(),"synthetic bytes");assert.equal(h.auth(),0);assert.equal(h.gets(),1);assert.match(r.headers.get("cache-control")!,/no-store/);assert.equal(r.headers.get("content-disposition"),"inline");
});
test("inactive/unregistered blobs deny anonymous visitors before storage, including guessed URLs",async()=>{
 for(const role of [null,"visitor"]){const h=harness(false,role);assert.equal((await h.run()).status,404);assert.equal(h.gets(),0);}
});
test("authenticated editors retain inactive image and file downloads with safe content handling",async()=>{
 for(const type of ["image/webp","application/pdf","text/html","image/svg+xml"]){const h=harness(false,"editor",type);const r=await h.run();assert.equal(r.status,200);assert.equal(r.headers.get("content-disposition"),type==="image/webp"?"inline":"attachment");assert.equal(r.headers.get("x-content-type-options"),"nosniff");}
});
test("Blob rejects foreign origins, credentials, query tricks and storage lookup failures safely",async()=>{
 for(const value of ["https://evil.invalid/file",url+"?x=1",url+"#x",url.replace("https://","https://user:pass@"),url.replace(".com/",".com:444/"),"http://127.0.0.1/file"]){const h=harness();assert.equal((await h.run(value)).status,400);assert.equal(h.gets(),0);}
 const h=harness(true,null,"image/webp",true);const r=await h.run();assert.equal(r.status,502);assert.equal(h.gets(),0);assert(!((await r.text()).includes("private details")));
});

test("each Blob request rechecks publication instead of reusing authorization",async()=>{
 const h=harness(true);assert.equal((await h.run()).status,200);h.setActive(false);assert.equal((await h.run()).status,404);assert.equal(h.gets(),1);
});
