import {snapshot,descriptionFor} from './model.js';
import {activeStatuses,publishedStatuses,currentJob,outcome} from './task-state.js';

export function createTaskManager({get,put,tabs,session,now=Date.now,newId=()=>crypto.randomUUID()}){
  const locks=new Map();
  async function locked(id,fn){
    const previous=locks.get(id)||Promise.resolve();
    const task=previous.catch(()=>{}).then(fn);locks.set(id,task);
    try{return await task}finally{if(locks.get(id)===task)locks.delete(id)}
  }
  const key=id=>'job:'+id;
  const jobFor=async id=>(await session.get(key(id)))[key(id)];
  const summary=c=>Object.fromEntries(['status','result','phase','report','tabId','jobId','preparedAt','progressAt'].map(k=>[k,c[k]]));
  async function prepare(id,incoming){return locked(id,async()=>{
    const old=await get(id);if(!old&&!incoming)throw new Error('Carro não encontrado.');
    if(publishedStatuses.includes(old?.status))throw new Error('Este carro já foi registrado como publicado. Confira o anúncio existente.');
    const data=snapshot(incoming||old);
    if(old?.tabId&&['opened','preparing','review'].includes(old.status)){
      let exists=false;try{await tabs.get(old.tabId);exists=true}catch{}
      const linked=await jobFor(old.tabId);
      if(exists&&currentJob(old,linked,old.tabId)){
        const unchanged=JSON.stringify(snapshot(old))===JSON.stringify(data);
        if(unchanged)return {...summary(old),reused:true};
        if(activeStatuses.includes(old.status))throw new Error('Já existe uma preparação deste carro. Aguarde terminar ou feche a aba antes de enviar dados alterados.');
      }
    }
    const c={...old,...data,id},jobId=newId();let t;
    try{t=await tabs.create({url:'about:blank',active:false})}catch(error){await put({...c,status:'error',result:'failed',report:'Não foi possível criar a aba: '+error.message,progressAt:now()});throw new Error('Não foi possível criar a aba do Facebook. Seus dados foram preservados.')}
    const prepared={...c,status:'opened',result:null,report:'',phase:'Aguardando formulário…',jobId,tabId:t.id,preparedAt:now(),progressAt:now()};
    try{
      await session.set({[key(t.id)]:{id,jobId,started:false}});await put(prepared);
      await tabs.update(t.id,{url:'https://www.facebook.com/marketplace/create/vehicle'});
      return {...summary(prepared),reused:false};
    }catch(error){
      await session.remove(key(t.id));try{await tabs.remove(t.id)}catch{}
      await put({...c,status:'error',result:'failed',report:'Não foi possível abrir o Facebook: '+error.message,progressAt:now()});
      throw new Error('Não foi possível abrir o Facebook. Seus dados foram preservados; tente novamente.');
    }
  })}
  async function job(tabId){const j=await jobFor(tabId),car=j&&await get(j.id);if(!currentJob(car,j,tabId))return null;return {car,description:descriptionFor(car),autoStart:!j.started}}
  async function start(tabId,retry=false){const j=await jobFor(tabId);if(!j)return false;return locked(j.id,async()=>{
    const latest=await jobFor(tabId),car=await get(j.id);if(!currentJob(car,latest,tabId)||(!retry&&latest.started)||(retry&&activeStatuses.includes(car.status))||publishedStatuses.includes(car.status))return false;
    await session.set({[key(tabId)]:{...latest,started:true}});
    await put({...car,status:'preparing',phase:'Preparando em segundo plano…',progressAt:now(),result:null});return true;
  })}
  async function update(tabId,message,final=false){const j=await jobFor(tabId);if(!j)return false;return locked(j.id,async()=>{
    const car=await get(j.id);if(!currentJob(car,j,tabId)||publishedStatuses.includes(car.status))return false;
    if(!final&&!activeStatuses.includes(car.status))return false;
    const result=final?outcome(message.result):null;
    await put({...car,status:final?(result==='failed'?'error':'review'):'preparing',result,phase:final?'':String(message.phase||'Preparando…').slice(0,180),report:final?String(message.report||'').slice(0,10000):car.report,progressAt:now()});return true;
  })}
  async function closed(tabId){const j=await jobFor(tabId);if(j)await locked(j.id,async()=>{
    const c=await get(j.id);if(!currentJob(c,j,tabId)||publishedStatuses.includes(c.status))return;
    await put({...c,status:activeStatuses.includes(c.status)?'error':'review',result:activeStatuses.includes(c.status)?'failed':'attention',phase:'',tabId:null,progressAt:now(),report:(c.report?c.report+'\n':'')+'⚠ A aba foi fechada. Os dados estão salvos; prepare novamente para reabrir o formulário.'});
  });await session.remove(key(tabId))}
  return {prepare,job,start,update,closed};
}
