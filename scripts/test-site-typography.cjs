const assert=require('node:assert/strict');
const {readFileSync,readdirSync,mkdirSync}=require('node:fs');
const {createServer}=require('node:http');
const {join}=require('node:path');
const {tmpdir}=require('node:os');

async function main(){
  const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
  const bundle=await require('esbuild').build({stdin:{contents:`
    import React from 'react';import {createRoot} from 'react-dom/client';
    import {HeaderClient} from './components/layout/HeaderClient';import {Footer} from './components/layout/Footer';
    import {HomeHeroSearch} from './components/search/HomeHeroSearch';
    createRoot(document.getElementById('root')).render(<><HeaderClient condominios={[{label:'Royal Park Residence e Resort',href:'/condominios/royal-park'}]} lancamentos={[{label:'Lancamento de teste',href:'/lancamentos/teste'}]} />
      <main className="site-container" style={{paddingTop:120,paddingBottom:64}}><HomeHeroSearch filterOptions={{bairros:['Gleba Palhano','Terra Bonita'],condominios:['Royal Park Residence e Resort'],tipos:['Apartamento','Casa']}} /></main><Footer/></>);
  `,resolveDir:process.cwd(),loader:'tsx'},bundle:true,write:false,jsx:'automatic',plugins:[{name:'next-fixture',setup(build){
    build.onResolve({filter:/^next\/(image|link|navigation)$/},args=>({path:args.path,namespace:'fixture'}));
    build.onLoad({filter:/.*/,namespace:'fixture'},args=>({loader:'jsx',resolveDir:process.cwd(),contents:args.path.endsWith('navigation')?
      "export const usePathname=()=>'/';export const useRouter=()=>({push:()=>{}});":
      `import React from 'react';export default function Stub({fill,priority,prefetch,...props}){return React.createElement('${args.path.endsWith('image')?'img':'a'}',props);}`
    }));
  }}]});
  const css=(await require('postcss')([require('tailwindcss')({...require('../tailwind.config.ts').default,content:['./components/layout/*.tsx','./components/search/HomeHeroSearch.tsx']})]).process(readFileSync('app/globals.css','utf8'),{from:undefined})).css;
  const font=readdirSync('.next/static/media').find(name=>name.endsWith('-s.p.woff2'));assert(font);
  const server=createServer((req,res)=>{
    if(req.url==='/bundle.js'){res.setHeader('Content-Type','application/javascript');return res.end(bundle.outputFiles[0].text);}
    if(req.url==='/font.woff2'){res.setHeader('Content-Type','font/woff2');return res.end(readFileSync(join('.next/static/media',font)));}
    if(['/images/logo-white.png','/images/logo-navy.png'].includes(req.url)){res.setHeader('Content-Type','image/png');return res.end(readFileSync(`public${req.url}`));}
    res.setHeader('Content-Type','text/html');res.end(`<html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>@font-face{font-family:'DM Sans';src:url('/font.woff2');font-weight:100 900}:root{--font-dm-sans:'DM Sans'}${css}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>`);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));let browser;
  try{
    browser=await chromium.launch({channel:'msedge',headless:true});const output=join(tmpdir(),'premium-typography');mkdirSync(output,{recursive:true});
    for(const width of [1440,1280,1024,900,768,390,320]){
      const page=await browser.newPage({viewport:{width,height:1000}});
      await page.goto(`http://127.0.0.1:${server.address().port}`);await page.getByRole('tab',{name:'Busca inteligente',exact:true}).waitFor();await page.evaluate(()=>document.fonts.ready);
      await page.screenshot({path:join(output,`${width}.png`),fullPage:true});
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`overflow at ${width}`);
      const issues=await page.locator('nav > div').evaluate(container=>{
        const boxes=[...container.children].filter(el=>getComputedStyle(el).display!=='none').map(el=>el.getBoundingClientRect());
        return boxes.some((rect,i)=>boxes.slice(i+1).some(next=>Math.min(rect.right,next.right)>Math.max(rect.left,next.left)+1));
      });
      assert(!issues,`header overlap at ${width}`);
      const tiny=await page.locator('footer a, footer p').evaluateAll(nodes=>nodes.filter(el=>parseFloat(getComputedStyle(el).fontSize)<12).map(el=>el.textContent));
      assert.deepEqual(tiny,[],`small footer text at ${width}`);
      const clipped=await page.locator('footer a, footer p').evaluateAll(nodes=>nodes.filter(el=>el.clientWidth && el.scrollWidth>el.clientWidth+1).map(el=>el.textContent));
      assert.deepEqual(clipped,[],`clipped footer text at ${width}`);
      const menu=page.getByRole('button',{name:'Abrir menu',exact:true});
      if(await menu.isVisible()){
        await menu.click();await page.getByRole('button',{name:'Fechar menu',exact:true}).waitFor();
        assert(await page.getByRole('link',{name:'Comprar',exact:true}).isVisible());
        await page.getByRole('button',{name:'Fechar menu',exact:true}).click();
      }
      await page.getByRole('tab',{name:'Busca por filtros',exact:true}).click();
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`filter tab overflow at ${width}`);
      await page.close();
    }
    console.log(`Typography, header, footer and tabs passed at 1440/1280/1024/900/768/390/320px. Screenshots: ${output}`);
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
