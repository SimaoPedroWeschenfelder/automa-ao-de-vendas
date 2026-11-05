import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createTaskManager} from '../task-manager.js';
import {taskIndicator,currentJob,supportsBackground} from '../task-state.js';
const car={id:'car-1',brand:'Volkswagen',model:'T-Cross',year:2022,price:115000,mileage:42000,photos:[],status:'draft'};
function setup(){
  const records=new Map([[car.id,structuredClone(car)]]),jobs={},tabs=new Map();let next=100,fail=false;
  const api={
    get:async id=>{if(!tabs.has(id))throw new Error('Aba fechada');return structuredClone(tabs.get(id))},
    create:async options=>{const tab={id:++next,...options};tabs.set(tab.id,tab);return tab},
    update:async(id,options)=>{if(fail)throw new Error('Falha de navegação');assert.ok(jobs['job:'+id]);Object.assign(tabs.get(id),options)},
    remove:async id=>tabs.delete(id)
  };
  const tasks=createTaskManager({get:async id=>structuredClone(records.get(id)),put:async c=>records.set(c.id,structuredClone(c)),tabs:api,session:{get:async key=>({[key]:structuredClone(jobs[key])}),set:async value=>Object.assign(jobs,structuredClone(value)),remove:async key=>{delete jobs[key]}},now:()=>1000000});
  return {tasks,records,jobs,tabs,fail:()=>fail=true};
}
test('abre em segundo plano e cliques simultâneos reutilizam a mesma aba',async()=>{const e=setup();const all=await Promise.all(Array.from({length:8},()=>e.tasks.prepare(car.id)));assert.equal(e.tabs.size,1);assert.equal(all.filter(r=>!r.reused).length,1);assert.equal([...e.tabs.values()][0].active,false);assert.equal((await e.tasks.job(all[0].tabId)).car.model,'T-Cross')});
test('início automático só acontece uma vez mesmo com mensagens simultâneas',async()=>{const e=setup(),r=await e.tasks.prepare(car.id);assert.deepEqual((await Promise.all([e.tasks.start(r.tabId),e.tasks.start(r.tabId)])).sort(),[false,true]);assert.equal((await e.tasks.job(r.tabId)).autoStart,false);assert.equal(e.records.get(car.id).status,'preparing')});
test('relatório atrasado de outra aba não sobrescreve a preparação nova',async()=>{const e=setup(),first=await e.tasks.prepare(car.id);e.tabs.delete(first.tabId);const second=await e.tasks.prepare(car.id);assert.notEqual(first.jobId,second.jobId);assert.equal(await e.tasks.update(first.tabId,{report:'antigo',result:'ready'},true),false);assert.equal(e.records.get(car.id).jobId,second.jobId)});
test('não troca o cadastro enquanto a preparação está em andamento',async()=>{const e=setup();await e.tasks.prepare(car.id);await assert.rejects(e.tasks.prepare(car.id,{...car,price:120000}),/Já existe/);assert.equal(e.tabs.size,1);assert.equal(e.records.get(car.id).price,115000)});
test('progresso tardio não apaga o resultado e clique repetido não cria outra aba',async()=>{const e=setup(),r=await e.tasks.prepare(car.id);await e.tasks.start(r.tabId);await e.tasks.update(r.tabId,{report:'Concluído',result:'ready'},true);assert.equal(await e.tasks.update(r.tabId,{phase:'antigo'}),false);assert.equal(taskIndicator(e.records.get(car.id)).tone,'ready');assert.equal((await e.tasks.prepare(car.id)).reused,true);assert.equal(e.tabs.size,1)});
test('resultado desconhecido nunca acende verde; falha pode ser tentada novamente',async()=>{const e=setup(),r=await e.tasks.prepare(car.id);await e.tasks.start(r.tabId);await e.tasks.update(r.tabId,{report:'Sem confirmação'},true);assert.equal(taskIndicator(e.records.get(car.id)).tone,'attention');assert.equal(await e.tasks.start(r.tabId,true),true);assert.equal(taskIndicator(e.records.get(car.id),1000000).tone,'working')});
test('aba fechada antes de terminar preserva o cadastro e indica falha',async()=>{const e=setup(),r=await e.tasks.prepare(car.id);await e.tasks.closed(r.tabId);assert.equal(taskIndicator(e.records.get(car.id)).tone,'error');assert.equal(e.records.get(car.id).price,car.price);assert.equal(e.jobs['job:'+r.tabId],undefined)});
test('falha ao navegar limpa a tarefa e mantém dados para nova tentativa',async()=>{const e=setup();e.fail();await assert.rejects(e.tasks.prepare(car.id),/dados foram preservados/);assert.equal(e.tabs.size,0);assert.equal(Object.keys(e.jobs).length,0);assert.equal(taskIndicator(e.records.get(car.id)).tone,'error');assert.equal(e.records.get(car.id).model,'T-Cross')});
test('carro publicado não abre outra preparação',async()=>{const e=setup();e.records.get(car.id).status='published';await assert.rejects(e.tasks.prepare(car.id),/publicado/);assert.equal(e.tabs.size,0)});
test('tarefas antigas sem identificação não são reutilizadas após atualização',async()=>{const e=setup();e.records.set(car.id,{...car,status:'opened',tabId:50});e.tabs.set(50,{id:50});e.jobs['job:50']={id:car.id,started:true};assert.equal(currentJob(e.records.get(car.id),e.jobs['job:50'],50),false);const result=await e.tasks.prepare(car.id);assert.notEqual(result.tabId,50)});
test('sem resposta por mais de dois minutos é amarelo e rascunho não é verde',()=>{assert.equal(taskIndicator({status:'preparing',progressAt:1},200000).tone,'attention');assert.equal(taskIndicator({status:'draft',result:'ready'}).tone,'neutral')});
test('extensão antiga não pode iniciar o fluxo novo em primeiro plano',()=>{assert.equal(supportsBackground('0.3.9'),false);assert.equal(supportsBackground('0.4.0'),true);assert.equal(supportsBackground('1.0.0'),true);assert.equal(supportsBackground('desconhecida'),false)});
