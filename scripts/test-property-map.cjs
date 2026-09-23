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
      import {PropertyMap} from './components/home/PropertyMap';
      createRoot(document.getElementById('root')).render(<><div style={{height:1600}}/><PropertyMap/></>);`,
      resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, write: false, outdir: 'test-output', format: 'iife', jsx: 'automatic', loader: { '.png': 'dataurl' },
    define: { 'process.env.NEXT_PUBLIC_MAP_TILE_URL': 'undefined' },
    plugins: [{ name: 'router-stub', setup(build) {
      build.onResolve({filter:/^next\/navigation$/}, () => ({path:'router',namespace:'stub'}));
      build.onLoad({filter:/.*/,namespace:'stub'}, () => ({contents:'const router={push:url=>window.mapDestination=url}; export const useRouter=()=>router;'}));
    }}],
  });
  const js = bundle.outputFiles.find(f=>f.path.endsWith('.js')).text;
  const bundledCss = bundle.outputFiles.find(f=>f.path.endsWith('.css')).text;
  const css = readdirSync('.next/static/css').filter(f=>f.endsWith('.css')).map(f=>readFileSync(join('.next/static/css',f),'utf8')).join('\n');
  const font = readdirSync('.next/static/media').find(f=>f.endsWith('.p.woff2'));
  const server = createServer((req,res)=>{
    if(req.url==='/bundle.js'){res.setHeader('Content-Type','application/javascript');res.end(js);}
    else if(req.url==='/font.woff2'){res.setHeader('Content-Type','font/woff2');res.end(readFileSync(join('.next/static/media',font)));}
    else {res.setHeader('Content-Type','text/html');res.end(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}\n${bundledCss}\n@font-face{font-family:DM;src:url('/font.woff2');font-weight:100 900}body{--font-dm-sans:DM;font-family:DM,sans-serif}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>`);}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser=await chromium.launch({channel:'msedge',headless:true});
    for(const width of [1440,390]) {
      const page=await browser.newPage({viewport:{width,height:900}});
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      let requests=0, mode='ready';
      const points=Array.from({length:6},(_,i)=>({id:`00000000-0000-4000-8000-00000000000${i}`,latitude:-23.33+i*0.0003,longitude:-51.18+i*0.0003}));
      await page.route('**/api/imoveis/map?*',async route=>{
        requests++;
        await route.fulfill(mode==='error'?{status:503,json:{error:'unavailable'}}:{json:{version:'0123456789abcdef',points:mode==='empty'?[]:route.request().url().includes('Alugar')?points.slice(0,3):points}});
      });
      // Do not automate requests against community tile servers.
      await page.route('https://tile.openstreetmap.org/**',route=>route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#F5F3F0"/><path d="M0 100H256M100 0V256" stroke="#998376" stroke-width="5"/></svg>'}));
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      await page.getByRole('heading',{name:'Imóveis por localização'}).waitFor();
      assert.equal(requests,0,'map must remain deferred above the fold');
      await page.getByRole('heading',{name:'Imóveis por localização'}).scrollIntoViewIfNeeded();
      await page.getByText('6 imóveis no mapa',{exact:true}).waitFor();
      assert.equal(await page.locator('.property-map-pin').count(),1);
      assert.equal(await page.locator('.property-map-pin').innerText(),'6');
      await page.locator('.property-map-pin').click();
      const url = new URL(await page.evaluate(()=>window.mapDestination),'http://localhost');
      assert.equal(url.pathname,'/imoveis');assert.equal(url.searchParams.get('negocio'),'Comprar');
      assert.match(url.searchParams.get('mapa'),/^0123456789abcdef:14:c\d+$/);
      for(let i=0;i<4;i++) {
        await page.getByTitle('Aproximar',{exact:true}).click();
        await page.waitForTimeout(350);
      }
      assert(await page.locator('.property-map-pin').count()>1,'zoom should split nearby properties');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.screenshot({path:join(tmpdir(),`premium-map-${width}.png`)});
      await page.getByRole('button',{name:'Alugar',exact:true}).click();
      await page.getByText('3 imóveis no mapa',{exact:true}).waitFor();
      await page.locator('.property-map-pin').first().focus();
      await page.keyboard.press('Enter');
      assert.equal(new URL(await page.evaluate(()=>window.mapDestination),'http://localhost').searchParams.get('negocio'),'Alugar');
      mode='error';await page.getByRole('button',{name:'Comprar',exact:true}).click();
      await page.getByRole('button',{name:'Tentar novamente'}).waitFor();
      mode='empty';await page.getByRole('button',{name:'Tentar novamente'}).click();
      await page.getByText('Nenhum imóvel com localização disponível nesta seleção.').waitFor();
      assert.deepEqual(errors,[]);
      await page.close();
    }
    console.log('PASS: deferred loading, zoom clusters, exact group URL, keyboard, sale/rental, retry/empty, desktop/mobile layout; fixture API and tiles');
  } finally {
    if(browser) await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
