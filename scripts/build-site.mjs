import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createZip} from './create-zip.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
export const publicFiles=['index.html','styles.css','app.js','store.js','inventory.js','ui-state.js','facebook.js','bridge-client.js','model.js','logo.png','favicon.svg','pulse-conector.zip'];
export async function siteAssets(directory=root){
  const assets=new Map(await Promise.all(publicFiles.map(async name=>{
    const bytes=await readFile(path.join(directory,name));
    const content=/\.(?:html|css|js|svg)$/.test(name)?Buffer.from(bytes.toString('utf8').replace(/^\uFEFF/,'').replaceAll('\r\n','\n')):bytes;
    return [name,content];
  })));
  // Uma dependência nova precisa entrar no pacote, em vez de funcionar só localmente.
  for(const [name,bytes] of assets){
    if(!name.endsWith('.js')&&!name.endsWith('.html'))continue;
    const content=bytes.toString('utf8');
    const references=name.endsWith('.js')?[...content.matchAll(/\bfrom\s*['"]\.\/([^'"]+)['"]/g)].map(m=>m[1]):[...content.matchAll(/(?:src|href)="([^"#]+)"/g)].map(m=>m[1]).filter(value=>!value.includes(':'));
    for(const reference of references)if(!assets.has(reference))throw new Error(`${name} depende de ${reference}, ausente no pacote de publicação.`);
  }
  assets.set('_headers',Buffer.from(`/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Cache-Control: no-cache
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'
`));
  const info=JSON.parse(await readFile(path.join(directory,'package.json'),'utf8'));
  const hash=createHash('sha256');for(const [name,bytes] of [...assets].sort(([a],[b])=>a.localeCompare(b))){hash.update(name);hash.update(bytes)}
  assets.set('release.json',Buffer.from(JSON.stringify({app:'Pulse',version:info.version,sha256:hash.digest('hex')},null,2)+'\n'));
  return assets;
}
export async function buildSite(){
  const assets=await siteAssets(),output=path.join(root,'dist');await mkdir(output,{recursive:true});
  // Escreve apenas a lista pública. Fontes de desenvolvimento e dados locais não entram no ZIP.
  for(const [name,bytes] of assets)await writeFile(path.join(output,name),bytes);
  const archive=path.resolve(root,'../pulse-publicacao.zip');await writeFile(archive,createZip(assets));
  console.log(`Pulse preparada: ${assets.size} arquivos em dist/ e ${archive}`);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))await buildSite();
