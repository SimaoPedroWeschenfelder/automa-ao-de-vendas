import * as store from './store.js';
import {extensionRequest} from './bridge-client.js';
import {supportsFacebook,facebookState,reportLines,facebookPayload} from './facebook.js';
import {money,preparationIssues,markPublished,markSold,applyTask} from './inventory.js';
import {validate,descriptionFor,listingUrl} from './model.js';
import {statusFor,visibleCars,preparationBlock,preparationSummary} from './ui-state.js';
const $=s=>document.querySelector(s);
const paths={dashboard:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',car:'M5 17H3v-6l2-6h14l2 6v6h-2 M5 17h14 M6 17v3 M18 17v3 M3 11h18 M6 14h2 M16 14h2',layers:'m12 3 10 5-10 5L2 8l10-5Z M2 12l10 5 10-5 M2 16l10 5 10-5',clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M12 7v5l3 2',sparkles:'m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3Z M20 2v4 M18 4h4',refresh:'M20 7v5h-5 M4 17v-5h5 M6 6a8 8 0 0 1 14 6 M4 12a8 8 0 0 0 14 6',chevron:'m8 10 4 4 4-4',help:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18 M9 9a3 3 0 0 1 6 0c0 2-3 2-3 4 M12 17h.01',plus:'M12 5v14 M5 12h14',flask:'M9 3h6 M10 3v6l-6 10a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2L14 9V3 M8 14h8',check:'m5 12 4 4L19 6',send:'m21 3-6 18-4-8-8-4 18-6Z M11 13 21 3',wallet:'M20 7H4V4h14v3 M4 7a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16V7 M16 12h6v5h-6v-5Z',search:'M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14 M15 15l6 6',sort:'M5 5v14 m-3-3 3 3 3-3 M12 5h9 M12 10h7 M12 15h5 M12 20h3',grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',pulse:'M2 12h5l3-8 5 16 3-8h4',close:'m6 6 12 12 M6 18 18 6',arrow:'M4 12h16 m-6-6 6 6-6 6',image:'M3 3h18v18H3z M3 17l6-6 4 4 3-3 5 5 M15 7h.01',menu:'M4 6h16 M4 12h16 M4 18h16',gauge:'M3 16a9 9 0 1 1 18 0 M12 13l5-5 M5 19h14',gear:'M5 5h14v14H5z M12 5v14 M5 12h14',edit:'m15 4 5 5 M4 20l4-1L21 6l-5-5L3 14l1 6Z',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6',tag:'M3 3h8l10 10-8 8L3 11V3Z M7 7h.01'};
function icon(name){const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[name]||paths.car);svg.append(path);return svg}
function hydrate(root=document){root.querySelectorAll('[data-icon]').forEach(e=>e.replaceChildren(icon(e.dataset.icon)))}
function el(tag,cls,text){const node=document.createElement(tag);if(cls)node.className=cls;if(text!==undefined)node.textContent=text;return node}
function btn(label,action,cls='',name){const b=el('button',cls);b.type='button';if(name)b.append(icon(name));b.append(document.createTextNode(label));b.onclick=async()=>{b.disabled=true;try{await action()}catch(error){toast(error.message,true)}finally{b.disabled=false}};return b}
const state={cars:[],connected:false,connectionChecked:false,connectionError:'',filter:'all',query:'',sort:'recent',selected:new Set(),jobs:new Set(),editId:null,step:0,photos:[],photoEpoch:0,uploading:false,reviewId:null};
let toastTimer,polling=false,pollTimer;
const carById=id=>state.cars.find(c=>c.id===id);
function toast(message,error=false){const node=$('#toast');node.textContent=message;node.className='toast visible'+(error?' error':'');clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.className='toast',6500)}
async function write(car){await store.save(car);state.cars=state.cars.filter(c=>c.id!==car.id).concat(car);render()}
function imageBox(car,cls=''){const box=el('div','car-image '+cls);if(car.photos?.length){const img=el('img');img.src=car.photos[0].data;img.loading='lazy';img.decoding='async';img.alt=`${car.brand} ${car.model}`;box.append(img)}else{box.classList.add('no-image');box.append(icon('car'),el('span','','Sem foto'))}return box}
function statusNode(car){const {label,tone}=statusFor(car);const node=el('span','car-status '+tone);node.append(el('i'),document.createTextNode(label));return node}
function currentCars(){return visibleCars(state.cars,state)}
function render(){
  drawNotice();$('#inventory-count').textContent=state.cars.filter(c=>c.status!=='sold').length;
  const list=currentCars(),root=$('#cards');root.replaceChildren();$('#visible-count').textContent=`${list.length} ${list.length===1?'veículo':'veículos'}`;
  if(!list.length){const empty=el('div','empty');empty.append(icon('car'),el('h2','',state.cars.length?'Nenhum veículo neste filtro':'Seu estoque começa aqui'),el('p','',state.cars.length?'Tente outra busca ou situação.':'Adicione seu primeiro veículo com os dados e as fotos do anúncio.'),btn(state.cars.length?'Limpar filtros':'Cadastrar veículo',()=>state.cars.length?clearFilters():edit(),'button primary'));root.append(empty)}
  for(const car of list){
    const card=el('article','car-card'+(state.selected.has(car.id)?' selected':'')),image=imageBox(car),check=el('input','car-checkbox');
    check.type='checkbox';check.checked=state.selected.has(car.id);check.setAttribute('aria-label',`Selecionar ${car.brand} ${car.model}`);check.onchange=()=>{check.checked?state.selected.add(car.id):state.selected.delete(car.id);render()};image.append(check,el('span','car-year',car.year));
    const body=el('div','car-body');body.append(btn(`${car.brand} ${car.model}`,()=>openReview(car.id),'car-title'),el('p','car-version',car.version||'Versão não informada'),el('p','car-specs',`${Number(car.mileage).toLocaleString('pt-BR')} km · ${car.transmission||'Câmbio não informado'}`),el('div','car-price',money(car.price)),el('p','car-location',car.city||'Localização não informada'),statusNode(car));
    if(car.status==='preparing')body.append(el('p','card-phase',car.phase||'Aguardando formulário…'));
    const actions=el('div','card-actions');
    if(state.jobs.has(car.id)){const pending=btn('Abrindo formulário…',()=>{},'prepare');pending.disabled=true;actions.append(pending)}
    else if(car.status==='ready'&&car.realJob)actions.append(btn('Revisar',()=>openReview(car.id),'review-ready','check'),btn('Editar',()=>edit(car.id),'','edit'));
    else if(car.status==='preparing')actions.append(btn('Ver andamento',()=>openReview(car.id),'','clock'));
    else if(['published','sold'].includes(car.status))actions.append(btn('Ver detalhes',()=>openReview(car.id),'','eye'));
    else actions.append(btn(car.needsReview?'Revisar cadastro':'Preparar',()=>car.needsReview?edit(car.id):prepare(car.id),'prepare','sparkles'),btn('Detalhes',()=>openReview(car.id),'','eye'));
    body.append(actions);card.append(image,body);root.append(card);
  }
  for(const id of [...state.selected])if(!carById(id))state.selected.delete(id);
  $('#batch-bar').hidden=!state.selected.size;$('#selected-count').textContent=state.selected.size;
  $('#select-all').disabled=!list.length;$('#select-all').checked=list.length>0&&list.every(c=>state.selected.has(c.id));$('#select-all').indeterminate=list.some(c=>state.selected.has(c.id))&&!$('#select-all').checked;
}
function clearFilters(){state.query='';state.filter='all';$('#search').value='';$('#filter').value='all';state.selected.clear();render()}
function drawNotice(){
  const {ready,attention,working}=preparationSummary(state.cars),root=$('#preparation-notice');root.replaceChildren();root.hidden=!ready.length&&!attention.length&&!working.length;
  root.className='preparation-notice '+(ready.length?'ready':attention.length?'attention':'working');
  const copy=el('div');copy.append(el('b','',ready.length?`${ready.length} para revisar`:attention.length?`${attention.length} com pendência`:`${working.length} em preparação`));
  const names=(ready.length?ready:attention.length?attention:working).map(c=>`${c.brand} ${c.model}`).join(' · ');copy.append(el('p','',names));root.append(copy);
  if(ready.length&&attention.length)root.append(btn(`${attention.length} com pendência`,()=>{state.filter='attention';$('#filter').value='attention';render()},'text-button'));
  const car=ready[0]||attention[0]||working[0];if(car)root.append(btn(ready.length?'Revisar':attention.length?'Conferir':'Ver andamento',()=>openReview(car.id),'button '+(ready.length?'success':'secondary')));
  document.title=ready.length?`🟢 ${ready.length} para revisar · Pulse`:attention.length?'🟠 Pendências · Pulse':working.length?'Preparando · Pulse':'Pulse · Estoque';
}
function openReview(id){const car=carById(id);if(!car)return;state.reviewId=id;drawReview(car);if(!$('#review').open)$('#review').showModal()}
function drawReview(car){
  const root=$('#review-content');root.replaceChildren();const top=el('div','dialog-top'),heading=el('div');heading.append(el('h2','',`${car.brand} ${car.model}`),el('p','',`${car.version||''} · ${car.year}`));const close=btn('',()=>$('#review').close(),'icon-button','close');close.setAttribute('aria-label','Fechar detalhes');top.append(heading,close);root.append(top,imageBox(car,'review-image'),el('div','review-price',money(car.price)),statusNode(car));
  const specs=el('div','review-specs');for(const [label,value] of [['Quilometragem',Number(car.mileage).toLocaleString('pt-BR')+' km'],['Cidade',car.city||'Não informada'],['Câmbio',car.transmission||'Não informado'],['Combustível',car.fuel||'Não informado']]){const item=el('div','',label);item.append(el('b','',value));specs.append(item)}root.append(specs);
  if(car.status==='preparing')root.append(el('p','announcement',car.phase||'Preparando em segundo plano…'));
  if(car.report?.length){root.append(el('h3','','Relatório da preparação'));const report=el('ul','review-checklist');car.report.forEach(line=>report.append(el('li','',line)));root.append(report)}
  root.append(el('h3','','Descrição do anúncio'),el('pre','description',descriptionFor(car)));
  const extra=el('div','review-tools');extra.append(btn('Copiar descrição',async()=>{await navigator.clipboard.writeText(descriptionFor(car));toast('Descrição copiada.')},'text-button'));
  if(!['preparing','published','sold'].includes(car.status))extra.append(btn('Editar cadastro',()=>{$('#review').close();edit(car.id)},'text-button'));
  root.append(extra);const bottom=el('div','review-bottom');
  if(car.status==='sold'){bottom.append(el('p','small-note','Venda registrada no estoque.'))}
  else if(car.status==='published'){if(listingUrl(car.url))bottom.append(link('Abrir anúncio',car.url,'button secondary'));bottom.append(btn('Marcar vendido',()=>confirmSale(car.id),'button primary'))}
  else{
    if(car.realJob)bottom.append(btn('Abrir no Facebook',()=>focusFacebook(car.id),'button '+(car.status==='ready'?'success':'secondary')));
    if(car.status!=='preparing')bottom.append(btn(car.realJob?'Preparar novamente':'Preparar anúncio',async()=>{$('#review').close();await prepare(car.id)},'button primary'));
    root.append(el('p','small-note','Confira os dados e publique pelo Facebook. Depois registre o link do anúncio aqui.'));
    if(car.status!=='preparing')root.append(btn('Já publiquei · registrar link',()=>registerPublication(car.id),'text-button'));
  }
  root.append(bottom);
}
function link(label,url,cls){const a=el('a',cls,label);a.href=url;a.target='_blank';a.rel='noopener';return a}
function registerPublication(id){
  const car=carById(id),root=$('#confirm-content');root.replaceChildren(el('h2','','Registrar anúncio publicado'),el('p','','Cole o link do anúncio que você já publicou no Facebook.'));
  const label=el('label','','Link do anúncio'),input=el('input');input.type='url';input.placeholder='https://www.facebook.com/marketplace/item/…';input.value=car.url||'';label.append(input);const error=el('p','form-error');error.setAttribute('role','alert');
  const actions=el('div','confirm-buttons');actions.append(btn('Cancelar',()=>$('#confirm').close(),'button secondary'),btn('Salvar link',async()=>{try{await write(markPublished(carById(id),input.value));$('#confirm').close();drawReview(carById(id));toast('Anúncio registrado no estoque.')}catch(e){error.textContent=e.message}},'button primary'));root.append(label,error,actions);$('#confirm').showModal();input.focus();
}
function confirmSale(id){const car=carById(id),root=$('#confirm-content');root.replaceChildren(el('h2','','Marcar como vendido?'),el('p','',`${car.brand} ${car.model} sairá do estoque disponível. Atualize ou remova também o anúncio no Facebook; esta ação registra a venda somente na Pulse.`));const actions=el('div','confirm-buttons');actions.append(btn('Cancelar',()=>$('#confirm').close(),'button secondary'),btn('Registrar venda',async()=>{await write(markSold(carById(id)));$('#confirm').close();drawReview(carById(id));toast('Venda registrada.')},'button primary'));root.append(actions);$('#confirm').showModal()}
function edit(id=null){
  const car=id?carById(id):null;if(car&&(['preparing','published','sold'].includes(car.status)||state.jobs.has(id))){toast('Aguarde a preparação ou confira o anúncio já registrado.',true);return}
  state.editId=id;state.step=0;state.photoEpoch++;state.uploading=false;state.photos=[...(car?.photos||[])];$('#vehicle-form').reset();$('#form-error').textContent='';$('#editor-title').textContent=car?'Editar veículo':'Novo veículo';
  if(car)for(const [key,value] of Object.entries(car)){const field=$('#vehicle-form').elements.namedItem(key);if(field&&typeof value!=='object')field.value=value}
  const maxYear=new Date().getFullYear()+2;$('#vehicle-form').elements.year.max=maxYear;$('#vehicle-form').elements.manufacturingYear.max=maxYear;
  drawPhotos();showStep();$('#editor').showModal();
}
function collect(){const data=Object.fromEntries(new FormData($('#vehicle-form'))),old=carById(state.editId);return {...old,...data,id:old?.id||crypto.randomUUID(),demo:false,needsReview:false,imageIndex:undefined,photos:[...state.photos],channels:['Marketplace'],status:'draft',realJob:false,realJobId:null,report:[],phase:'',created:old?.created||Date.now(),updated:Date.now()}}
function checkStep(){const step=document.querySelector(`[data-step="${state.step}"]`);for(const field of step.querySelectorAll('input,select,textarea'))if(!field.checkValidity()){field.reportValidity();return false}return true}
function showStep(){document.querySelectorAll('[data-step]').forEach(e=>e.hidden=Number(e.dataset.step)!==state.step);document.querySelectorAll('[data-step-indicator]').forEach(e=>e.classList.toggle('active',Number(e.dataset.stepIndicator)===state.step));$('#back').hidden=state.step===0;$('#next').hidden=state.step===1;$('#save').hidden=state.step!==1;$('#next').disabled=state.uploading;$('#save').disabled=state.uploading;$('#editor').scrollTop=0}
function drawPhotos(){const root=$('#photo-list');root.replaceChildren();state.photos.forEach((photo,index)=>{const thumb=el('div','photo-thumb'),img=el('img');img.src=photo.data;img.alt=photo.name;const remove=btn('×',()=>{state.photos.splice(index,1);drawPhotos()});remove.setAttribute('aria-label','Remover '+photo.name);thumb.append(img,remove);root.append(thumb)})}
async function readPhoto(file){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onerror=()=>reject(new Error('Falha ao ler '+file.name));reader.onload=async()=>{try{const image=new Image();image.src=reader.result;await image.decode();resolve({name:file.name,type:file.type,data:reader.result})}catch{reject(new Error('Não foi possível abrir '+file.name))}};reader.readAsDataURL(file)})}
$('#photos').onchange=async event=>{
  const input=event.target,files=[...input.files];if(!files.length)return;const epoch=++state.photoEpoch;state.uploading=true;showStep();$('#form-error').textContent='';
  try{if(state.photos.length+files.length>20)throw new Error('Use até 20 fotos por veículo.');const existingBytes=state.photos.reduce((n,p)=>n+(p.data.split(',')[1]?.length||0)*.75,0);if(existingBytes+files.reduce((n,f)=>n+f.size,0)>25*1024*1024)throw new Error('Use no máximo 25 MB de fotos por veículo.');if(files.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>5*1024*1024))throw new Error('Use JPG, PNG ou WebP com até 5 MB por foto.');const added=[];for(const file of files){added.push(await readPhoto(file));if(epoch!==state.photoEpoch)return;}const all=[...state.photos,...added];validate({...collect(),photos:all});state.photos=all;drawPhotos()}catch(error){if(epoch===state.photoEpoch)$('#form-error').textContent=error.message}finally{if(epoch===state.photoEpoch){state.uploading=false;input.value='';showStep()}}
};
$('#next').onclick=()=>{try{if(state.uploading||!checkStep())return;validate({...collect(),photos:[]});$('#form-error').textContent='';state.step=1;showStep()}catch(error){$('#form-error').textContent=error.message}};
$('#back').onclick=()=>{state.step=0;$('#form-error').textContent='';showStep()};
$('#vehicle-form').onsubmit=async event=>{event.preventDefault();if(state.step===0){$('#next').onclick();return}if(state.uploading||!checkStep())return;$('#save').disabled=true;try{const car=collect();validate(car);await write(car);$('#editor').close();toast('Veículo salvo.')}catch(error){$('#form-error').textContent=error.message}finally{$('#save').disabled=false}};
for(const button of document.querySelectorAll('.close-editor'))button.onclick=()=>$('#editor').close();$('#editor').addEventListener('close',()=>state.photoEpoch++);
async function prepare(id){
  const car=carById(id),blocked=preparationBlock(car);if(blocked){toast(blocked,true);return}if(state.jobs.has(id))return;
  const issues=preparationIssues(car);if(issues.length){await write({...car,status:'attention',report:issues});openReview(id);return}
  if(!state.connected){await pollFacebook();if(!state.connected){$('#connector').showModal();return}}
  state.jobs.add(id);render();
  try{const payload=await facebookPayload(car),result=await extensionRequest('PREPARE',{car:payload},20000);if(!result?.jobId)throw new Error('O conector não confirmou a preparação. Tente verificar a conexão.');await write({...car,realJob:true,realJobId:result.jobId,status:facebookState(result),phase:result.phase||'',progressAt:result.progressAt,report:reportLines(result.report),updated:Date.now()});toast(result.reused?'A preparação existente foi mantida. Use Revisar para abrir a aba.':'Preparação iniciada. O indicador avisará quando concluir.')}catch(error){await write({...car,status:'error',report:[error.message],updated:Date.now()});toast(error.message,true)}finally{state.jobs.delete(id);render()}
}
async function focusFacebook(id){try{await extensionRequest('FOCUS',{id})}catch(error){toast(error.message,true)}}
function drawConnection(){const node=$('#connect');node.className='connection '+(state.connected?'connected':'disconnected');$('#connection-status').textContent=state.connected?'Facebook conectado':state.connectionChecked?'Conectar Facebook':'Verificando Facebook…';node.title=state.connectionError}
async function pollFacebook(){
  if(polling)return;polling=true;
  try{const info=await extensionRequest('PING',{},5000);state.connected=supportsFacebook(info.version);state.connectionError=state.connected?'':'Atualize o conector para 0.5.2 ou superior.';state.connectionChecked=true;drawConnection();if(!state.connected)return;
    const ids=state.cars.filter(c=>c.realJob&&!['published','sold'].includes(c.status)).map(c=>c.id);
    if(ids.length){const results=[];for(let offset=0;offset<ids.length;offset+=100)results.push(...await extensionRequest('STATUS',{ids:ids.slice(offset,offset+100)}));for(const task of results.filter(Boolean)){const car=carById(task.id),next=applyTask(car,task);if(!next)continue;await write(next);if($('#review').open&&state.reviewId===next.id)drawReview(next);if(next.status!==car.status&&['ready','attention','error'].includes(next.status))toast(`${next.brand} ${next.model}: ${next.status==='ready'?'pronto para revisar':'confira as pendências'}.`,next.status!=='ready')}}
  }catch(error){state.connected=false;state.connectionChecked=true;state.connectionError=error.message;drawConnection()}finally{polling=false}
}
$('#add').onclick=()=>edit();$('#search').oninput=event=>{state.query=event.target.value;state.selected.clear();render()};$('#filter').onchange=event=>{state.filter=event.target.value;state.selected.clear();render()};$('#sort').onchange=event=>{state.sort=event.target.value;render()};
$('#select-all').onchange=event=>{for(const car of currentCars())event.target.checked?state.selected.add(car.id):state.selected.delete(car.id);render()};$('#clear-selection').onclick=()=>{state.selected.clear();render()};
$('#batch').onclick=async()=>{const ids=[...state.selected].filter(id=>!preparationBlock(carById(id))&&carById(id).status!=='preparing');if(!ids.length){toast('Selecione veículos disponíveis para preparar.',true);return}if(ids.length>5){toast('Prepare no máximo cinco veículos por vez.',true);return}$('#batch').disabled=true;try{for(const id of ids)await prepare(id)}finally{$('#batch').disabled=false;state.selected.clear();render()}};
$('#connect').onclick=()=>$('#connector').showModal();$('#close-connector').onclick=()=>$('#connector').close();$('#recheck-connector').onclick=async()=>{await pollFacebook();toast(state.connected?'Facebook conectado.':state.connectionError||'Conector não encontrado.',!state.connected);if(state.connected)$('#connector').close()};
$('#copy-extensions').onclick=async()=>{try{await navigator.clipboard.writeText(navigator.userAgent.includes('Edg/')?'edge://extensions':'chrome://extensions');toast('Endereço copiado. Cole na barra de endereços.')}catch{toast('Abra chrome://extensions ou edge://extensions na barra de endereços.',true)}};
$('#backup').onclick=async()=>{try{const data=await store.backup(),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=link('Backup',url,'');a.download='pulse-backup-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('Backup baixado com os dados e as fotos.')}catch(error){toast(error.message,true)}};
async function start(){try{hydrate();state.cars=await store.initialize();render();drawConnection();pollFacebook();clearInterval(pollTimer);pollTimer=setInterval(pollFacebook,4000)}catch(error){$('#cards').replaceChildren(el('p','form-error',error.message),btn('Tentar novamente',start,'button secondary'))}}
document.addEventListener('visibilitychange',()=>{if(!document.hidden)pollFacebook()});window.addEventListener('focus',pollFacebook);start();
