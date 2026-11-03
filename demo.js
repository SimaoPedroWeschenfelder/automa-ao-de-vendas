import {validate,descriptionFor} from './model.js';
export const money=value=>Number(value).toLocaleString('pt-BR',{style:'currency',currency:'BRL',maximumFractionDigits:0});
export const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]/g,'');
export const statusInfo={draft:{label:'No estoque',tone:'neutral'},preparing:{label:'Preparando anúncio',tone:'working'},ready:{label:'Pronto para revisar',tone:'ready'},attention:{label:'Precisa de atenção',tone:'attention'},published:{label:'Publicado na demo',tone:'published'},sold:{label:'Vendido na demo',tone:'sold'},error:{label:'Preparação interrompida',tone:'error'}};
export function seedCars(){
  const common={manufacturingYear:2023,year:2024,transmission:'Automático',fuel:'Flex',city:'Curitiba, Paraná',bodyStyle:'SUV',doors:4,seats:5,photos:[],channels:['Marketplace'],notes:'Veículo fictício para apresentação. Informações e imagem ilustrativas; não representa uma oferta real.',features:'Ar-condicionado · Central multimídia · Câmera de ré',warranty:'Exemplo demonstrativo, sem oferta de garantia real.'};
  return [
    {brand:'Volkswagen',model:'T-Cross',version:'Highline 250 TSI',price:149900,mileage:18500,engine:'1.4 TSI',power:150,exteriorColor:'Branco',status:'draft'},
    {brand:'Toyota',model:'Corolla',version:'XEi 2.0',price:145900,mileage:32000,engine:'2.0',power:177,exteriorColor:'Cinza',bodyStyle:'Sedã',status:'ready'},
    {brand:'Jeep',model:'Compass',version:'Longitude T270',price:169900,mileage:24000,engine:'1.3 turbo',power:185,exteriorColor:'Verde',fuel:'',status:'attention'},
    {brand:'Hyundai',model:'HB20',version:'Comfort 1.0',price:78900,mileage:15000,engine:'1.0',power:80,exteriorColor:'Prata',transmission:'Manual',bodyStyle:'Hatch',status:'published'},
    {brand:'Honda',model:'HR-V',version:'EXL 1.5',price:159900,mileage:21000,engine:'1.5',power:126,exteriorColor:'Azul',status:'draft'},
    {brand:'Chevrolet',model:'Onix',version:'LT 1.0 turbo',price:89900,mileage:28000,engine:'1.0 turbo',power:116,exteriorColor:'Vermelho',bodyStyle:'Hatch',status:'sold'}
  ].map((c,index)=>({...common,...c,id:'demo-'+index,imageIndex:index,created:Date.now()-index*60000,updated:Date.now(),report:c.status==='attention'?['Combustível não informado. Complete o cadastro para preparar este veículo.']:c.status==='ready'?['Cadastro conferido na simulação.','Imagem ilustrativa vinculada.','Descrição preparada para revisão.']:[],demo:true}));
}
export function warnings(car){const list=[];if(!car.city?.trim())list.push('Informe a cidade do veículo.');if(!car.fuel?.trim())list.push('Selecione o combustível.');if(!car.transmission?.trim())list.push('Selecione o câmbio.');if(!car.photos?.length&&!Number.isInteger(car.imageIndex))list.push('Adicione uma foto do veículo.');return list}
export function canPrepare(car){return !['published','sold','preparing'].includes(car.status)}
export function completePreparation(car){validate(car);const pending=warnings(car);return {...car,status:pending.length?'attention':'ready',progress:100,phase:'',report:pending.length?pending:['Informações do veículo conferidas na simulação.','Descrição montada com os dados informados.','Imagem ilustrativa vinculada.','Aguardando sua revisão.'],updated:Date.now()}}
export function publishDemo(car){if(car.status!=='ready')throw new Error('Prepare o veículo e resolva as pendências antes de aprovar.');return {...car,status:'published',listingId:'PLS-'+car.id.replace(/[^a-z0-9]/gi,'').slice(-6).toUpperCase(),updated:Date.now()}}
export function sellDemo(car){if(car.status!=='published')throw new Error('Este veículo ainda não tem anúncio publicado na demo.');return {...car,status:'sold',updated:Date.now()}}
export function recover(car){return car.status==='preparing'?{...car,status:'error',phase:'',report:['A página foi recarregada durante a simulação. Seus dados estão salvos; clique em Preparar para tentar novamente.']}:car}
export function filtered(cars,{query='',status='all',sort='recent'}={}){const q=normalize(query);const list=cars.filter(c=>(status==='all'||c.status===status)&&(!q||normalize([c.brand,c.model,c.version,c.exteriorColor].join(' ')).includes(q)));return list.sort((a,b)=>sort==='low'?a.price-b.price:sort==='high'?b.price-a.price:sort==='brand'?a.brand.localeCompare(b.brand,'pt-BR'):(b.created||0)-(a.created||0))}
export function stats(cars){return {stock:cars.filter(c=>c.status!=='sold').length,ready:cars.filter(c=>c.status==='ready').length,published:cars.filter(c=>c.status==='published').length,value:cars.filter(c=>c.status!=='sold').reduce((sum,c)=>sum+Number(c.price),0)}}
export {descriptionFor,validate};
