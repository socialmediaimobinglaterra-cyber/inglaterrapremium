const assert = require('node:assert/strict');
const { readFileSync, readdirSync, mkdirSync } = require('node:fs');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { tmpdir } = require('node:os');

async function main() {
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  for (const folder of ['condominios','lancamentos']) {
    const page = readFileSync(`app/${folder}/[slug]/page.tsx`,'utf8');
    assert.match(page,/<DevelopmentContact nome=\{/);
    assert.doesNotMatch(page,/<ContactField|<form/);
  }
  const bundle = await require('esbuild').build({stdin:{contents:`
    import React from 'react'; import {createRoot} from 'react-dom/client';
    import {DevelopmentContact} from './components/contact/DevelopmentContact';
    createRoot(document.getElementById('root')).render(<DevelopmentContact nome="Condominio de nome longo para validar a quebra de linha no celular" />);
  `,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,jsx:'automatic'});
  const css = (await require('postcss')([require('tailwindcss')({
    ...require('../tailwind.config.ts').default,content:['./components/contact/DevelopmentContact.tsx']
  })]).process(readFileSync('app/globals.css','utf8'),{from:undefined})).css;
  const font = readdirSync('.next/static/media').find(name=>name.endsWith('-s.p.woff2'));
  assert(font);
  const server = createServer((req,res)=>{
    if(req.url==='/bundle.js') {res.setHeader('Content-Type','application/javascript');return res.end(bundle.outputFiles[0].text);}
    if(req.url==='/font.woff2') {res.setHeader('Content-Type','font/woff2');return res.end(readFileSync(join('.next/static/media',font)));}
    res.setHeader('Content-Type','text/html');
    res.end(`<html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>@font-face{font-family:'DM Sans';src:url('/font.woff2');font-weight:100 900}:root{--font-dm-sans:'DM Sans'}${css}</style></head><body><div style="margin:24px auto;max-width:480px;background:#101a26;padding:24px" id="root"></div><script src="/bundle.js"></script></body></html>`);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser = await chromium.launch({channel:'msedge',headless:true});
    const output=join(tmpdir(),'premium-development-contact');
    mkdirSync(output,{recursive:true});
    for(const width of [1440,390,320]) {
      const context=await browser.newContext({viewport:{width,height:800}});
      // Intercept navigation before it can contact the real service.
      await context.route('https://link.imobiliariainglaterra.com.br/**',route=>route.fulfill({body:'Mock contact destination'}));
      const page=await context.newPage();
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      const link=page.getByRole('link',{name:/Falar pelo WhatsApp/});
      assert.equal(await link.getAttribute('href'),'https://link.imobiliariainglaterra.com.br/p/imobiliaria-inglaterra');
      assert.equal(await link.getAttribute('rel'),'noopener noreferrer');
      assert.equal(await page.locator('input,form').count(),0);
      assert((await link.boundingBox()).height>=44);
      await page.keyboard.press('Tab');
      assert(await link.evaluate(el=>el===document.activeElement));
      const popupPromise=page.waitForEvent('popup');
      await page.keyboard.press('Enter');
      const popup=await popupPromise;
      await popup.waitForLoadState();
      assert.match(popup.url(),/^https:\/\/link\.imobiliariainglaterra\.com\.br\//);
      await popup.close();
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.evaluate(()=>document.fonts.ready);
      await page.screenshot({path:join(output,`${width}.png`),fullPage:true});
      await context.close();
    }
    console.log(`Development contact passed at 1440/390/320px. External destination mocked. Screenshots: ${output}`);
  } finally {
    if(browser) await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
