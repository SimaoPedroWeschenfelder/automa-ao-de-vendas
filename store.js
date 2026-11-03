import {seedCars,recover} from './demo.js';
let connection;
async function db(){if(!connection)connection=new Promise((resolve,reject)=>{const r=indexedDB.open('pulse-public-demo-v1',1);r.onupgradeneeded=()=>{r.result.createObjectStore('cars',{keyPath:'id'});r.result.createObjectStore('activity',{keyPath:'id'});r.result.createObjectStore('meta')};r.onsuccess=()=>resolve(r.result);r.onerror=()=>{connection=null;reject(new Error('O navegador não permitiu salvar a demo. Confira o armazenamento local.'))}});return connection}
async function tx(stores,mode,action){const d=await db();return new Promise((resolve,reject)=>{const t=d.transaction(stores,mode),r=action(t);t.oncomplete=()=>resolve(r?.result);t.onerror=t.onabort=()=>reject(new Error(t.error?.name==='QuotaExceededError'?'O navegador está sem espaço. Use fotos menores.':'Não foi possível salvar. Seus dados anteriores foram preservados.'))})}
export async function initialize(){await tx(['meta','cars'],'readwrite',t=>{const m=t.objectStore('meta'),r=m.get('seeded');r.onsuccess=()=>{if(!r.result){seedCars().forEach(c=>t.objectStore('cars').put(c));m.put(true,'seeded')}}});const cars=await list();for(const c of cars)if(c.status==='preparing'&&!c.realJob)await save(recover(c));return list()}
export const list=()=>tx(['cars'],'readonly',t=>t.objectStore('cars').getAll());
export const save=c=>tx(['cars'],'readwrite',t=>t.objectStore('cars').put(c));
export async function log(title,detail='',type='info'){await tx(['activity'],'readwrite',t=>t.objectStore('activity').put({id:crypto.randomUUID(),title,detail,type,at:Date.now()}))}
export async function activity(){return (await tx(['activity'],'readonly',t=>t.objectStore('activity').getAll())).sort((a,b)=>b.at-a.at).slice(0,100)}
export async function reset(){await tx(['cars','activity','meta'],'readwrite',t=>{for(const name of ['cars','activity','meta'])t.objectStore(name).clear()});return initialize()}
