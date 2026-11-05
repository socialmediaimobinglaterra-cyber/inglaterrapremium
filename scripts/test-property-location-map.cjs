const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const { readFileSync } = require('node:fs');
const esbuild = require('esbuild');

async function main() {
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const bundle = await esbuild.build({
    stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
      import {PropertyLocationMap} from './components/imoveis/PropertyLocationMap';
      const invalid = location.search.includes('invalid');
      createRoot(document.getElementById('root')).render(<PropertyLocationMap latitude={invalid ? null : -23.34868621826172} longitude={-51.20769119262695} address="Esperança, Londrina - PR" />);`,
      resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, write: false, format: 'iife', jsx: 'automatic',
    define: {'process.env.NEXT_PUBLIC_MAP_TILE_URL':'undefined'},
    loader: {'.css':'empty'},
  });
  const css = (await require('postcss')([require('tailwindcss')({
    ...require('../tailwind.config.ts').default,
    content:['./components/imoveis/PropertyLocationMap.tsx'],
  })]).process(readFileSync('app/globals.css','utf8'),{from:undefined})).css;
  const mapCss = readFileSync('node_modules/leaflet/dist/leaflet.css','utf8') + readFileSync('components/home/property-map.css','utf8');
  const server = createServer((req,res) => {
    if(req.url === '/bundle.js') {res.setHeader('Content-Type','application/javascript');return res.end(bundle.outputFiles[0].text);}
    res.setHeader('Content-Type','text/html');
    res.end(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}${mapCss}</style></head><body><div style="height:1400px"></div><div id="root"></div><script src="/bundle.js"></script></body></html>`);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser = await chromium.launch({channel:'msedge',headless:true});
    for(const width of [1440,390]) {
      const page = await browser.newPage({viewport:{width,height:900}});
      const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      let tiles=0;
      await page.route('https://tile.openstreetmap.org/**',route=>{
        tiles++;
        return route.fulfill({contentType:'image/svg+xml',body:'<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#dedede"/><path d="M0 128h256M128 0v256" stroke="white" stroke-width="14"/></svg>'});
      });
      const url=`http://127.0.0.1:${server.address().port}`;
      await page.goto(url);
      await page.getByText('Esperança, Londrina - PR',{exact:true}).waitFor();
      assert.equal(tiles,0,'Map must not load before nearing viewport');
      await page.getByRole('region',{name:'Mapa da localização do imóvel'}).scrollIntoViewIfNeeded();
      await page.locator('.leaflet-marker-icon').waitFor({state:'attached',timeout:10000}).catch(async error=>{console.error(await page.locator('body').innerText(),errors);throw error;});
      await page.waitForFunction(()=>document.querySelector('.leaflet-tile-loaded'));
      assert(tiles>0);
      assert.match(await page.getByRole('link',{name:'Abrir mapa ampliado'}).getAttribute('href'),/mlat=-23.34868621826172&mlon=-51.20769119262695/);
      await page.getByRole('button',{name:'Aproximar',exact:true}).click();
      assert.equal(await page.locator('.leaflet-marker-icon').evaluate(el=>getComputedStyle(el,'::before').backgroundColor),'rgb(81, 33, 13)');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.goto(`${url}/?invalid`);
      await page.getByText('Esperança, Londrina - PR',{exact:true}).waitFor();
      assert.equal(await page.getByRole('region').count(),0);
      assert.equal(await page.getByRole('link',{name:'Abrir mapa ampliado'}).count(),0);
      assert.deepEqual(errors,[]);
      await page.close();
    }
    console.log('PASS: lazy map, tiles, marker color, coordinates, zoom, invalid-coordinate fallback, desktop/mobile without overflow. Tiles mocked.');
  } finally {if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
