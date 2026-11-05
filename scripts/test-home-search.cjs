const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { createServer } = require('node:http');

async function main() {
  const bundle = await require('esbuild').build({
    stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
      import {HomeHeroSearch} from './components/search/HomeHeroSearch';
      createRoot(document.getElementById('root')).render(<HomeHeroSearch filterOptions={{bairros:['Terra Bonita'],condominios:['Royal Park'],tipos:['Casa','Apartamento']}} />);`, loader:'tsx', resolveDir:process.cwd() },
    bundle:true, write:false, jsx:'automatic', format:'iife',
    plugins:[{name:'router',setup(build){
      build.onResolve({filter:/^next\/navigation$/},()=>({path:'router',namespace:'stub'}));
      build.onLoad({filter:/.*/,namespace:'stub'},()=>({contents:'export const useRouter=()=>({push:url=>window.destination=url});'}));
    }}],
  });
  const css = (await require('postcss')([require('tailwindcss')({ ...require('../tailwind.config.ts').default, content:['./components/search/HomeHeroSearch.tsx'] })]).process(readFileSync('app/globals.css','utf8'),{from:undefined})).css;
  const server=createServer((req,res)=>{
    if(req.url==='/bundle.js'){res.setHeader('Content-Type','application/javascript');return res.end(bundle.outputFiles[0].text);}
    res.setHeader('Content-Type','text/html');
    res.end(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>`);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser=await require(process.env.PLAYWRIGHT_MODULE||'playwright').chromium.launch({channel:'msedge',headless:true});
    for(const width of [1440,390,320]){
      const page=await browser.newPage({viewport:{width,height:800}});
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      const ai=page.getByRole('tab',{name:'Busca inteligente',exact:true});
      const filters=page.getByRole('tab',{name:'Busca por filtros'});
      assert.equal(await ai.getAttribute('aria-selected'),'true');
      await page.getByRole('textbox').fill('Casa com piscina');
      await ai.focus(); await ai.press('ArrowRight');
      assert.equal(await filters.getAttribute('aria-selected'),'true');
      await page.getByLabel('Finalidade',{exact:true}).selectOption('Alugar');
      await page.getByLabel('Tipo de imóvel',{exact:true}).selectOption('Casa');
      await page.getByLabel('Localização',{exact:true}).selectOption('condominio:Royal Park');
      await page.getByLabel('Faixa de valor',{exact:true}).selectOption('1');
      await ai.click(); assert.equal(await page.getByRole('textbox').inputValue(),'Casa com piscina');
      await filters.click();
      assert.equal(await page.getByLabel('Finalidade',{exact:true}).inputValue(),'Alugar');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      for(const control of await page.getByRole('combobox').all()) assert((await control.boundingBox()).height>=44);
      await page.getByRole('button',{name:'Buscar imóveis'}).click();
      await page.waitForFunction(()=>window.destination);
      const url=new URL(await page.evaluate(()=>window.destination),'https://example.test');
      assert.equal(url.pathname,'/imoveis'); assert.equal(url.searchParams.get('negocio'),'Alugar');
      assert.equal(url.searchParams.get('condominio'),'Royal Park'); assert.equal(url.searchParams.get('tipo'),'Casa');
      assert.equal(url.searchParams.get('valorMaximo'),'2000000'); assert(!url.searchParams.has('q'));
      await page.reload();
      await page.getByRole('button',{name:'Casa com 4 suítes no Terra Bonita',exact:true}).click();
      await page.waitForFunction(()=>window.destination);
      assert.equal(new URL(await page.evaluate(()=>window.destination),'https://example.test').searchParams.get('q'),'Casa com 4 suítes no Terra Bonita');
      await page.close(); console.log(`PASS: tabs, retained state, filters, AI suggestion, responsive ${width}px`);
    }
  } finally { await browser?.close(); await new Promise(resolve=>server.close(resolve)); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
