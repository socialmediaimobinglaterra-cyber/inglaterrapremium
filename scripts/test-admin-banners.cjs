const assert = require('node:assert/strict');
const { readFileSync, mkdirSync, readdirSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
async function main() {
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const bundle = await require('esbuild').build({ stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {BannerManager} from './components/admin/BannerManager';
    window.calls=[];window.fail=false;createRoot(document.getElementById('root')).render(<BannerManager banners={[{id:'a',alt:'Campanha existente',image:'https://fixture.test/banner.png',href:'/contato',ordem:1,ativo:true,width:1672,height:941}]}/>);`, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, jsx: 'automatic', plugins: [{ name: 'stubs', setup(build) {
    build.onResolve({ filter: /^(next\/navigation|@\/app\/admin\/banners\/actions)$/ }, args => ({ path: args.path, namespace: 'fixture' }));
    build.onLoad({ filter: /.*/, namespace: 'fixture' }, args => ({ loader: 'js', contents: args.path === 'next/navigation' ? "export const useRouter=()=>({refresh(){}})" : "export async function saveBannerAction(previous,data){window.calls.push(Object.fromEntries(data));return window.fail?{error:'Falha de teste'}:{ok:true};}" }));
  } }] });
  const css = (await require('postcss')([require('tailwindcss')({ ...require('../tailwind.config.ts').default, content: ['./components/admin/BannerManager.tsx'] })]).process(readFileSync('app/globals.css', 'utf8'), { from: undefined })).css;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const output = join(tmpdir(), 'premium-admin-banners'); mkdirSync(output, { recursive: true });
    for (const width of [1440, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 } });
      await page.route('https://fixture.test/banner.png', route => route.fulfill({ contentType: 'image/png', body: readFileSync('public/images/produtos/bts-capa.png') }));
      const font = readdirSync('.next/static/media').find(name => name.endsWith('-s.p.woff2'));
      const fontData = readFileSync(join('.next/static/media', font)).toString('base64');
      await page.setContent(`<html><style>@font-face{font-family:'DM Sans';src:url(data:font/woff2;base64,${fontData});font-weight:100 900}:root{--font-dm-sans:'DM Sans'}${css}</style><body><main style="padding:24px"><div id="root"></div></main></body></html>`);
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.getByRole('button', { name: 'Editar', exact: true }).click();
      assert.equal(await page.getByLabel('Descrição da imagem').inputValue(), 'Campanha existente');
      await page.getByLabel('Descrição da imagem').fill('Campanha editada');
      await page.getByLabel('Ativo na Home').uncheck();
      await page.getByLabel('Ordem', { exact: true }).fill('3');
      await page.evaluate(() => window.fail = true);
      await page.getByRole('button', { name: 'Salvar banner' }).click();
      await page.getByRole('alert').waitFor();
      assert.equal(await page.getByLabel('Descrição da imagem').inputValue(), 'Campanha editada');
      await page.evaluate(() => window.fail = false);
      await page.getByRole('button', { name: 'Salvar banner' }).click();
      await page.getByRole('button', { name: 'Adicionar banner' }).waitFor();
      assert.equal(await page.evaluate(() => window.calls[1].ordem), '3');
      page.once('dialog', dialog => dialog.dismiss());
      await page.getByRole('button', { name: 'Remover', exact: true }).click();
      assert.equal(await page.evaluate(() => window.calls.length), 2);
      page.once('dialog', dialog => dialog.accept());
      await page.getByRole('button', { name: 'Remover', exact: true }).click();
      await page.waitForFunction(() => window.calls.length === 3);
      await page.getByRole('button', { name: 'Adicionar banner' }).click();
      await page.getByLabel('Imagem (JPG', { exact: false }).setInputFiles('public/images/produtos/bts-capa.png');
      await page.getByAltText('Prévia do banner').waitFor();
      await page.getByLabel('Descrição da imagem').fill('Banner novo');
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: join(output, `${width}.png`), fullPage: true });
      await page.getByRole('button', { name: 'Salvar banner' }).click();
      await page.getByRole('button', { name: 'Adicionar banner' }).waitFor();
      assert.equal(await page.evaluate(() => window.calls[3].imagem.size > 0), true);
      await page.close();
    }
    console.log('PASS admin banners: edit, status/order, error preserves draft, upload preview, delete confirmation, 1440/390/320px. No live writes.');
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
