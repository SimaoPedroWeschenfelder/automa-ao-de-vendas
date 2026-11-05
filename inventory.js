import {listingUrl,preparationWarnings,validate} from './model.js';
export const money=value=>Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL',minimumFractionDigits:0,maximumFractionDigits:2});
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export const statusInfo={draft:{label:'No estoque',tone:'neutral'},preparing:{label:'Preparando',tone:'working'},ready:{label:'Pronto para revisar',tone:'ready'},attention:{label:'Conferir pendências',tone:'attention'},error:{label:'Preparação interrompida',tone:'error'},published:{label:'Publicado',tone:'published'},sold:{label:'Vendido',tone:'sold'}};
export function filtered(cars,{query='',sort='recent'}={}){
  const q=normalize(query),list=cars.filter(c=>!q||normalize([c.brand,c.model,c.version,c.city].join(' ')).includes(q));
  return list.sort((a,b)=>sort==='low'?a.price-b.price:sort==='high'?b.price-a.price:sort==='brand'?a.brand.localeCompare(b.brand,'pt-BR'):(b.created||0)-(a.created||0));
}
// Preserva o banco da demo. Resultados simulados não viram publicação real.
export function migrateCars(cars){return cars.filter(c=>!/^demo-[0-5]$/.test(c.id)).map(c=>{
  const {imageIndex,listingId,...data}=c;
  return {...data,demo:false,status:'draft',realJob:false,realJobId:null,phase:'',report:[],needsReview:true};
})}
export function preparationIssues(car){
  const issues=[];try{validate(car)}catch(error){issues.push(error.message)}
  if(car?.demo||car?.needsReview)issues.push('Revise e salve este cadastro antes de preparar um anúncio real.');
  if(car)issues.push(...preparationWarnings(car));return issues;
}
export function markPublished(car,url){const safe=listingUrl(url);if(!safe)throw new Error('Cole o link do anúncio: https://www.facebook.com/marketplace/item/NUMERO/');if(car.status==='sold')throw new Error('Este veículo está vendido.');return {...car,url:safe,status:'published',updated:Date.now()}}
export function markSold(car){if(car.status!=='published')throw new Error('Registre o anúncio publicado antes de marcar como vendido.');return {...car,status:'sold',updated:Date.now()}}
export function applyTask(car,task){
  if(!car?.realJob||car.realJobId!==task?.jobId||['published','sold'].includes(car.status))return null;
  const status=task.status==='review'?(task.result==='ready'?'ready':task.result==='failed'?'error':'attention'):task.status==='error'?'error':['opened','preparing'].includes(task.status)?'preparing':'attention';
  const report=String(task.report||'').split('\n').filter(Boolean);
  if(car.status===status&&car.phase===(task.phase||'')&&car.progressAt===task.progressAt&&JSON.stringify(car.report)===JSON.stringify(report))return null;
  return {...car,status,phase:task.phase||'',progressAt:task.progressAt,report,updated:Date.now()};
}
