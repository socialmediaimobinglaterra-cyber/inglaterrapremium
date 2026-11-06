const assert = require('node:assert/strict');
const {readFileSync,readdirSync,mkdirSync}=require('node:fs');
const {createServer}=require('node:http');
const {join}=require('node:path');
const {tmpdir}=require('node:os');

async function main(){
  const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
  const bundle=await require('esbuild').build({stdin:{contents:`
    import React from 'react';import {createRoot} from 'react-dom/client';
    import Policy from './app/politica-de-privacidade/page';
    import {PropertyContactForm} from './components/imoveis/PropertyContactForm';
    createRoot(document.getElementById('root')).render(location.pathname==='/politica-de-privacidade'?<Policy/>:
      <div style={{background:'#101a26',padding:24,maxWidth:480}}><PropertyContactForm imovelId="test" slug="ap123" whatsappHref="https://wa.me/5543999990000?text=Visita" context="Ref AP123"/></div>);
  `,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,jsx:'automatic'});
  const css=(await require('postcss')([require('tailwindcss')({...require('../tailwind.config.ts').default,content:['./app/politica-de-privacidade/page.tsx','./components/imoveis/PropertyContactForm.tsx']})]).process(readFileSync('app/globals.css','utf8'),{from:undefined})).css;
  const font=readdirSync('.next/static/media').find(name=>name.endsWith('-s.p.woff2'));assert(font);
  const server=createServer((req,res)=>{
    if(req.url==='/bundle.js'){res.setHeader('Content-Type','application/javascript');return res.end(bundle.outputFiles[0].text);}
    if(req.url==='/font.woff2'){res.setHeader('Content-Type','font/woff2');return res.end(readFileSync(join('.next/static/media',font)));}
    res.setHeader('Content-Type','text/html');
    res.end(`<html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>@font-face{font-family:'DM Sans';src:url('/font.woff2');font-weight:100 900}:root{--font-dm-sans:'DM Sans'}${css}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>`);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
  try{
    browser=await chromium.launch({channel:'msedge',headless:true});
    const output=join(tmpdir(),'premium-privacy-policy');mkdirSync(output,{recursive:true});
    for(const width of [1440,390,320]){
      const page=await browser.newPage({viewport:{width,height:900}});
      await page.goto(`http://127.0.0.1:${server.address().port}/`);
      await page.getByRole('textbox',{name:'Seu nome',exact:true}).fill('Cliente teste');
      const link=page.getByRole('link',{name:'Política de Privacidade',exact:true});
      await link.focus();
      const popupPromise=page.waitForEvent('popup');await page.keyboard.press('Enter');const popup=await popupPromise;
      await popup.getByRole('heading',{level:1}).waitFor();
      assert.equal(await popup.getByRole('heading',{level:2}).count(),11);
      assert.equal(await popup.getByRole('link',{name:'inteligencia@imobiliariainglaterra.com.br',exact:true}).count(),3);
      assert.equal(await page.getByRole('textbox',{name:'Seu nome',exact:true}).inputValue(),'Cliente teste');
      assert.equal(await page.getByRole('checkbox').isChecked(),false);
      assert(await popup.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await popup.evaluate(()=>document.fonts.ready);
      await popup.screenshot({path:join(output,`${width}.png`)});
      await popup.close();await page.close();
    }
    console.log(`Privacy page and form link passed at 1440/390/320px. Screenshots: ${output}`);
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
