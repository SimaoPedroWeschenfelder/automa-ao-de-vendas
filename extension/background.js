import { validate, listingUrl, backupCars, snapshot } from './model.js';
import {createTaskManager} from './task-manager.js';
import {panelOrigin,panelCarKey,isFacebookUrl} from './bridge-policy.js';
const db = new Promise((resolve, reject) => {
  const r = indexedDB.open('patio-piloto', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('cars', { keyPath: 'id' });
  r.onsuccess = () => resolve(r.result); r.onerror = () => reject(r.error);
});
async function query(mode, action) {
  const d = await db;
  return new Promise((resolve, reject) => {
    const t = d.transaction('cars', mode), r = action(t.objectStore('cars'));
    t.oncomplete = () => resolve(r.result); t.onerror = () => reject(t.error); t.onabort = () => reject(t.error);
  });
}
const get = id => query('readonly', s => s.get(id));
const put = c => query('readwrite', s => s.put(c));
chrome.action.onClicked.addListener(() => chrome.tabs.create({url:'https://pulse-vendas-demo.netlify.app/'}));
function panelSender(sender) { return sender.url === chrome.runtime.getURL('panel.html'); }
const tasks=createTaskManager({get,put,tabs:chrome.tabs,session:chrome.storage.session});
async function handle(m, sender) {
  if(panelOrigin(sender.url)){
    if(m.type==='LOCAL_PING')return {version:chrome.runtime.getManifest().version,connectorId:chrome.runtime.id};
    if(m.type==='LOCAL_PREPARE'){
      const raw=m.args?.car,key=panelCarKey(raw?.id,sender.url);
      const [car]=backupCars({format:'patio-backup',version:1,cars:[raw]});
      return tasks.prepare(key,car);
    }
    if(m.type==='LOCAL_STATUS'){
      const ids=m.args?.ids;if(!Array.isArray(ids)||ids.length>100)throw new Error('Consulta inválida.');
      return Promise.all(ids.map(async id=>{const c=await get(panelCarKey(id,sender.url));return c?{id,status:c.status,result:c.result,phase:c.phase||'',report:c.report||'',tabId:c.tabId,preparedAt:c.preparedAt,progressAt:c.progressAt,jobId:c.jobId}:null}));
    }
    if(m.type==='LOCAL_FOCUS'){
      const c=await get(panelCarKey(m.args?.id,sender.url));if(!c?.tabId)throw new Error('Aba de preparação não encontrada.');
      try{await chrome.tabs.update(c.tabId,{active:true});return true}catch{throw new Error('A aba foi fechada. Prepare novamente se o carro ainda não foi publicado.')}
    }
    throw new Error('Operação local não autorizada.');
  }
  if (panelSender(sender)) {
    if (m.type === 'LIST') return query('readonly', s => s.getAll());
    if (m.type === 'SAVE') {
      const c = validate(m.car), old = c.id ? await get(c.id) : null;
      const changed=old&&JSON.stringify(snapshot(old))!==JSON.stringify(snapshot(c));
      const reset=changed&&!['published','sale_pending','sold'].includes(old.status);
      const saved = {...c, id: old?.id || crypto.randomUUID(), status: reset?'draft':old?.status || 'draft', updated: Date.now(),...(reset?{jobId:null,tabId:null,result:null,phase:'',report:''}:{})};
      await put(saved); return saved;
    }
    if (m.type === 'OPEN') {
      const c = await get(m.id); if (!c) throw new Error('Carro não encontrado.');
      return tasks.prepare(c.id);
    }
    if (m.type === 'FOCUS') {
      const c = await get(m.id); if (!c) throw new Error('Carro não encontrado.');
      if(c.tabId) { try { await chrome.tabs.update(c.tabId,{active:true}); return true; } catch {} }
      throw new Error('A aba foi fechada. Prepare novamente para reabrir o formulário.');
    }
    if (m.type === 'LINK') {
      const c = await get(m.id), url = listingUrl(m.url);
      if (!c || !url) throw new Error('Use o link https://www.facebook.com/marketplace/item/NUMERO/');
      await put({...c,url,status:'published'}); return true;
    }
    if (m.type === 'SOLD') {
      const c = await get(m.id); if (!c || !listingUrl(c.url)) throw new Error('Registre o link publicado primeiro.');
      await put({...c,status:'sale_pending'});
      await chrome.tabs.create({url:c.url}); return true;
    }
    if (m.type === 'CONFIRM_SOLD') {
      const c = await get(m.id); if (!c || c.status !== 'sale_pending') throw new Error('Retirada não iniciada.');
      await put({...c,status:'sold'}); return true;
    }
    throw new Error('Operação desconhecida.');
  }
  const t = sender.tab;
  if (!t || !isFacebookUrl(sender.url)) throw new Error('Origem não autorizada.');
  if (m.type === 'JOB')return tasks.job(t.id);
  if (m.type === 'START')return tasks.start(t.id);
  if (m.type === 'RETRY')return tasks.start(t.id,true);
  if (m.type === 'PROGRESS')return tasks.update(t.id,m);
  if (m.type === 'REPORT')return tasks.update(t.id,m,true);
  throw new Error('Operação não autorizada.');
}
chrome.runtime.onMessage.addListener((m,s,reply) => { handle(m,s).then(data=>reply({ok:true,data}),e=>reply({ok:false,error:e.message})); return true; });
chrome.tabs.onRemoved.addListener(id=>tasks.closed(id).catch(()=>{}));
