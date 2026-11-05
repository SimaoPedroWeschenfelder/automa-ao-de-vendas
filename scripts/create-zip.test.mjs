import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createZip} from './create-zip.mjs';
import {zipFiles} from './check-release.mjs';
test('empacota caminhos UTF-8, subpastas e conteúdo binário sem perda',()=>{
  const files=new Map([['sub/ação.txt',Buffer.from('Olá, Pulse!')],['manifest.json',Buffer.from('{"version":"0.5.2"}')],['imagem.bin',Buffer.from([0,255,128,13,10])]]);
  const extracted=zipFiles(createZip(files));assert.equal(extracted.size,files.size);
  for(const [name,bytes] of files)assert.deepEqual(extracted.get(name),bytes);
});
test('mesmos arquivos geram os mesmos bytes independentemente da ordem de leitura',()=>{
  const files=[['b.js',Buffer.from('b')],['a.js',Buffer.from('a')]];
  assert.deepEqual(createZip(new Map(files)),createZip(new Map([...files].reverse())));
  assert.throws(()=>createZip(new Map([['../fora.txt',Buffer.from('x')]])),/inválido/);
});
