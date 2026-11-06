const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const esbuild = require('esbuild');

async function main() {
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const bundle = await esbuild.build({
    stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
      import {PropertyContactForm} from './components/imoveis/PropertyContactForm';
      createRoot(document.getElementById('root')).render(<PropertyContactForm imovelId="test" slug="ap123" foco="locacao"
        whatsappHref={location.search ? null : 'https://wa.me/5543999990000?text=Mensagem%20inicial'}
        context="Ref: AP123 https://example.com/imoveis/ap123?foco=locacao" />);`,
      resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, write: false, jsx: 'automatic', format: 'iife'
  });
  const server = createServer((req, res) => {
    res.setHeader('Content-Type', req.url === '/bundle.js' ? 'application/javascript' : 'text/html');
    res.end(req.url === '/bundle.js' ? bundle.outputFiles[0].text : '<html><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({channel:'msedge',headless:true});
    for (const width of [1440,390,320]) {
      const page = await browser.newPage({viewport:{width,height:900}});
      await page.addInitScript(() => {
        window.opened = [];
        window.open = (...args) => { window.opened.push(args); return null; };
        navigator.sendBeacon = () => { throw new Error('Analytics blocked'); };
      });
      const requests=[];
      await page.route('**/api/imoveis/contato',route=>{
        requests.push(route.request().postDataJSON());
        return route.fulfill({json:{ok:true,message:'Cadastro realizado.'}});
      });
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      const button = page.getByRole('button', {name:'Continuar no WhatsApp'});
      await button.click();
      assert.equal(await page.evaluate(()=>window.opened.length),0);
      await page.getByRole('textbox',{name:'Seu nome',exact:true}).fill('Cliente teste');
      await page.getByRole('textbox',{name:'E-mail',exact:true}).fill('teste@example.com');
      await page.getByRole('checkbox').check();
      await page.getByRole('textbox',{name:'WhatsApp com DDD',exact:true}).fill('123');
      await button.click();
      assert.match(await page.getByRole('alert').innerText(),/DDD/);
      await page.getByRole('textbox',{name:'WhatsApp com DDD',exact:true}).fill('(43) 99999-0000');
      await page.getByRole('textbox',{name:'Mensagem',exact:true}).fill('Quero visitar & conhecer');
      await button.click();
      await page.getByRole('status').waitFor();
      assert.equal(requests[0].email,'teste@example.com');
      assert.equal(requests[0].consent,true);
      assert.equal(requests[0].slug,'ap123');
      const args = await page.evaluate(()=>window.opened[0]);
      assert.equal(args[1],'_blank');
      assert.equal(args[2],'noopener,noreferrer');
      const message = new URL(args[0]).searchParams.get('text');
      assert.match(message,/Cliente teste/);
      assert.match(message,/Quero visitar & conhecer/);
      assert.match(message,/Ref: AP123/);
      assert.match(message,/foco=locacao/);
      await page.getByRole('textbox',{name:'Seu nome',exact:true}).press('Enter');
      assert.equal(await page.evaluate(()=>window.opened.length),2);
      await page.goto(`http://127.0.0.1:${server.address().port}/?fallback`);
      assert.equal(await page.getByRole('link',{name:'Falar com a equipe'}).getAttribute('href'),'https://link.imobiliariainglaterra.com.br/p/imobiliaria-inglaterra');
      assert.equal(await page.getByRole('textbox').count(),0);
      await page.close();
    }
    console.log('Contact flow passed at 1440, 390 and 320px; no real messages sent.');
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve=>server.close(resolve));
  }
}
main().catch(error=>{ console.error(error); process.exitCode=1; });
