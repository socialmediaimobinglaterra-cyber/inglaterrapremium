const assert = require('node:assert/strict');
const { readFileSync, readdirSync, mkdirSync } = require('node:fs');
const { createServer } = require('node:http');
const { join } = require('node:path');
const { tmpdir } = require('node:os');

async function main() {
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const bundle = await require('esbuild').build({stdin:{contents:`
    import React from 'react';import {createRoot} from 'react-dom/client';
    import {NewsletterForm} from './components/home/NewsletterForm';
    import {PropertyContactForm} from './components/imoveis/PropertyContactForm';
    createRoot(document.getElementById('root')).render(location.pathname === '/newsletter' ? <NewsletterForm /> :
      <PropertyContactForm imovelId="test" slug="ap123" foco="locacao" whatsappHref="https://wa.me/5543999990000?text=Quero%20visitar" context="Ref: AP123" />);
  `,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,jsx:'automatic'});
  const css=(await require('postcss')([require('tailwindcss')({...require('../tailwind.config.ts').default,
    content:['./components/home/NewsletterForm.tsx','./components/imoveis/PropertyContactForm.tsx']
  })]).process(readFileSync('app/globals.css','utf8'),{from:undefined})).css;
  const font=readdirSync('.next/static/media').find(name=>name.endsWith('-s.p.woff2'));
  assert(font);
  const server=createServer((req,res)=>{
    if(req.url==='/bundle.js'){res.setHeader('Content-Type','application/javascript');return res.end(bundle.outputFiles[0].text);}
    if(req.url==='/font.woff2'){res.setHeader('Content-Type','font/woff2');return res.end(readFileSync(join('.next/static/media',font)));}
    res.setHeader('Content-Type','text/html');
    res.end(`<html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>@font-face{font-family:'DM Sans';src:url('/font.woff2');font-weight:100 900}:root{--font-dm-sans:'DM Sans'}${css}</style></head><body><main style="max-width:480px;margin:20px auto;padding:24px;background:${req.url==='/newsletter'?'#51210d':'#101a26'}" id="root"></main><script src="/bundle.js"></script></body></html>`);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser=await chromium.launch({channel:'msedge',headless:true});
    const output=join(tmpdir(),'premium-rd-forms');mkdirSync(output,{recursive:true});
    for(const width of [1440,390,320]) for(const mode of ['newsletter','property']) {
      const page=await browser.newPage({viewport:{width,height:1000}});
      const errors=[], requests=[];let release,scenario='success';
      page.on('pageerror',e=>errors.push(e.message));
      await page.addInitScript(()=>{window.opened=[];window.open=(...args)=>{window.opened.push(args);return null;};navigator.sendBeacon=()=>true;});
      await page.route('**/api/**',async route=>{
        const path=new URL(route.request().url()).pathname;
        assert.equal(path,mode==='newsletter'?'/api/newsletter':'/api/imoveis/contato','no Central or unrelated destination');
        requests.push(route.request().postDataJSON());
        await new Promise(resolve=>{release=resolve;});
        if(scenario==='network') return route.abort();
        if(scenario==='malformed') return route.fulfill({status:200,body:'invalid JSON'});
        if(scenario==='pending') return route.fulfill({status:202,json:{ok:false,pending:true,message:'Confirmação pendente.'}});
        if(scenario==='error') return route.fulfill({status:503,json:{ok:false,message:'Cadastro indisponível.'}});
        return route.fulfill({json:{ok:true,message:'Cadastro realizado.'}});
      });
      await page.goto(`http://127.0.0.1:${server.address().port}/${mode}`);
      const button=page.getByRole('button',{name:mode==='newsletter'?'Assinar':'Continuar no WhatsApp'});
      const email=page.getByRole('textbox',{name:mode==='newsletter'?'Seu e-mail':'E-mail',exact:true});
      if(mode==='property') {
        await page.getByRole('textbox',{name:'Seu nome',exact:true}).fill('Cliente teste');
        await page.getByRole('textbox',{name:'WhatsApp com DDD',exact:true}).fill('(43) 99999-0000');
      }
      await button.click();assert.equal(requests.length,0);
      await email.fill('teste@example.com');
      await button.click();assert.equal(requests.length,0,'missing consent blocks submission');
      assert.equal(await page.evaluate(()=>window.opened.length),0);
      await page.getByRole('checkbox').check();
      for(const value of ['error','pending','malformed','network','success']) {
        scenario=value;const count=requests.length;
        await page.evaluate(()=>{const form=document.querySelector('form');form.requestSubmit();form.requestSubmit();});
        await page.waitForFunction(()=>document.querySelector('form').getAttribute('aria-busy')==='true');
        while(requests.length===count) await new Promise(resolve=>setTimeout(resolve,10));
        assert.equal(requests.length,count+1);
        assert.equal(requests.at(-1).email,'teste@example.com');assert.equal(requests.at(-1).consent,true);
        assert(await email.isDisabled());
        if(mode==='property') {
          assert.equal(requests.at(-1).slug,'ap123');
          const opened=await page.evaluate(()=>window.opened);
          assert.equal(opened.length,count+1,'one WhatsApp window per deliberate submission');
          assert.match(opened.at(-1)[0],/^https:\/\/wa.me\/5543999990000/);
          assert.match(new URL(opened.at(-1)[0]).searchParams.get('text'),/Ref: AP123/);
        }
        release();
        await page.getByRole(value==='success'?'status':'alert').waitFor();
        if(value!=='success') {
          assert.equal(await page.getByRole('status').count(),0);
          assert.equal(await email.inputValue(),'teste@example.com');
        } else if(mode==='newsletter') assert.equal(await email.inputValue(),'');
        assert(await button.isEnabled());
      }
      if(mode==='property') assert.match(await page.getByRole('link',{name:'Abrir conversa no WhatsApp'}).getAttribute('href'),/^https:\/\/wa.me\//);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.evaluate(()=>document.fonts.ready);await page.mouse.move(0,0);
      await page.screenshot({path:join(output,`${mode}-${width}.png`),fullPage:true});
      assert.deepEqual(errors,[]);await page.close();
    }
    console.log(`RD forms passed: consent, duplicate clicks, errors, pending, network and success at 1440/390/320px. No real leads. Screenshots: ${output}`);
  } finally {
    if(browser) await browser.close();await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
