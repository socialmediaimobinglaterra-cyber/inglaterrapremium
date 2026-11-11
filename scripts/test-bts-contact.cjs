const assert = require('node:assert/strict');
const { readFileSync, readdirSync, mkdirSync } = require('node:fs');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { tmpdir } = require('node:os');
const esbuild = require('esbuild');

async function main() {
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const bundle = await esbuild.build({
    stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
      import {BtsContactForm} from './components/bts/BtsContactForm';
      createRoot(document.getElementById('root')).render(<BtsContactForm />);`,
      resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, write: false, jsx: 'automatic', format: 'iife'
  });
  const css = (await require('postcss')([require('tailwindcss')({
    ...require('../tailwind.config.ts').default,
    content: ['./components/bts/BtsContactForm.tsx']
  })]).process(readFileSync('app/globals.css','utf8'),{from:undefined})).css;
  const font = readdirSync('.next/static/media').find(name=>name.endsWith('-s.p.woff2'));
  assert(font, 'Build font assets are required for visual validation.');
  const server = createServer((req,res)=>{
    if(req.url==='/font.woff2') {res.setHeader('Content-Type','font/woff2');return res.end(readFileSync(join('.next/static/media',font)));}
    if (req.url === '/bundle.js') {res.setHeader('Content-Type','application/javascript');return res.end(bundle.outputFiles[0].text);}
    res.setHeader('Content-Type','text/html');
    res.end(`<html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>@font-face{font-family:'DM Sans';src:url('/font.woff2');font-weight:100 900}:root{--font-dm-sans:'DM Sans'}${css}</style></head><body><main style="max-width:460px;margin:20px auto;padding:24px;background:#101a26" id="root"></main><script src="/bundle.js"></script></body></html>`);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser = await chromium.launch({channel:'msedge',headless:true});
    const output = join(tmpdir(),'premium-bts-contact');
    mkdirSync(output,{recursive:true});
    for (const width of [1440,390,320]) {
      const page = await browser.newPage({viewport:{width,height:900}});
      let requests=0, release, mode='success';
      const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      // Mock the only submission destination. No email or real lead is created.
      await page.route('**/api/bts/contact',async route=>{
        requests++;
        await new Promise(resolve=>{release=resolve;});
        if(mode==='network') return route.abort();
        if(mode==='malformed') return route.fulfill({status:200,body:'not JSON'});
        if(mode==='error') return route.fulfill({status:502,json:{ok:false,message:'Falha de teste'}});
        return route.fulfill({json:{ok:true,message:'Mensagem enviada.'}});
      });
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      const button=page.getByRole('button',{name:'Enviar mensagem'});
      const name=page.getByRole('textbox',{name:'Seu nome',exact:true});
      await button.click();
      assert.equal(requests,0,'required fields must prevent submission');
      await page.getByRole('combobox',{name:'Seu perfil'}).selectOption('Tenho um terreno');
      await name.fill('Cliente teste');
      await page.getByRole('textbox',{name:'WhatsApp',exact:true}).fill('(43) 99999-0000');
      await page.getByRole('textbox',{name:'E-mail',exact:true}).fill('teste@example.com');
      for(const scenario of ['error','malformed','network','success']) {
        mode=scenario;
        const previous=requests;
        await page.evaluate(()=>{
          const form=document.querySelector('form');
          form.requestSubmit();form.requestSubmit();
        });
        await page.waitForFunction(()=>document.querySelector('form').getAttribute('aria-busy')==='true');
        while(requests===previous) await new Promise(resolve=>setTimeout(resolve,10));
        assert.equal(requests,previous+1,'same-tick submissions must only send once');
        assert(await name.isDisabled(),'values cannot be edited during sending');
        assert(await page.getByRole('button',{name:'Enviando'}).isDisabled());
        release();
        if(scenario==='success') {
          await page.getByRole('status').waitFor();
          assert.equal(await name.inputValue(),'');
        } else {
          await page.getByRole('alert').waitFor();
          assert.equal(await name.inputValue(),'Cliente teste','errors preserve typed fields');
          assert.equal(await page.getByRole('status').count(),0,'never claim success after failure');
        }
        assert(await button.isEnabled());
      }
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      assert.deepEqual(errors,[]);
      await page.evaluate(()=>document.fonts.ready);
      await page.mouse.move(0,0);
      await page.screenshot({path:join(output,`bts-${width}.png`),fullPage:true});
      await page.close();
    }
    console.log(`BTS contact passed: required fields, duplicate guard, failures, retry, success and layout at 1440/390/320px. Screenshots: ${output}`);
  } finally {
    if(browser) await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
