const assert = require('node:assert/strict');
const { readFileSync, mkdirSync } = require('node:fs');
const { join } = require('node:path');
const { tmpdir } = require('node:os');

async function main() {
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const bundle = await require('esbuild').build({
    stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client'; import {BannerCarousel} from './components/home/BannerCarousel';
      const root=createRoot(document.getElementById('root'));
      window.showBanners=(banners)=>root.render(<BannerCarousel banners={banners}/>);`, resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, write: false, jsx: 'automatic', plugins: [{ name: 'image-stub', setup(build) {
      build.onResolve({ filter: /^next\/image$/ }, () => ({ path: 'image', namespace: 'fixture' }));
      build.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({ loader: 'jsx', resolveDir: process.cwd(), contents: `import React from 'react';export default function Image({fill,...props}){return <img {...props} style={fill?{position:'absolute',inset:0,width:'100%',height:'100%'}:undefined}/>}` }));
    } }]
  });
  const css = (await require('postcss')([require('tailwindcss')({ ...require('../tailwind.config.ts').default, content: ['./components/home/BannerCarousel.tsx'] })]).process(readFileSync('app/globals.css', 'utf8'), { from: undefined })).css;
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  try {
    const output = join(tmpdir(), 'premium-banners'); mkdirSync(output, { recursive: true });
    const banner = { id: 'one', image: 'https://fixture.test/banner.png', alt: 'Banner de teste', href: '/contato', width: 1672, height: 941 };
    for (const width of [1440, 768, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 900 }, reducedMotion: 'reduce' });
      await page.route('https://fixture.test/banner.png', route => route.fulfill({ contentType: 'image/png', body: readFileSync('public/images/produtos/bts-capa.png') }));
      await page.setContent(`<html><head><style>${css}</style></head><body><div id="root"></div></body></html>`);
      await page.addScriptTag({ content: bundle.outputFiles[0].text });
      await page.evaluate(() => window.showBanners([]));
      assert.equal(await page.locator('section').count(), 0);
      await page.evaluate(b => window.showBanners([b]), banner);
      await page.getByAltText('Banner de teste').waitFor();
      assert.equal(await page.getByRole('button').count(), 0);
      assert.equal(await page.getByRole('link').getAttribute('href'), '/contato');
      await page.evaluate(b => window.showBanners([b, { ...b, id: 'two', alt: 'Segundo banner', href: null }]), banner);
      await page.getByRole('button', { name: 'Reproduzir banners' }).waitFor();
      await page.getByRole('button', { name: 'Próximo banner' }).click();
      await page.getByAltText('Segundo banner').waitFor();
      await page.getByRole('button', { name: 'Banner anterior' }).click();
      await page.getByAltText('Banner de teste').waitFor();
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.screenshot({ path: join(output, `${width}.png`), fullPage: true });
      if (width === 1440) {
        await page.clock.install();
        await page.getByRole('button', { name: 'Reproduzir banners' }).click();
        await page.evaluate(() => document.activeElement.blur());
        await page.mouse.move(-10, -10);
        await page.clock.runFor(6100);
        await page.getByAltText('Segundo banner').waitFor();
        await page.getByAltText('Segundo banner').hover();
        await page.clock.runFor(6100);
        assert.equal(await page.getByAltText('Segundo banner').count(), 1);
        await page.getByRole('button', { name: 'Pausar banners' }).click();
        await page.getByRole('button', { name: 'Reproduzir banners' }).waitFor();
      }
      await page.close();
    }
    const home = readFileSync('app/page.tsx', 'utf8');
    assert(home.includes('{bairros.length > 0 ? <>'));
    assert(home.indexOf('<BannerCarousel banners={banners} />') < home.indexOf('{bairros.length > 0 ? <>'));
    console.log(`PASS: empty/single/multiple banners, links, navigation, reduced motion and responsive widths. Screenshots: ${output}`);
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error); process.exitCode = 1; });
