import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createExtensionClient} from './bridge-client.js';
const origin='https://pulse-vendas-demo.netlify.app';
function browser(connectors){
  const listeners=new Set(),calls=[];
  const win={addEventListener:(_,fn)=>listeners.add(fn),removeEventListener:(_,fn)=>listeners.delete(fn),postMessage:m=>{
    for(const connector of connectors){
      if(connector.legacy||!connector.active||(m.connectorId&&m.connectorId!==connector.id))continue;
      calls.push({connector:connector.id,command:m.command,target:m.connectorId});
      queueMicrotask(()=>{const data=m.command==='DISCOVER_V2'?{version:'0.5.1',connectorId:connector.id}:{ok:true};for(const fn of [...listeners])fn({source:win,origin,data:{channel:'patio:reply',id:m.id,connectorId:connector.id,ok:true,data}})});
    }
  }};
  return {win,calls};
}
test('com duas cópias, todas as operações vão para um único conector',async()=>{
  const {win,calls}=browser([{id:'a',active:true},{id:'b',active:true}]),request=createExtensionClient(win,origin);
  assert.equal((await request('PING',{},100)).connectorId,'a');
  await request('PREPARE',{car:{id:'tcross'}});await request('STATUS',{ids:['tcross']});await request('FOCUS',{id:'tcross'});await request('PING',{},100);
  const writes=calls.filter(c=>c.command!=='DISCOVER_V2');
  assert.equal(writes.length,3);assert.ok(writes.every(c=>c.connector==='a'&&c.target==='a'));assert.ok(calls.every(c=>c.command.endsWith('_V2')));
});
test('cópia antiga não recebe Preparar e solicitações simultâneas compartilham descoberta',async()=>{
  const {win,calls}=browser([{id:'old',active:true,legacy:true},{id:'new',active:true}]),request=createExtensionClient(win,origin);
  await Promise.all([request('PREPARE',{car:{id:'a'}}),request('PREPARE',{car:{id:'b'}})]);
  assert.equal(calls.filter(c=>c.command==='DISCOVER_V2').length,1);assert.ok(calls.every(c=>c.connector==='new'));
});
test('se o conector escolhido sair, não envia ao outro sem redescobrir',async()=>{
  const connectors=[{id:'a',active:true},{id:'b',active:true}],{win,calls}=browser(connectors),request=createExtensionClient(win,origin);
  await request('PING',{},100);connectors[0].active=false;
  await assert.rejects(request('PREPARE',{car:{id:'a'}},10),/desconectado/);
  assert.equal(calls.filter(c=>c.command==='PREPARE_V2').length,0);
  assert.equal((await request('PING',{},100)).connectorId,'b');await request('PREPARE',{car:{id:'a'}});
  assert.equal(calls.filter(c=>c.command==='PREPARE_V2').length,1);
});
