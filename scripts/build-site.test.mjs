import {test} from 'node:test';
import assert from 'node:assert/strict';
import {siteAssets,publicFiles} from './build-site.mjs';
import {createZip} from './create-zip.mjs';
import {zipFiles} from './check-release.mjs';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
test('pacote publicado contém dependências do painel, conector e identificação verificável',async()=>{
  const assets=await siteAssets(),archive=zipFiles(createZip(assets));
  for(const name of publicFiles)assert.ok(archive.get(name).equals(assets.get(name)),name);
  const release=JSON.parse(archive.get('release.json'));assert.equal(release.app,'Pulse');assert.match(release.sha256,/^[a-f0-9]{64}$/);
  assert.match(archive.get('_headers').toString(),/Content-Security-Policy/);
});
test('publicação exclui repositório, testes, configurações locais e demonstração antiga',async()=>{
  const assets=await siteAssets();for(const name of assets.keys())assert.doesNotMatch(name,/^(?:\.git|\.local|\.env|extension\/|scripts\/|demo\.|cars\.png|CONTINUIDADE|README)/);
});
test('checkout Windows e Linux geram o mesmo pacote público',async()=>{
  const assets=await siteAssets(),temporary=await mkdtemp(path.join(os.tmpdir(),'pulse-build-'));
  try{
    for(const name of publicFiles){const original=assets.get(name),bytes=/\.(?:html|css|js|svg)$/.test(name)?Buffer.from('\uFEFF'+original.toString('utf8').replaceAll('\n','\r\n')):original;await writeFile(path.join(temporary,name),bytes)}
    await writeFile(path.join(temporary,'package.json'),JSON.stringify({version:JSON.parse(assets.get('release.json')).version}));
    assert.ok(createZip(await siteAssets(temporary)).equals(createZip(assets)));
  }finally{assert.equal(path.dirname(temporary),os.tmpdir());assert.ok(path.basename(temporary).startsWith('pulse-build-'));await rm(temporary,{recursive:true,force:true})}
});
