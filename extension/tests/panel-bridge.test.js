import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFile} from 'node:fs/promises';
const source=await readFile(new URL('../panel-bridge.js',import.meta.url),'utf8');
function setup(){
  const listeners=[],calls=[],replies=[],origin='https://pulse-vendas-demo.netlify.app';
  const win={addEventListener:(_,fn)=>listeners.push(fn),postMessage:m=>replies.push(m)};
  for(const id of ['a','b'])vm.runInNewContext(source,{window:win,location:{origin,pathname:'/'},chrome:{runtime:{id,sendMessage:async m=>{calls.push({id,type:m.type});return {ok:true,data:{connectorId:id,version:'0.5.1'}}}}}});
  const send=async(message,from=win,eventOrigin=origin)=>Promise.all(listeners.map(fn=>fn({source:from,origin:eventOrigin,data:{channel:'patio:request',id:'request',...message}})));
  return {send,calls,replies};
}
test('duas extensões descobertas abrem só pelo destinatário escolhido',async()=>{
  const {send,calls,replies}=setup();await send({command:'DISCOVER_V2'});
  assert.equal(replies.length,2);assert.deepEqual(replies.map(r=>r.connectorId),['a','b']);calls.length=0;
  await send({command:'PREPARE_V2',connectorId:'b',args:{car:{id:'tcross'}}});
  assert.deepEqual(calls,[{id:'b',type:'LOCAL_PREPARE'}]);
});
test('comando antigo, sem destinatário ou vindo de outra origem não abre abas',async()=>{
  const {send,calls}=setup();await send({command:'PREPARE'});await send({command:'PREPARE_V2'});await send({command:'PREPARE_V2',connectorId:'a'},{});await send({command:'PREPARE_V2',connectorId:'a'},undefined,'https://outro.test');
  assert.equal(calls.length,0);
});
