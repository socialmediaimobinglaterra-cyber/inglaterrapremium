import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import * as inquiry from "../lib/property-inquiry";
import { contactSettings } from "../lib/contact-settings";

const input = { name: "Cliente teste", email: "Teste@Example.com", phone: "(43) 99999-0000", message: "Quero visitar", slug: "ap123", foco: "locacao", consent: true };
test("property inquiry validates explicit consent, email, phone and property", () => {
  const lead = inquiry.parsePropertyInquiry(input);
  assert.equal(lead.email,"teste@example.com");
  assert.equal(lead.phone,"+5543999990000");
  for (const patch of [{consent:false},{email:""},{email:"invalid"},{phone:"123"},{name:" "},{slug:"../private"},{message:"x".repeat(2001)}]) {
    assert.throws(()=>inquiry.parsePropertyInquiry({...input,...patch}));
  }
  const payload = inquiry.propertyInquiryPayload(lead,{codigo:"AP123",slug:"ap123",titulo:"Titulo real"});
  assert.equal(payload.payload.conversion_identifier,"inglaterra-premium-contato-imovel");
  assert(payload.payload.tags.includes("imovel:AP123"));
  assert(payload.payload.tags.includes("finalidade:locacao"));
  assert.equal(payload.payload.legal_bases[0].status,"granted");
});

function harness(configured = true, exists = true, status = 200) {
  const calls: any[] = [];
  const mod = { exports: {} as any };
  vm.runInNewContext(ts.transpileModule(readFileSync("app/api/imoveis/contato/route.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText,{
    module:mod,exports:mod.exports,Buffer,URL,SyntaxError,Error,console:{error(){}},
    process:{env:configured ? {RD_STATION_API_KEY:"test",DATABASE_URL:"test"} : {}},
    require(name:string) {
      if(name==="next/server") return {NextResponse:{json:Response.json}};
      if(name==="@/lib/property-inquiry") return inquiry;
      if(name==="@/lib/queries/imoveis") return {getImovelBySlug:async(slug:string)=>exists ? {id:"real-id",codigo:"AP123",slug,titulo:"Titulo real"}:null};
      if(name==="@/lib/rd-contact-store") return {deliverRdContact:async(_request:Request,submission:unknown)=>{calls.push(submission);return {status,message:"test"};}};
      throw new Error(`Unexpected integration: ${name}`);
    },
  });
  return {calls, run:(body:unknown,headers:Record<string,string>={})=>mod.exports.POST(new Request("https://example.com/api/imoveis/contato",{
    method:"POST",headers:{origin:"https://example.com","content-type":"application/json",...headers},body:JSON.stringify(body),
  })) as Promise<Response>};
}
test("inquiry endpoint uses RD-only submission with server property identity",async()=>{
  const h=harness();
  const result=await h.run({...input,codigo:"fake",titulo:"fake",destination:"central"});
  assert.equal(result.status,200);
  assert.equal((await result.json()).ok,true);
  assert.equal(h.calls.length,1);
  assert(h.calls[0].fingerprint.includes("real-id"));
  assert(!JSON.stringify(h.calls[0]).includes("fake"));
  assert(!JSON.stringify(h.calls[0]).includes("central"));
  assert.equal((await harness(false).run(input)).status,503);
  assert.equal((await harness(true,false).run(input)).status,404);
  assert.equal((await harness().run({...input,consent:false})).status,400);
  assert.equal((await harness().run(input,{origin:"https://other.example"})).status,403);
  assert.equal((await harness().run(input,{"content-type":"text/plain"})).status,415);
  assert.equal((await harness().run({...input,message:"x".repeat(12289)})).status,413);
  assert.equal((await (await harness(true,true,202).run(input)).json()).ok,false);
});

test("shared official destinations and phone remain centralized",()=>{
  assert.equal(contactSettings.phoneHref,"tel:+554333433010");
  assert.equal(contactSettings.phone,"(43) 3343-3010");
  assert.equal(contactSettings.appraisal,"https://marketing.imobiliariainglaterra.com.br/landing-page-de-captacao-de-proprietarios");
  assert.equal(contactSettings.careers,"https://core.imobiliariainglaterra.com.br/trabalhe-conosco");
  const home=readFileSync("app/page.tsx","utf8");
  assert.match(home,/label="Solicitar Avaliação Gratuita" href=\{contactSettings.appraisal\}/);
  assert.match(home,/label="Quero me candidatar" href=\{contactSettings.careers\}/);
  assert.match(home,/<NewsletterForm \/>/);
  for(const file of ["app/contato/page.tsx","components/layout/Footer.tsx","app/imoveis/[slug]/page.tsx"]) {
    const code=readFileSync(file,"utf8");
    assert.match(code,/contactSettings.phoneHref/);
    assert.match(code,/contactSettings.phone\}/);
    assert.doesNotMatch(code,/\{corretor.telefone \|\|/);
  }
});
