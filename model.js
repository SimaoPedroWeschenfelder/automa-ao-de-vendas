export const vehicleFields=['brand','model','version','year','manufacturingYear','price','mileage','transmission','fuel','city','bodyStyle','exteriorColor','interiorColor','condition','engine','power','doors','seats','features','serviceHistory','warranty','notes','photos'];
const text=value=>typeof value==='string'?value.trim():'';
const provided=value=>value!==undefined&&value!==null&&value!=='';
function numeric(value,label,{min=0,max=Number.MAX_SAFE_INTEGER,integer=false}={}){
  if(!['string','number'].includes(typeof value)||String(value).trim()===''||!/^\d+(\.\d+)?$/.test(String(value).trim()))throw new Error(`Informe ${label} com um número válido.`);
  const n=Number(value);if(!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n)))throw new Error(`Confira ${label}: valor fora do intervalo permitido.`);return n;
}
export function descriptionFor(c){
  const optional=(label,value)=>provided(value)&&`${label}: ${value}`;
  return [
    `${text(c.brand)} ${text(c.model)} ${c.year}`,
    optional('Versão',text(c.version)),optional('Ano de fabricação',c.manufacturingYear),
    `Quilometragem: ${Number(c.mileage).toLocaleString('pt-BR')} km`,
    optional('Motor',text(c.engine)),optional('Potência (cv)',c.power),
    optional('Câmbio',text(c.transmission)),optional('Combustível',text(c.fuel)),
    optional('Carroceria',text(c.bodyStyle)),optional('Cor externa',text(c.exteriorColor)),optional('Cor interna',text(c.interiorColor)),
    optional('Portas',c.doors),optional('Lugares',c.seats),optional('Condição informada',text(c.condition)),optional('Localização',text(c.city)),
    text(c.features)&&`\nOpcionais confirmados:\n${text(c.features)}`,
    text(c.serviceHistory)&&`\nManutenção informada:\n${text(c.serviceHistory)}`,
    text(c.warranty)&&`\nGarantia informada:\n${text(c.warranty)}`,
    text(c.notes)&&`\n${text(c.notes)}`
  ].filter(Boolean).join('\n');
}
export function listingUrl(value){
  try{const u=new URL(value);return u.protocol==='https:'&&u.hostname==='www.facebook.com'&&!u.username&&!u.password&&!u.port&&/^\/marketplace\/item\/\d+\/?$/.test(u.pathname)?u.origin+u.pathname:null}catch{return null}
}
export function validate(c){
  if(!c||typeof c!=='object'||Array.isArray(c))throw new Error('Cadastro de veículo inválido.');
  if(!text(c.brand)||!text(c.model))throw new Error('Informe marca e modelo.');
  for(const key of vehicleFields.filter(k=>!['year','manufacturingYear','price','mileage','power','doors','seats','photos'].includes(k))){if(c[key]!==undefined&&typeof c[key]!=='string')throw new Error(`O campo ${key} deve ser texto.`);if(text(c[key]).length>(['notes','features','serviceHistory','warranty'].includes(key)?4000:200))throw new Error(`O campo ${key} está muito longo.`)}
  const year=numeric(c.year,'o ano do modelo',{min:1900,max:new Date().getFullYear()+2,integer:true});
  const price=numeric(c.price,'o preço',{min:0.01});if(Math.abs(price*100-Math.round(price*100))>0.0001)throw new Error('O preço deve ter no máximo duas casas decimais.');
  numeric(c.mileage,'a quilometragem',{integer:true});
  if(provided(c.manufacturingYear))numeric(c.manufacturingYear,'o ano de fabricação',{min:1900,max:year,integer:true});
  if(provided(c.power))numeric(c.power,'a potência em cv',{min:1,max:5000});
  if(provided(c.doors))numeric(c.doors,'o número de portas',{min:1,max:6,integer:true});
  if(provided(c.seats))numeric(c.seats,'o número de lugares',{min:1,max:20,integer:true});
  if(!Array.isArray(c.photos)||c.photos.length>20)throw new Error('Use até 20 fotos.');
  let total=0;
  const seen=new Set();
  for(const p of c.photos){
    if(!p||typeof p.name!=='string'||!p.name||p.name.length>240||typeof p.data!=='string'||!['image/jpeg','image/png','image/webp'].includes(p.type))throw new Error('Foto inválida. Use JPG, PNG ou WebP.');
    const match=p.data.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
    if(!match||match[1]!==p.type||match[2].length%4!==0)throw new Error(`A foto “${p.name}” está corrompida ou tem formato incompatível.`);
    const base64=match[2],bytes=base64.length*3/4-(base64.endsWith('==')?2:base64.endsWith('=')?1:0);total+=bytes;
    if(bytes>5*1024*1024)throw new Error('Use fotos de até 5 MB cada.');
    const header=atob(base64.slice(0,64));
    const valid=p.type==='image/png'?header.startsWith('\x89PNG\r\n\x1a\n'):p.type==='image/jpeg'?header.startsWith('\xff\xd8\xff'):header.startsWith('RIFF')&&header.slice(8,12)==='WEBP';
    if(!valid)throw new Error(`A foto “${p.name}” não corresponde ao formato informado.`);
    if(seen.has(p.data))throw new Error('Há fotos repetidas. Remova a cópia antes de salvar.');seen.add(p.data);
  }
  if(total>25*1024*1024)throw new Error('Use no máximo 25 MB de fotos por carro.');
  if(descriptionFor(c).length>5000)throw new Error('Encurte os detalhes: a descrição montada deve ter até 5.000 caracteres.');
  return c;
}
export function snapshot(c){validate(c);return Object.fromEntries(vehicleFields.filter(k=>c[k]!==undefined).map(k=>[k,c[k]]))}
export function preparationWarnings(c){
  const warnings=[];
  if(!text(c.city))warnings.push('Informe a cidade/UF para evitar uma localização incorreta.');
  if(!c.photos?.length)warnings.push('Adicione pelo menos uma foto do veículo.');
  if(!text(c.transmission))warnings.push('Informe o câmbio: o Facebook pode trazer um valor padrão incorreto.');
  if(!text(c.fuel))warnings.push('Informe o combustível.');
  return warnings;
}
export function backupCars(data){
  if(data?.format!=='patio-backup'||data.version!==1||!Array.isArray(data.cars)||data.cars.length>100)throw new Error('Selecione um arquivo de cadastros exportado pelo Pátio (até 100 carros).');
  return data.cars.map(c=>({...snapshot(c),transferKey:typeof c.transferKey==='string'?c.transferKey:typeof c.id==='string'?c.id:crypto.randomUUID()}));
}
