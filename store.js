import {migrateCars} from './inventory.js';
let connection;
async function db(){
  if(!connection)connection=new Promise((resolve,reject)=>{
    const r=indexedDB.open('pulse-workspace-v1',1);
    r.onupgradeneeded=()=>{r.result.createObjectStore('cars',{keyPath:'id'});r.result.createObjectStore('activity',{keyPath:'id'});r.result.createObjectStore('meta')};
    r.onsuccess=()=>resolve(r.result);
    r.onerror=()=>{connection=null;reject(new Error('O navegador não permitiu abrir os dados locais.'))};
  });return connection;
}
async function tx(stores,mode,action){const d=await db();return new Promise((resolve,reject)=>{
  const t=d.transaction(stores,mode),r=action(t);t.oncomplete=()=>resolve(r?.result);
  t.onerror=t.onabort=()=>reject(new Error(t.error?.name==='QuotaExceededError'?'O navegador está sem espaço. Use fotos menores.':'Não foi possível salvar. Os dados anteriores foram preservados.'));
})}
async function previousCars(){return new Promise((resolve,reject)=>{
  const r=indexedDB.open('pulse-public-demo-v1');
  let absent=false;r.onupgradeneeded=()=>{absent=true;r.transaction.abort()};
  r.onerror=()=>absent?resolve([]):reject(new Error('Não foi possível ler os cadastros anteriores. Tente recarregar.'));
  r.onsuccess=()=>{const old=r.result;if(!old.objectStoreNames.contains('cars')){old.close();resolve([]);return}
    const t=old.transaction('cars','readonly'),q=t.objectStore('cars').getAll();
    t.oncomplete=()=>{old.close();resolve(q.result)};t.onerror=()=>{old.close();reject(new Error('Não foi possível recuperar os cadastros anteriores.'))};
  };
})}
export async function initialize(){
  const migrated=await tx(['meta'],'readonly',t=>t.objectStore('meta').get('migrated'));
  if(!migrated){const cars=migrateCars(await previousCars());await tx(['cars','meta'],'readwrite',t=>{
    for(const car of cars)t.objectStore('cars').put(car);t.objectStore('meta').put(true,'migrated');
  })}return list();
}
export const list=()=>tx(['cars'],'readonly',t=>t.objectStore('cars').getAll());
export const save=car=>tx(['cars'],'readwrite',t=>t.objectStore('cars').put(car));
export const log=(title,detail='',type='info')=>tx(['activity'],'readwrite',t=>t.objectStore('activity').put({id:crypto.randomUUID(),title,detail,type,at:Date.now()}));
export async function activity(){return (await tx(['activity'],'readonly',t=>t.objectStore('activity').getAll())).sort((a,b)=>b.at-a.at).slice(0,100)}
export async function backup(){return {format:'pulse-backup',version:1,exportedAt:new Date().toISOString(),cars:await list()}}
