let started=false,published=false,detailsAdded=false,citySelected=false;
const readyCase=new URL(location.href).searchParams.get('case')==='ready';
const root=document.getElementById('fields');
function combo(name,values){
  const label=document.createElement('label');label.setAttribute('role','combobox');label.setAttribute('aria-expanded','false');label.tabIndex=0;
  const nameSpan=document.createElement('span');nameSpan.id='f-'+name.replace(/\W/g,'');nameSpan.textContent=name;label.setAttribute('aria-labelledby',nameSpan.id);
  const selected=document.createElement('span');selected.textContent=' ';label.append(nameSpan,selected);root.append(label,document.createElement('br'));
  label.onclick=()=>{document.querySelector('[role=listbox]')?.remove();label.setAttribute('aria-expanded','true');const list=document.createElement('div');list.setAttribute('role','listbox');for(const value of values){const item=document.createElement('div');item.setAttribute('role','option');const inner=document.createElement('div');inner.setAttribute('role','option');inner.textContent=value;item.append(inner);item.onclick=event=>{event.stopPropagation();selected.textContent=value;list.remove();label.setAttribute('aria-expanded','false');if(name==='Tipo de veículo'&&!detailsAdded){detailsAdded=true;addDetails()}};list.append(item)}document.body.append(list)};
  label.onkeydown=e=>{if(e.key==='Escape'){document.querySelector('[role=listbox]')?.remove();label.setAttribute('aria-expanded','false')}};
}
function input(name,value=''){const label=document.createElement('label');label.textContent=name;const field=document.createElement(name==='Descrição'?'textarea':'input');field.value=value;field.id='input-'+name;label.append(field);root.append(label,document.createElement('br'))}
combo('Tipo de veículo',['Carro/picape','Motocicleta']);
function addDetails(){combo('Ano',['2023','2022','2021']);combo('Fabricante',['Volkswagen','Toyota']);input('Modelo');input('Quilometragem');input('Preço','R$ 99.999');document.getElementById('input-Preço').oninput=e=>e.target.value='R$ '+Number(e.target.value.replace(/\D/g,'')).toLocaleString('pt-BR');input('Descrição');combo('Câmbio',['Transmissão automática','Transmissão manual']);combo('Tipo de combustível',['Gasolina','Flex']);if(readyCase){input('Localização');document.getElementById('input-Localização').oninput=e=>{if(document.activeElement!==e.target)return;document.querySelector('[role=listbox]')?.remove();const list=document.createElement('div');list.setAttribute('role','listbox');for(const city of ['Curitiba','Cidade Industrial de Curitiba']){const item=document.createElement('div');item.setAttribute('role','option');const inner=document.createElement('div');inner.setAttribute('role','option');for(const text of [city,'Cidade']){const span=document.createElement('span');span.textContent=text;inner.append(span)}item.append(inner);item.onclick=()=>{e.target.value=city;citySelected=city==='Curitiba';list.remove()};list.append(item)}document.body.append(list)}}}
document.getElementById('publish').onclick=()=>{published=true};
document.querySelector('input[type=file]').onchange=e=>document.getElementById('photo-count').textContent=`${e.target.files.length} fotos anexadas`;
const image='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl6hAAAAABJRU5ErkJggg==';
window.chrome={runtime:{sendMessage:async m=>{
  if(m.type==='JOB'){const car={brand:'Toyota',model:'Corolla',year:2022,price:readyCase?99999:115000,mileage:42000,transmission:'Manual',fuel:'Flex',city:readyCase?'Curitiba, Paraná':'',photos:[{name:'teste.png',type:'image/png',data:image}]};const {descriptionFor}=await import('/model.js');return{ok:true,data:{autoStart:!started,car,description:descriptionFor(car)}}}
  if(m.type==='START'){const allowed=!started;started=true;return{ok:true,data:allowed}}
  if(m.type==='PROGRESS')return{ok:true,data:true};
  if(m.type==='REPORT'){
    const get=name=>document.getElementById('input-'+name)?.value;
    const selected=name=>Array.from(root.querySelectorAll('label[role=combobox]')).find(e=>e.querySelector('span').textContent===name)?.lastElementChild.textContent;
    const passed=get('Preço')==='R$ 99.999'&&get('Modelo')==='Corolla'&&get('Quilometragem')==='42000'&&get('Descrição')?.includes('42.000 km')&&selected('Fabricante')==='Toyota'&&selected('Ano')==='2022'&&selected('Câmbio')==='Transmissão manual'&&selected('Tipo de combustível')==='Flex'&&(!readyCase||citySelected)&&document.querySelector('input[type=file]').files.length===1&&!published&&m.result===(readyCase?'ready':'attention');
    document.getElementById('result').textContent=passed?`PASSOU: preparação automática, foto anexada e indicador ${readyCase?'VERDE (preenchido)':'AMARELO (pendências)'}. Nenhuma publicação.`:'FALHOU: confira os campos e o relatório.';return{ok:true,data:true};
  }
}}};
