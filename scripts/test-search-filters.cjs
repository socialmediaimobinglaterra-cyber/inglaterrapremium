const assert = require('node:assert/strict');
const { readFileSync, readdirSync } = require('node:fs');
const { createServer } = require('node:http');
const { tmpdir } = require('node:os');
const { join } = require('node:path');
const esbuild = require('esbuild');

async function main() {
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const bundle = await esbuild.build({
    stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
      import {BuscaImoveisClient} from './components/search/BuscaImoveisClient';
      createRoot(document.getElementById('root')).render(<BuscaImoveisClient bairros={['Gleba Palhano','Terra Bonita']} tipos={['Apartamento','Casa']}
        initialSearchPage={{imoveis:[],total:0,page:1,perPage:24,hasMore:false}}/>);`,resolveDir:process.cwd(),loader:'tsx'},
    bundle:true,write:false,format:'iife',jsx:'automatic',
    plugins:[{name:'next-stubs',setup(build){
      build.onResolve({filter:/^(next\/image|next\/link|@\/lib\/images)$/},args=>({path:args.path,namespace:'stub'}));
      build.onLoad({filter:/.*/,namespace:'stub'},args=>({loader:'jsx',resolveDir:process.cwd(),contents:args.path==='@/lib/images'
        ? 'export const imageUrlOrFallback = value => value || "";'
        : `import React from 'react'; export default function Stub(props){return React.createElement('${args.path==='next/link'?'a':'img'}',props);}`}));
    }}],
  });
  const css=readdirSync('.next/static/css').filter(f=>f.endsWith('.css')).map(f=>readFileSync(join('.next/static/css',f),'utf8')).join('\n');
  const font=readdirSync('.next/static/media').find(f=>f.endsWith('.p.woff2'));
  const server=createServer((req,res)=>{
    if(req.url==='/bundle.js'){res.setHeader('Content-Type','application/javascript');res.end(bundle.outputFiles[0].text);}
    else if(req.url==='/font.woff2'){res.setHeader('Content-Type','font/woff2');res.end(readFileSync(join('.next/static/media',font)));}
    else {res.setHeader('Content-Type','text/html');res.end(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}\n@font-face{font-family:DM;src:url('/font.woff2');font-weight:100 900}body{font-family:DM,sans-serif}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>`);}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser=await chromium.launch({channel:'msedge',headless:true});
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    const searches=[], aiStates=[], errors=[];
    page.on('pageerror',error=>errors.push(error.message));
    let failSearch=false, failAi=false;
    await page.route('**/api/imoveis/search',async route=>{
      const body=route.request().postDataJSON();searches.push(body);
      await new Promise(resolve=>setTimeout(resolve,150));
      await route.fulfill({json:{ok:!failSearch,imoveis:[],total:28,page:body.page,hasMore:body.page===1}});
    });
    await page.route('**/api/imoveis/ai',async route=>{
      const {query,state}=route.request().postDataJSON();aiStates.push(state);
      await new Promise(resolve=>setTimeout(resolve,700));
      const filters=query==='remover bairro'?{...state,bairro:null}:query==='limpar tudo'?{negocio:'Comprar'}:{...state,valorMinimo:1000000,valorMaximo:2500000,suitesMinimas:3,vagasMinimas:4,quartosMinimos:4,areaMinima:180,areaMaxima:400};
      await route.fulfill({json:failAi?{ok:false,message:'Indisponível; filtros mantidos.'}:{ok:true,filters,naoInterpretado:[]}});
    });
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    const input=page.getByRole('textbox',{name:'Busca inteligente de imóveis'});
    const waitIdle=()=>page.waitForFunction(()=>!document.querySelector('fieldset').disabled && !document.querySelector('#ordenar-imoveis').disabled);
    async function manual(label,value){const response=page.waitForResponse('**/api/imoveis/search');await page.getByRole('combobox',{name:label,exact:true}).selectOption(value);await response;await waitIdle();}
    async function ai(query){await input.fill(query);await page.getByRole('button',{name:'Perguntar'}).click();await page.waitForFunction(()=>document.querySelector('fieldset').disabled);assert(await page.getByRole('combobox',{name:'Ordenar por'}).isDisabled());await waitIdle();}
    await manual('Tipo','Apartamento');await manual('Localização','Gleba Palhano');
    await ai('com 3 suites, 4 vagas e faixa de area e valor');
    assert.equal(aiStates[0].tipo,'Apartamento');assert.equal(aiStates[0].bairro,'Gleba Palhano');
    assert.equal(await page.getByRole('combobox',{name:'Suítes',exact:true}).inputValue(),'3+ suítes');
    await manual('Tipo','Casa');
    const afterManual=searches.at(-1);
    for(const [key,value] of Object.entries({bairro:'Gleba Palhano',valorMinimo:1000000,valorMaximo:2500000,suitesMinimas:3,vagasMinimas:4,quartosMinimos:4,areaMinima:180,areaMaxima:400}))assert.equal(afterManual[key],value);
    await ai('remover bairro');assert.equal(aiStates.at(-1).tipo,'Casa');
    assert.equal(await page.getByRole('combobox',{name:'Localização',exact:true}).inputValue(),'Todos os bairros');
    await manual('Ordenar por','menor_valor');
    const nextPage=page.waitForResponse('**/api/imoveis/search');await page.getByRole('button',{name:'Carregar mais imóveis'}).click();await nextPage;await waitIdle();
    assert.equal(searches.at(-1).page,2);assert.equal(searches.at(-1).order,'menor_valor');assert.equal(searches.at(-1).vagasMinimas,4);assert.equal(searches.at(-1).areaMaxima,400);
    failSearch=true;await manual('Tipo','Apartamento');assert.equal(await page.getByRole('combobox',{name:'Tipo',exact:true}).inputValue(),'Casa');failSearch=false;
    failAi=true;await ai('qualquer frase');assert.equal(await page.getByRole('combobox',{name:'Tipo',exact:true}).inputValue(),'Casa');failAi=false;
    for(const width of [1440,1280,1024,390]) {
      await page.setViewportSize({width,height:1000});
      const bar=page.locator('fieldset');
      const boxes=await bar.evaluate(el=>[...el.children].map(c=>{const r=c.getBoundingClientRect();return {y:r.y+r.height/2};}));
      assert(Math.max(...boxes.map(b=>b.y))-Math.min(...boxes.map(b=>b.y))<2,'all controls must share the same row');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page must not overflow');
      if(width>=1280)assert(await bar.evaluate(el=>el.scrollWidth<=el.clientWidth+1),'desktop controls must fit');
      await page.screenshot({path:join(tmpdir(),`premium-filters-${width}.png`),fullPage:true});
    }
    await ai('limpar tudo');assert.equal(await page.getByRole('combobox',{name:'Tipo',exact:true}).inputValue(),'Todos os tipos');
    assert.equal(searches.at(-1).areaMaxima,undefined);
    assert.deepEqual(errors,[]);
    console.log('PASS: single-row layout 1440/1280/1024/390; manual -> AI -> manual; removal/reset; sorting/pagination; busy locks; API failure preserves filters (mock APIs).');
  } finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
