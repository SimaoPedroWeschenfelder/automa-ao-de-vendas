import { descriptionFor, listingUrl, backupCars, preparationWarnings } from './model.js';
import { taskIndicator, supportsBackground } from './task-state.js';
import { listPreviewCars, savePreviewCar } from './preview-store.js';
import { extensionRequest } from './bridge-client.js';
const $ = s => document.querySelector(s);
const extension = !!globalThis.chrome?.runtime?.id;
let cars = [], selected = new Set(), photos = [], editing = null;
let connected=extension;
const statuses = {draft:'Cadastrado',opened:'Na fila',preparing:'Preparando',review:'Revisão necessária',error:'Falha na preparação',published:'Publicado · informado por você',sale_pending:'Retirada pendente',sold:'Retirada confirmada por você'};
let toastTimer;
function toast(t){$('#toast').textContent=t;$('#toast').style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').style.display='none',6500)}
async function api(type, args={}) {
  if(type==='OPEN'){const version=extension?chrome.runtime.getManifest().version:(await extensionRequest('PING',{},1500)).version;if(!supportsBackground(version))throw new Error('Recarregue a extensão Pátio para ativar a versão 0.4 com preparação em segundo plano e indicadores.');}
  if(!extension) {
    if(type==='LIST') return listPreviewCars();
    if(type==='SAVE') return savePreviewCar(args.car);
    if(type==='OPEN'){
      const car=cars.find(c=>c.id===args.id);if(!car)throw new Error('Carro não encontrado.');
      if(['published','sale_pending','sold'].includes(car.status))throw new Error('Este carro já foi registrado como publicado.');
      try{const result=await extensionRequest('PREPARE',{car});await savePreviewCar({...car,...result,remote:true});return result}
      catch(error){await savePreviewCar({...car,status:'error',result:'failed',report:error.message,remote:!!car.remote}).catch(()=>{});await refresh().catch(()=>{});throw error}
    }
    if(type==='FOCUS')return extensionRequest('FOCUS',{id:args.id});
    if(type==='LINK'){
      const car=cars.find(c=>c.id===args.id),url=listingUrl(args.url);if(!car||!url)throw new Error('Informe um link válido do anúncio.');
      await savePreviewCar({...car,url,status:'published'});return true;
    }
    if(type==='SOLD'){
      const car=cars.find(c=>c.id===args.id);if(!car||!listingUrl(car.url))throw new Error('Informe o link publicado primeiro.');
      window.open(car.url,'_blank','noopener');await savePreviewCar({...car,status:'sale_pending'});return true;
    }
    if(type==='CONFIRM_SOLD'){
      const car=cars.find(c=>c.id===args.id);if(!car||car.status!=='sale_pending')throw new Error('Retirada não iniciada.');await savePreviewCar({...car,status:'sold'});return true;
    }
    throw new Error('Operação não disponível.');
  }
  const r=await chrome.runtime.sendMessage({type,...args}); if(!r?.ok) throw new Error(r?.error||'Sem resposta da extensão. Reabra o painel.');return r.data;
}
function el(tag, cls, text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e}
function button(label,fn,cls){const b=el('button',cls,label);b.type='button';b.onclick=async()=>{b.disabled=true;try{await fn()}catch(e){toast(e.message)}finally{b.disabled=false}};return b}
function render(){
  $('#total').textContent=cars.length;$('#review').textContent=cars.filter(c=>['opened','preparing','review','error'].includes(c.status)).length;$('#published').textContent=cars.filter(c=>c.status==='published').length;$('#sold').textContent=cars.filter(c=>c.status==='sold').length;$('#selected').textContent=selected.size;
  const root=$('#cards');root.replaceChildren();
  if(!cars.length){const box=el('div','empty');box.append(el('div','symbol','▱'),el('h2','', 'Seu estoque começa com um carro.'),el('p','','Adicione as informações e as fotos. Depois, libere a preparação e revise cada anúncio no Facebook.'),button('＋ Cadastrar primeiro carro',()=>openEditor(), 'primary'));root.append(box);return}
  for(const c of cars){
    const card=el('article','card'),cover=el('div','cover');
    if(c.photos?.[0]){const img=el('img');img.src=c.photos[0].data;img.alt=`${c.brand} ${c.model}`;cover.append(img)}else cover.append(el('span','','▱'));
    const check=el('input');check.type='checkbox';check.checked=selected.has(c.id);check.setAttribute('aria-label',`Selecionar ${c.brand} ${c.model}`);check.onchange=()=>{check.checked?selected.add(c.id):selected.delete(c.id);$('#selected').textContent=selected.size};cover.append(check,el('span','status',statuses[c.status]||'Cadastrado'));
    const body=el('div','card-body'),indicator=taskIndicator(c),led=el('div','task-led '+indicator.tone,indicator.label);led.setAttribute('role','status');
    body.append(led,el('div','car-title',`${c.brand} ${c.model}`),el('div','car-meta',`${c.year} · ${Number(c.mileage).toLocaleString('pt-BR')} km · ${c.photos?.length||0} fotos`),el('div','price',Number(c.price).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})));
    const actions=el('div','card-actions');actions.append(button('Revisar',()=>openDetail(c),'primary'),button('Editar',()=>openEditor(c)));
    if(['draft','opened','preparing','review','error'].includes(c.status))actions.append(button('Preparar ↗',async()=>{const r=await api('OPEN',{id:c.id});await refresh();toast(r.reused?'Já existe uma aba deste carro. Acompanhe o indicador no cartão.':'Preparação iniciada em segundo plano. O indicador avisará quando terminar.')}));
    if(c.status==='published')actions.append(button('Vendeu?',async()=>{await api('SOLD',{id:c.id});await refresh();toast('Anúncio aberto. Marque como vendido no Facebook e confirme a retirada no painel.')}));
    const warnings=preparationWarnings(c);
    body.append(actions,el('p','card-note',c.report?'Consulte as pendências e o relatório em Revisar.':warnings.length?warnings.join(' '):'A publicação só é registrada depois que você informa o link.'));card.append(cover,body);root.append(card);
  }
}
async function refresh(){cars=await api('LIST');render()}
function thumbs(){const root=$('#thumbnails');root.replaceChildren();photos.forEach((p,index)=>{const item=el('div','photo-item'),im=el('img');im.src=p.data;im.alt=p.name;item.append(im,el('small','',index===0?'Foto principal':`Foto ${index+1}`));if(index)item.append(button('← Principal',()=>{photos.splice(index,1);photos.unshift(p);thumbs()}));item.append(button('Remover',()=>{photos.splice(index,1);thumbs()}));root.append(item)})}
function openEditor(c){++photoRead;$('#save').disabled=false;editing=c||null;$('#form').reset();photos=c?.photos?[...c.photos]:[];$('#form-error').textContent='';if(c)for(const [k,v] of Object.entries(c)){const f=$('#form').elements.namedItem(k);if(f&&typeof v!=='object')f.value=v}thumbs();$('#editor').showModal()}
$('#add').onclick=()=>openEditor();$('#close').onclick=()=>$('#editor').close();$('#close-detail').onclick=()=>$('#detail').close();
let photoRead=0;
$('#photos').onchange=async e=>{
  const reading=++photoRead;
  const files=[...e.target.files];$('#form-error').textContent='';
  if(files.length>20||files.reduce((sum,f)=>sum+f.size,0)>25*1024*1024){$('#form-error').textContent='Selecione até 20 fotos, com no máximo 25 MB no total.';e.target.value='';return}
  if(files.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>5*1024*1024)){ $('#form-error').textContent='Use JPG, PNG ou WebP com até 5 MB por foto.';e.target.value='';return}
  $('#save').disabled=true;
  try{const next=await Promise.all(files.map(f=>new Promise((resolve,reject)=>{const r=new FileReader();r.onload=async()=>{try{const img=new Image();img.src=r.result;await img.decode();resolve({name:f.name,type:f.type,data:r.result})}catch{reject(new Error(`A foto “${f.name}” não pôde ser aberta. Escolha outro arquivo.`))}};r.onerror=()=>reject(new Error('Falha ao ler fotos.'));r.readAsDataURL(f)})));if(reading===photoRead){photos=next;thumbs()}}catch(e){if(reading===photoRead)$('#form-error').textContent=e.message}finally{if(reading===photoRead)$('#save').disabled=false}
};
$('#form').onsubmit=async e=>{e.preventDefault();$('#save').disabled=true;try{const c={...editing,...Object.fromEntries(new FormData(e.target)),photos};await api('SAVE',{car:c});$('#editor').close();await refresh();toast('Carro salvo. Selecione Preparar para abrir o Facebook.')}catch(e){$('#form-error').textContent=e.message}finally{$('#save').disabled=false}};
$('#batch').onclick=async()=>{if(!selected.size)return toast('Selecione pelo menos um carro.');const ids=[...selected].filter(id=>cars.some(c=>c.id===id&&['draft','opened','preparing','review','error'].includes(c.status)));if(!ids.length)return toast('Selecione carros ainda não publicados.');$('#batch').disabled=true;let done=0;const errors=[];try{for(const id of ids){try{await api('OPEN',{id});done++;selected.delete(id)}catch(e){errors.push(`${cars.find(c=>c.id===id)?.model}: ${e.message}`)}}toast(errors.length?`${done} preparação(ões) enviada(s). ${errors.join(' · ')}`:`${done} preparação(ões) em segundo plano. Acompanhe os indicadores.`)}finally{$('#batch').disabled=false;await refresh()}};
function openDetail(c){
  const root=$('#detail-body');root.replaceChildren();root.append(el('p','eyebrow','REVISÃO DO ANÚNCIO'),el('h2','',`${c.brand} ${c.model} ${c.year}`),el('pre','',descriptionFor(c)),el('p','help','Descrição por modelo de texto, usando somente o cadastro. Copie, ajuste e confira antes de publicar.'));
  const indicator=taskIndicator(c);root.prepend(el('div','task-led '+indicator.tone,indicator.label));
  root.append(button('Copiar descrição',async()=>{await navigator.clipboard.writeText(descriptionFor(c));toast('Descrição copiada.')}));
  if(c.tabId)root.append(button('Abrir aba de revisão ↗',()=>api('FOCUS',{id:c.id})));
  if(c.report)root.append(el('div','report',c.report));
  const label=el('label','','Após publicar no Facebook, cole o link do anúncio:');const input=el('input');input.type='url';input.placeholder='https://www.facebook.com/marketplace/item/…';input.value=c.url||'';label.append(input);root.append(label,button('Registrar publicação',async()=>{if(!listingUrl(input.value))throw new Error('Informe o link completo de um item do Marketplace.');await api('LINK',{id:c.id,url:input.value});$('#detail').close();await refresh();toast('Link registrado. Publicação informada por você; não verificada automaticamente.')}));
  if(c.status==='sale_pending'){root.append(el('p','help','A retirada ainda não foi confirmada. Abra o anúncio e marque como vendido no Facebook. Só confirme abaixo depois de conferir.'),button('Abrir anúncio ↗',()=>{window.open(c.url,'_blank','noopener')}),button('Já retirei no Facebook · confirmar',async()=>{await api('CONFIRM_SOLD',{id:c.id});$('#detail').close();await refresh();toast('Retirada registrada conforme sua confirmação.')}));}
  $('#detail').showModal();
}
$('#export').onclick=async()=>{
  try{
    const list=selected.size?cars.filter(c=>selected.has(c.id)):cars;
    if(!list.length)return toast('Cadastre ou selecione um carro para exportar.');
    const url=URL.createObjectURL(new Blob([JSON.stringify({format:'patio-backup',version:1,cars:list},null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download='patio-cadastros.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
    toast('Arquivo gerado com os cadastros e fotos. Importe-o no painel do outro navegador.');
  }catch(e){toast(e.message)}
};
$('#import').onchange=async event=>{
  const file=event.target.files[0];if(!file)return;
  $('#import').disabled=true;
  try{
    if(file.size>150*1024*1024)throw new Error('Arquivo muito grande. Exporte menos carros por vez.');
    const incoming=backupCars(JSON.parse(await file.text()));
    let current=await api('LIST');for(const c of incoming){const old=current.find(x=>x.id===c.transferKey||x.transferKey===c.transferKey);const saved=await api('SAVE',{car:{...old,...c,id:old?.id||'',status:old?.status||'draft'}});current=current.filter(x=>x.id!==saved.id);current.push(saved)}
    await refresh();toast(`${incoming.length} cadastro(s) importado(s), incluindo as fotos.`);
  }catch(e){toast(e.message)}finally{$('#import').disabled=false;event.target.value=''}
};
refresh().catch(e=>toast(e.message));
if(extension){chrome.runtime.onMessage.addListener(m=>{if(m.type==='REFRESH')refresh().catch(()=>{})});chrome.storage.onChanged.addListener(()=>refresh().catch(()=>{}));setInterval(()=>{if(!document.hidden&&!$('#editor').open&&!$('#detail').open)refresh().catch(()=>{})},5000)}
else{
  const badge=document.querySelector('.badge'),notice=document.querySelector('.notice');
  async function checkConnection(){
    try{
      const info=await extensionRequest('PING',{},700);connected=true;
      if(!supportsBackground(info.version)){badge.textContent='ATUALIZAÇÃO NECESSÁRIA';notice.textContent='Sua extensão ainda está na versão '+info.version+'. Recarregue o Pátio em chrome://extensions ou edge://extensions e atualize este painel para ativar os indicadores e a preparação em segundo plano.';return}
      badge.textContent='EXTENSÃO CONECTADA · '+info.version;
      notice.textContent='Preparação em segundo plano: o agente abre a aba sem interromper você. Verde = preenchido para revisão; amarelo = pendências; vermelho = falha. Publicar continua sendo sua decisão.';
      const pending=cars.filter(c=>c.remote&&['opened','preparing','review','error'].includes(c.status));
      try{if(pending.length&&!$('#editor').open&&!$('#detail').open){
        const updates=await extensionRequest('STATUS',{ids:pending.map(c=>c.id)});
        for(const u of updates.filter(Boolean)){const car=cars.find(c=>c.id===u.id);if(car?.remote&&(!car.jobId||car.jobId===u.jobId)&&(car.status!==u.status||car.report!==u.report||car.phase!==u.phase||car.result!==u.result||car.progressAt!==u.progressAt))await savePreviewCar({...car,...u})}
        await refresh();
      }}catch(error){notice.textContent='A extensão está conectada, mas não foi possível atualizar o relatório: '+error.message+' Você pode abrir a revisão para conferir.'}
    }catch{
      connected=false;badge.textContent='EXTENSÃO DESCONECTADA';
      notice.textContent='Para preparar automaticamente: recarregue o Pátio em chrome://extensions ou edge://extensions e atualize este painel no mesmo navegador. O indicador acima deve mostrar Extensão conectada. Seus cadastros e fotos permanecem salvos.';
    }
  }
  checkConnection();setInterval(()=>{if(!document.hidden)checkConnection()},4000);
}
