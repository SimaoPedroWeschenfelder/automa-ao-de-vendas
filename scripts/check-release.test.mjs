import {test} from 'node:test';
import assert from 'node:assert/strict';
import {cp,copyFile,mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {checkRelease,zipFiles} from './check-release.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
async function fixture(run){
  const temporary=await mkdtemp(path.join(tmpdir(),'pulse-release-test-'));
  try{
    await cp(path.join(root,'extension'),path.join(temporary,'extension'),{recursive:true});
    for(const name of ['pulse-conector.zip','bridge-client.js','model.js','task-state.js'])await copyFile(path.join(root,name),path.join(temporary,name));
    await run(temporary);
  }finally{
    assert.equal(path.dirname(path.resolve(temporary)),path.resolve(tmpdir()));
    assert.ok(path.basename(temporary).startsWith('pulse-release-test-'));
    await rm(temporary,{recursive:true,force:true});
  }
}
test('bloqueia um fonte da extensão alterado sem atualizar o ZIP',()=>fixture(async directory=>{
  await writeFile(path.join(directory,'extension/content.js'),'// versão alterada');
  await assert.rejects(checkRelease(directory),/ZIP está desatualizado: content\.js/);
}));
test('bloqueia um painel com protocolo diferente do conector empacotado',()=>fixture(async directory=>{
  await writeFile(path.join(directory,'bridge-client.js'),'// protocolo diferente');
  await assert.rejects(checkRelease(directory),/Painel e extensão divergem em bridge-client\.js/);
}));
test('recusa ZIP truncado e consegue ler o pacote real',async()=>{
  const bytes=await readFile(path.join(root,'pulse-conector.zip'));
  assert.ok(zipFiles(bytes).has('manifest.json'));
  assert.throws(()=>zipFiles(bytes.subarray(0,100)),/ZIP.*inválido/);
});
