// Build an isolated copy: never copy .env files, never reuse this artifact for deployment.
const fs=require('node:fs');const path=require('node:path');const {spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..');
const target=path.join(root,'.audit-build',String(Date.now()));fs.mkdirSync(target,{recursive:true});
for(const name of ['app','components','data','lib','public','scripts','tests','db']) {
 if(fs.existsSync(path.join(root,name))) fs.cpSync(path.join(root,name),path.join(target,name),{recursive:true,filter:p=>!path.basename(p).startsWith('.env')});
}
for(const name of ['package.json','package-lock.json','tsconfig.json','next-env.d.ts','next.config.ts','postcss.config.mjs','tailwind.config.ts','middleware.ts']) {
 if(fs.existsSync(path.join(root,name))) fs.copyFileSync(path.join(root,name),path.join(target,name));
}
const configPath=path.join(target,'next.config.ts');
fs.writeFileSync(configPath,fs.readFileSync(configPath,'utf8').replace('const nextConfig: NextConfig = {','const nextConfig: NextConfig = { outputFileTracingRoot: process.cwd(),'));
fs.symlinkSync(path.join(root,'node_modules'),path.join(target,'node_modules'),'junction');
// Next provides this explicit font mocking hook for its own offline tests.
const fontMock=path.join(target,'font-mock.cjs');
fs.writeFileSync(fontMock,`module.exports=new Proxy({}, {get:()=> '/* latin */ @font-face {font-family: "DM Sans";font-style: normal;font-weight: 100 900;src: url(https://fonts.gstatic.com/offline.woff2) format("woff2");}'});`);
const env={};for(const key of ['PATH','Path','SystemRoot','SYSTEMROOT','WINDIR','TEMP','TMP','ComSpec','PATHEXT','SystemDrive'])if(process.env[key])env[key]=process.env[key];
Object.assign(env,{NODE_ENV:'production',VERCEL_ENV:'production',SANITY_PROJECT_ID:'offline',SANITY_DATASET:'fixture',NEXT_TELEMETRY_DISABLED:'1',NEXT_FONT_GOOGLE_MOCKED_RESPONSES:fontMock,NODE_OPTIONS:`--require "${path.join(root,'tests/offline.cjs').replaceAll('\\','/')}"`});
console.log('Offline build copy:',target);console.log('Application source is unchanged; font bytes and Sanity identifiers are synthetic. No credentials or remote I/O. NOT A DEPLOYABLE ARTIFACT.');
const result=spawnSync(process.execPath,[path.join(root,'node_modules/next/dist/bin/next'),'build'],{cwd:target,env,stdio:'inherit'});
process.exitCode=result.status??1;
