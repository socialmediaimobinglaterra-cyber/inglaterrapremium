const assert = require('node:assert/strict');
const { readFileSync, readdirSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');

async function main() {
  const { chromium, request } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const api = await request.newContext();
  let payload;
  try {
    const response = await api.get('https://vmi.imobiliariainglaterra.com.br/api/public/posts?limit=3&offset=0', { timeout: 20000 });
    assert.equal(response.status(), 200); payload = await response.json(); assert(payload.posts.length > 0);
  } finally { await api.dispose(); }
  const bundle = await require('esbuild').build({ stdin: { contents: `import React from 'react';import {createRoot} from 'react-dom/client';import {BlogNews} from './components/home/BlogNews';import {parseBlogPosts} from './lib/blog-posts';
    const root=createRoot(document.getElementById('root'));window.renderPosts=(data)=>root.render(<BlogNews posts={parseBlogPosts(data)}/>);`, resolveDir: process.cwd(), loader: 'tsx' }, bundle: true, write: false, jsx: 'automatic', plugins: [{ name: 'next-image', setup(build) {
    build.onResolve({ filter: /^next\/image$/ }, () => ({ path: 'image', namespace: 'fixture' }));
    build.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ loader: 'jsx', resolveDir: process.cwd(), contents: `import React from 'react';export default function Image({fill,...props}){return <img {...props} style={fill?{position:'absolute',width:'100%',height:'100%'}:undefined}/>}` }));
  } }] });
  const css = (await require('postcss')([require('tailwindcss')({ ...require('../tailwind.config.ts').default, content: ['./components/home/BlogNews.tsx', './components/home/BlogCover.tsx'] })]).process(readFileSync('app/globals.css', 'utf8'), { from: undefined })).css;
  const font = readdirSync('.next/static/media').find(name => name.endsWith('-s.p.woff2'));
  const fontData = readFileSync(join('.next/static/media', font)).toString('base64');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const output = join(tmpdir(), 'premium-blog'); mkdirSync(output, { recursive: true });
    for (const width of [1440, 768, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 } });
      await page.setContent(`<html><style>@font-face{font-family:'DM Sans';src:url(data:font/woff2;base64,${fontData});font-weight:100 900}:root{--font-dm-sans:'DM Sans'}${css}</style><body><div id="root"></div></body></html>`);
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(data => window.renderPosts(data), payload);
      await page.getByRole('heading', { name: /O mercado de alto/ }).waitFor();
      assert.equal(await page.locator('article').count(), Math.min(3, payload.posts.length));
      assert.equal(await page.getByRole('link', { name: 'Ver todas as notícias' }).getAttribute('href'), 'https://vmi.imobiliariainglaterra.com.br/');
      await page.waitForFunction(() => [...document.images].every(img => img.complete && img.naturalWidth > 0));
      assert.equal(await page.locator('article img').count(), payload.posts.filter(p => p.capa).length);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: join(output, `${width}.png`), fullPage: true });
      const hrefs = await page.locator('article a').evaluateAll(links => links.map(a => a.href));
      assert.deepEqual(hrefs, payload.posts.map(p => p.link));
      await page.evaluate(() => window.renderPosts({ posts: [] }));
      await page.waitForFunction(() => !document.querySelector('section'));
      await page.close();
    }
    console.log(`PASS real public API, 3 cards, real covers and links, empty state, responsive widths. Screenshots: ${output}`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
