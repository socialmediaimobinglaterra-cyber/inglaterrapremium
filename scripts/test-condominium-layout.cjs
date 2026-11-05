const assert = require('node:assert/strict');
const {readFileSync,readdirSync,mkdirSync} = require('node:fs');
const {createServer} = require('node:http');
const {join} = require('node:path');
const {tmpdir} = require('node:os');
const esbuild = require('esbuild');

async function main() {
  const {chromium} = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
  const condo = {id:'1',nome:'Reserva Bela Suíça',slug:'reserva',bairro:'Bela Suíça',cidade:'Londrina',estado:'PR',imoveisCount:5,unidades:'42 lotes',areaTotal:'85.000 m²',seguranca:'Portaria 24h',descricao:'Um condomínio para viver com tranquilidade, próximo às principais conveniências de Londrina.',descricao2:null,diferenciais:['Portaria 24h','Piscina e quadra'],endereco:'Rua de exemplo, 100',latitude:-23.34,longitude:-51.2,image:'/photo.jpg',galeria:[{url:'/photo.jpg',alt:'Foto de imóvel'}],galeriaPropria:[]};
  const listings = Array.from({length:3},(_,i)=>({id:String(i),codigo:`CA${i}`,slug:`casa-${i}`,titulo:'Casa com piscina e área gourmet',bairro:'Bela Suíça',cidade:'Londrina',tipo:'Casa',area:320,suites:3,dormitorios:4,vagas:2,precoVenda:2500000,precoLocacao:i===0?8000:null,image:'/photo.jpg',tag:'PREMIUM'}));
  const bundle = await esbuild.build({
    stdin:{contents:`import React from 'react';import {createRoot} from 'react-dom/client';import Page from './app/condominios/[slug]/page';
      Page({params:Promise.resolve({slug:location.search.includes('own')?'own':'fallback'})}).then(page=>createRoot(document.getElementById('root')).render(page));`,resolveDir:process.cwd(),loader:'tsx'},
    bundle:true,write:false,format:'iife',jsx:'automatic',plugins:[{name:'fixture',setup(build){
      build.onResolve({filter:/^(next\/link|next\/image|next\/navigation|@\/lib\/queries\/condominios)$/},args=>({path:args.path,namespace:'fixture'}));
      build.onLoad({filter:/.*/,namespace:'fixture'},args=>({loader:'jsx',resolveDir:process.cwd(),contents:args.path.endsWith('condominios')?
        `const condo=${JSON.stringify(condo)};export async function getCondominioBySlug(slug){return {...condo,galeriaPropria:slug==='own'?[{url:'/common.jpg',alt:'Piscina do condomínio'}]:[]};}export async function getCondominioImoveis(){return ${JSON.stringify(listings)};}export async function getRelatedCondominios(){return [{...condo,id:'2',slug:'outro',nome:'Outro condomínio'}];}`:
        args.path.endsWith('navigation')?`export function notFound(){throw new Error('not found');}`:
        `import React from 'react';export default function Stub({fill,priority,...props}){return React.createElement('${args.path.endsWith('image')?'img':'a'}',props);}`
      }));
    }}],
  });
  const css=(await require('postcss')([require('tailwindcss')({...require('../tailwind.config.ts').default,content:['./app/condominios/**/*.tsx','./components/condominios/*.tsx','./components/ui/GalleryLightbox.tsx']})]).process(readFileSync('app/globals.css','utf8'),{from:undefined})).css;
  const font=readdirSync('.next/static/media').find(name=>name.endsWith('-s.p.woff2'));
  assert(font,'Build the project first to prepare DM Sans.');
  const server=createServer((req,res)=>{
    if(req.url==='/font.woff2'){res.setHeader('Content-Type','font/woff2');return res.end(readFileSync(join('.next/static/media',font)));}
    if(req.url==='/bundle.js'){res.setHeader('Content-Type','application/javascript');return res.end(bundle.outputFiles[0].text);}
    if(req.url.endsWith('.jpg')){res.setHeader('Content-Type','image/jpeg');return res.end(readFileSync('public/images/capa-hero.jpg'));}
    res.setHeader('Content-Type','text/html');res.end(`<html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>@font-face{font-family:'DM Sans';src:url('/font.woff2');font-weight:100 900;font-display:swap}:root{--font-dm-sans:'DM Sans'}${css}</style></head><body><div id="root"></div><script src="/bundle.js"></script></body></html>`);
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser;
  const output=join(tmpdir(),'premium-condominium-layout');mkdirSync(output,{recursive:true});
  try{
    browser=await chromium.launch({channel:'msedge',headless:true});
    for(const width of [1440,390,320]){
      const page=await browser.newPage({viewport:{width,height:900}});
      const errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.goto(`http://127.0.0.1:${server.address().port}`);
      await page.getByRole('heading',{name:'Imóveis disponíveis neste condomínio'}).waitFor();
      await page.evaluate(()=>document.fonts.ready);
      assert.equal(await page.getByRole('link',{name:'5 imóveis disponíveis',exact:true}).count(),1);
      const headings=await page.locator('h2').allTextContents();
      assert.equal(headings[0],'Imóveis disponíveis neste condomínio');
      assert.equal(headings.at(-1),'Outros condomínios');
      assert(!headings.includes('Condomínio e áreas comuns'));
      assert.equal(await page.getByText('Conhecer imóvel',{exact:true}).count(),3);
      assert.equal(await page.getByText('Locação / mês',{exact:true}).count(),1);
      assert.equal(await page.getByRole('textbox',{name:'WhatsApp',exact:true}).count(),1);
      const card=page.locator('a[href="/imoveis/casa-0"]');
      const image=await card.locator('img').boundingBox();
      const heading=await card.locator('h3').boundingBox();
      assert(width>=768?heading.x>=image.x+image.width:heading.y>=image.y+image.height);
      assert.equal(await page.locator('main > div img').count(),0,'No duplicated hero image');
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      await page.screenshot({path:join(output,`layout-${width}.png`),fullPage:true});
      await page.goto(`http://127.0.0.1:${server.address().port}/?own`);
      await page.getByRole('heading',{name:'Condomínio e áreas comuns'}).waitFor();
      const gallery=page.locator('section').filter({has:page.getByRole('heading',{name:'Condomínio e áreas comuns'})});
      assert.equal(await gallery.locator('img[src="/photo.jpg"]').count(),0);
      await gallery.getByRole('button',{name:width>=768?'Abrir foto principal em tela cheia':'Abrir foto 1 em tela cheia',exact:true}).first().click();
      await page.getByRole('dialog').waitFor();
      await page.getByRole('button',{name:'Fechar',exact:true}).click();
      assert.deepEqual(errors,[]);
      await page.close();
    }
    console.log(`PASS: section order, availability count, editorial rows, two prices, own-gallery only, gallery modal, accessible fields, no overflow on desktop/mobile. Screenshots: ${output}`);
  }finally{if(browser)await browser.close();await new Promise(resolve=>server.close(resolve));}
}
main().catch(error=>{console.error(error);process.exitCode=1;});
