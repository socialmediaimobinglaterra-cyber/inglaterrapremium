const assert = require('node:assert/strict');
const { readFileSync, readdirSync, mkdirSync } = require('node:fs');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const esbuild = require('esbuild');

async function main() {
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const image = '/images/capa-hero.jpg';
  const listings = Array.from({ length: 6 }, (_, i) => ({
    id: String(i), codigo: `AP${i}`, slug: `apartamento-${i}`, titulo: 'Apartamento na Gleba Palhano',
    bairro: 'Gleba Palhano', cidade: 'Londrina', tipo: 'Apartamento', area: 180,
    suites: 3, vagas: 2, precoVenda: 2000000, precoLocacao: null, image, tag: 'PREMIUM',
  }));
  const bundle = await esbuild.build({
    stdin: { contents: `import React from 'react'; import { createRoot } from 'react-dom/client';
      import { BuscaImoveisClient } from './components/search/BuscaImoveisClient';
      const params = new URLSearchParams(location.search);
      createRoot(document.getElementById('root')).render(<BuscaImoveisClient
        bairros={['Gleba Palhano', 'Terra Bonita']} tipos={['Casa', 'Apartamento']}
        crmPreview={params.has('preview')} initialNaturalQuery={params.get('q') || undefined}
        initialSearchPage={{imoveis:${JSON.stringify(listings)},total:30,page:1,perPage:24,hasMore:true}} />);`,
      resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, write: false, format: 'iife', jsx: 'automatic',
    plugins: [{ name: 'next-browser-test', setup(build) {
      build.onResolve({ filter: /^(next\/image|next\/link)$/ }, args => ({path: args.path, namespace: 'stub'}));
      build.onLoad({ filter: /.*/, namespace: 'stub' }, args => ({ loader: 'jsx', resolveDir: process.cwd(), contents:
        `import React from 'react'; export default function Stub({fill,priority,...props}) { return React.createElement('${args.path === 'next/link' ? 'a' : 'img'}',props); }` }));
    }}],
  });
  const css = (await require('postcss')([require('tailwindcss')({
    ...require('../tailwind.config.ts').default,
    content: ['./components/search/*.tsx', './components/MobiliaTag.tsx'],
  })]).process(readFileSync('app/globals.css', 'utf8'), { from: undefined })).css;
  const font = readdirSync('.next/static/media').find(name => name.endsWith('-s.p.woff2'));
  assert(font, 'Run npm run build first to prepare the project font.');
  const server = createServer((req, res) => {
    if (req.url === '/bundle.js') { res.setHeader('Content-Type', 'application/javascript'); return res.end(bundle.outputFiles[0].text); }
    if (req.url === image) { res.setHeader('Content-Type', 'image/jpeg'); return res.end(readFileSync(`public${image}`)); }
    if (req.url === '/font.woff2') { res.setHeader('Content-Type', 'font/woff2'); return res.end(readFileSync(join('.next/static/media',font))); }
    res.setHeader('Content-Type', 'text/html');
    res.end(`<html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>@font-face{font-family:'DM Sans';src:url('/font.woff2');font-weight:100 900;font-display:swap}:root{--font-dm-sans:'DM Sans'}${css}</style></head><body><nav style="position:fixed;top:0;height:64px;background:#F5F3F0;width:100%;z-index:50;border-bottom:1px solid #998376">Inglaterra Premium</nav><div id="root"></div><script src="/bundle.js"></script></body></html>`);
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({ channel: 'msedge', headless: true });
    const output = join(tmpdir(), 'premium-intelligent-search');
    mkdirSync(output, {recursive:true});
    for (const width of [1440, 390, 320]) {
      const page = await browser.newPage({ viewport: {width, height:900}, reducedMotion: 'reduce' });
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      const aiRequests = [], searches = [];
      let fail = false, empty = false;
      await page.route('**/api/imoveis/ai', async route => {
        const body = route.request().postDataJSON(); aiRequests.push(body);
        await new Promise(resolve => setTimeout(resolve, 250));
        if (fail) return route.fulfill({status:503,json:{ok:false,message:'Busca indisponível. Seus filtros foram mantidos.'}});
        const filters = aiRequests.length === 1
          ? {...body.state,tipo:'Apartamento',bairro:'Gleba Palhano',valorMaximo:3000000}
          : {...body.state,suitesMinimas:3,quartosMinimos:3,vagasMinimas:2,areaMinima:100,areaMaxima:300};
        await route.fulfill({json:{ok:true,filters,naoInterpretado:aiRequests.length === 2 ? ['vista para o lago'] : []}});
      });
      await page.route('**/api/imoveis/search', async route => {
        const body = route.request().postDataJSON(); searches.push(body);
        await route.fulfill({json:{ok:true,imoveis:empty ? [] : listings.map(x=>({...x,slug:body.page > 1 ? `${x.slug}-p2` : x.slug})),total:empty?0:30,page:body.page,hasMore:!empty&&body.page===1}});
      });
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      const input = page.getByRole('textbox', {name:'Busca inteligente de imóveis'});
      const submit = page.getByRole('button', {name:'Encontrar imóveis',exact:true});
      await input.waitFor();
      await page.evaluate(()=>document.fonts.ready);
      assert.equal(await page.getByRole('textbox').count(),1);
      assert((await input.boundingBox()).height >= 48);
      assert((await submit.boundingBox()).height >= 48);
      assert((await input.boundingBox()).y < (await page.getByRole('group',{name:'Filtros rápidos'}).boundingBox()).y);
      await page.screenshot({path:join(output,`initial-${width}.png`),fullPage:true});
      await input.fill('Apartamento na Gleba Palhano até R$ 3 milhões');
      await input.press('Enter');
      await page.getByRole('button',{name:'Interpretando...',exact:true}).waitFor();
      assert(await input.isDisabled());
      assert(await page.getByRole('combobox',{name:'Localização',exact:true}).isDisabled());
      await page.getByRole('heading',{name:'Vamos refinar sua busca?'}).waitFor();
      assert.equal(await input.inputValue(),'Apartamento na Gleba Palhano até R$ 3 milhões');
      assert.equal(await page.getByRole('combobox',{name:'Localização',exact:true}).inputValue(),'Gleba Palhano');
      await page.getByRole('combobox',{name:'Negócio',exact:true}).selectOption('Alugar');
      await page.waitForFunction(()=>document.querySelector('#filtro-negocio').value === 'Alugar');
      await page.getByRole('button',{name:'Agora quero com 3 suítes',exact:true}).click();
      await page.waitForFunction(()=>document.querySelector('#filtro-suites').value === '3+ suítes');
      assert.equal(aiRequests[1].state.negocio,'Alugar');
      assert.equal(aiRequests[1].state.valorMaximo,3000000);
      assert.equal(aiRequests[1].state.bairro,'Gleba Palhano');
      assert.equal(await page.getByText('vista para o lago',{exact:true}).count(),1);
      await page.getByRole('combobox',{name:'Ordenar por'}).selectOption('menor_valor');
      await page.waitForFunction(()=>document.querySelector('#ordenar-imoveis').value === 'menor_valor');
      await page.getByRole('button',{name:'Carregar mais imóveis'}).click();
      await page.getByRole('button',{name:'Carregar mais imóveis'}).waitFor({state:'hidden'});
      assert.equal(searches.at(-1).page,2);
      for (const [key,value] of Object.entries({order:'menor_valor',bairro:'Gleba Palhano',valorMaximo:3000000,suitesMinimas:3,quartosMinimos:3,vagasMinimas:2,areaMinima:100,areaMaxima:300})) assert.equal(searches.at(-1)[key],value);
      const edit = page.getByRole('button',{name:'Editar busca',exact:true});
      await edit.waitFor();
      const box = await edit.boundingBox(); assert(box.y >= 64 && box.y < 125);
      await page.screenshot({path:join(output,`scrolled-${width}.png`)});
      await edit.click();
      await page.waitForFunction(()=>document.activeElement.id === 'intelligent-search-query');
      assert.equal(await input.inputValue(),'Agora quero com 3 suítes');
      assert.equal(await page.getByRole('textbox').count(),1);
      fail = true;
      await input.fill('Outra tentativa'); await submit.click();
      await page.getByText('Busca indisponível. Seus filtros foram mantidos.',{exact:true}).first().waitFor();
      assert.equal(await page.getByRole('combobox',{name:'Localização',exact:true}).inputValue(),'Gleba Palhano');
      assert.equal(await input.inputValue(),'Outra tentativa');
      fail = false; empty = true;
      await submit.click();
      await page.getByText('Nenhum imóvel encontrado com esses critérios.',{exact:true}).waitFor();
      await page.getByRole('button',{name:'Refinar minha busca'}).click();
      await page.waitForFunction(()=>document.activeElement.id === 'intelligent-search-query');
      await page.getByRole('button',{name:'Limpar filtros',exact:true}).click();
      await page.waitForFunction(()=>document.querySelector('#filtro-localizacao').value === 'Todos os bairros');
      assert.equal(searches.at(-1).bairro,undefined);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth <= innerWidth));
      assert.deepEqual(errors,[]);
      await page.close();
    }
    // Home entry and the existing CRM preview reuse the same component/endpoints.
    for (const preview of [false,true]) {
      const page = await browser.newPage();
      const root = preview ? '/preview/crm/api' : '/api/imoveis';
      let calls = 0;
      await page.route(`**${root}/ai`, async route => { calls++; await route.fulfill({json:{ok:true,filters:{negocio:'Comprar',bairro:'Terra Bonita'},naoInterpretado:[]}}); });
      await page.route(`**${root}/search`, route => route.fulfill({json:{ok:true,imoveis:[],total:0,page:1,hasMore:false}}));
      await page.goto(`http://127.0.0.1:${server.address().port}/?q=Casa${preview?'&preview=1':''}`);
      await page.getByRole('heading',{name:'Vamos refinar sua busca?'}).waitFor();
      assert.equal(calls,1);
      assert.equal(await page.getByRole('textbox').inputValue(),'Casa');
      await page.close();
    }
    console.log(`PASS: Enter, suggestions, pending lock, refinement, manual filters, sorting, pagination, error recovery, empty state, Home/CRM entry, single field, mobile/desktop. Screenshots: ${output}`);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
}
main().catch(error => { console.error(error); process.exitCode=1; });
