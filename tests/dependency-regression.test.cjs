const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createRequire}=require('node:module');
test('patched sharp supports actual AVIF and WebP image conversion',async()=>{
 const sharp=require('sharp');const raw={create:{width:8,height:8,channels:3,background:'#101a26'}};
 for(const format of ['avif','webp']) {const bytes=await sharp(raw).toFormat(format).toBuffer();const info=await sharp(bytes).metadata();assert.equal(info.width,8);assert.equal(info.height,8);assert.equal(info.format,format==='avif'?'heif':format);}
});
test('Next scoped PostCSS override parses and transforms CSS',async()=>{
 const req=createRequire(require.resolve('next/package.json'));const postcss=req('postcss');
 const result=await postcss([{postcssPlugin:'fixture',Declaration(d){if(d.prop==='color')d.value='#101a26';}}]).process('a { color: red }',{from:undefined});assert.match(result.css,/#101a26/);
});
test('parser scoped minimatch keeps supported glob API and TypeScript parsing',()=>{
 const req=createRequire(require.resolve('@typescript-eslint/typescript-estree'));
 const {minimatch}=req('minimatch');assert(minimatch('src/example.ts','src/*.ts',{dot:true}));assert(!minimatch('private/key.ts','src/*.ts',{dot:true}));
 const parser=require('@typescript-eslint/parser');assert.equal(parser.parse('const value: string = "fixture"',{sourceType:'module'}).type,'Program');
});
test('Vercel config scoped Zod override retains schema validation without reading credentials',()=>{
 const req=createRequire(require.resolve('@vercel/cli-config'));const {z}=req('zod');const schema=z.object({token:z.string(),team:z.string().optional()});assert(schema.safeParse({token:'synthetic'}).success);assert(!schema.safeParse({token:7}).success);
});
