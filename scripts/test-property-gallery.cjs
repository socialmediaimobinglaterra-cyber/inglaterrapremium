const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const esbuild = require('esbuild');

async function main() {
  const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const result = await esbuild.build({
    stdin: { contents: `import React from 'react'; import {createRoot} from 'react-dom/client';
      import {PropertyGallery} from './components/imoveis/PropertyGallery';
      const single = location.search.includes('single');
      createRoot(document.getElementById('root')).render(<PropertyGallery title="Imovel teste"
        photos={single ? [{url:'/a.svg',alt:'Sala'}] : [{url:'/a.svg',alt:'Sala'},{url:'/b.svg',alt:'Quarto'}]}
        commonPhotos={single ? [] : [{url:'/c.svg',alt:'Areas comuns - Piscina'},{url:'/a.svg',alt:'Duplicada'}]} />);`,
      resolveDir: process.cwd(), loader: 'tsx' },
    bundle: true, write: false, format: 'iife', jsx: 'automatic',
    plugins: [{ name: 'image-stub', setup(build) {
      build.onResolve({filter:/^next\/image$/}, () => ({path:'image',namespace:'stub'}));
      build.onLoad({filter:/.*/,namespace:'stub'}, () => ({loader:'jsx',resolveDir:process.cwd(),contents:`import React from 'react'; export default function Image({fill,priority,...props}) {return <img {...props}/>;}`}));
    }}],
  });
  const server = createServer((req,res) => {
    if (req.url === '/bundle.js') { res.setHeader('Content-Type','application/javascript'); return res.end(result.outputFiles[0].text); }
    if (req.url.endsWith('.svg')) { res.setHeader('Content-Type','image/svg+xml'); return res.end('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40"><rect width="40" height="40" fill="red"/></svg>'); }
    res.end('<html><body><div id="root"></div><script src="/bundle.js"></script></body></html>');
  });
  await new Promise(resolve => server.listen(0,'127.0.0.1',resolve));
  let browser;
  try {
    browser = await chromium.launch({channel:'msedge',headless:true});
    for (const width of [1440,390]) {
      const page = await browser.newPage({viewport:{width,height:900}});
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      const opener = page.getByRole('button',{name:'Abrir foto 1 do imóvel',exact:true});
      await opener.click();
      const dialog = page.getByRole('dialog');
      await dialog.waitFor();
      assert.match(await dialog.innerText(),/1 \/ 3/);
      await page.keyboard.press('ArrowRight');
      await dialog.getByText('Quarto',{exact:true}).waitFor();
      await dialog.getByRole('button',{name:'Próxima foto'}).click();
      await dialog.getByText('Areas comuns - Piscina',{exact:true}).waitFor();
      await dialog.getByRole('button',{name:'Próxima foto'}).click();
      await dialog.getByText('Sala',{exact:true}).waitFor();
      await page.keyboard.press('Escape');
      await dialog.waitFor({state:'hidden'});
      assert(await opener.evaluate(el=>el===document.activeElement));
      await page.getByRole('button',{name:'Abrir foto 2 do imóvel',exact:true}).click();
      await dialog.getByText('Quarto',{exact:true}).waitFor();
      await dialog.getByRole('button',{name:'Fechar',exact:true}).click();
      await page.goto(`http://127.0.0.1:${server.address().port}/?single`);
      await opener.click();
      assert.equal(await dialog.getByRole('button',{name:'Próxima foto'}).count(),0);
      await page.close();
    }
    console.log('PASS: opening, clicked index, property/condominium order, deduplication, arrows, wrap, Escape, focus restoration, single photo; desktop/mobile.');
  } finally { if (browser) await browser.close(); await new Promise(resolve=>server.close(resolve)); }
}
main().catch(error=>{console.error(error);process.exitCode=1;});
