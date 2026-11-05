import {filtered,statusInfo} from './inventory.js';
export function statusFor(car,now=Date.now()){
  if(car.needsReview)return {label:'Revisar cadastro anterior',tone:'attention'};
  if(car.realJob&&car.status==='preparing'&&now-(car.progressAt||car.updated)>120000)return {label:'Sem retorno · conferir',tone:'attention'};
  return statusInfo[car.status]||statusInfo.draft;
}
export function visibleCars(cars,{filter='all',query='',sort='recent'}={}){
  return filtered(cars.filter(c=>filter==='all'?c.status!=='sold':filter==='attention'?['attention','error'].includes(c.status)||c.needsReview:filter==='ready'?c.status==='ready'&&c.realJob:c.status===filter),{query,sort});
}
export function preparationBlock(car){
  if(!car)return 'Veículo não encontrado. Atualize o painel.';
  if(car.status==='sold')return 'Este veículo está vendido.';
  if(car.status==='published')return 'Este veículo já tem um anúncio publicado. Abra o anúncio existente.';
  if(car.demo||car.needsReview)return 'Revise e salve o cadastro antes de preparar um anúncio real.';
  return '';
}
export function preparationSummary(cars){return {
  ready:cars.filter(c=>c.realJob&&c.status==='ready'),
  attention:cars.filter(c=>c.realJob&&['error','attention'].includes(c.status)),
  working:cars.filter(c=>c.realJob&&c.status==='preparing')
}}
