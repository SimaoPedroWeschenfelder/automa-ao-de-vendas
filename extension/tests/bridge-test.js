let handler,nextTab=500,created=[],jobs={};
const sender={url:location.href,tab:{id:10}};
const invoke=(message,from=sender)=>new Promise(resolve=>handler(message,from,resolve));
window.chrome={
  runtime:{id:'test-connector',getURL:name=>'chrome-extension://patio-test/'+name,getManifest:()=>({version:'0.5.2'}),onMessage:{addListener:fn=>handler=fn},sendMessage:message=>invoke(message)},
  action:{onClicked:{addListener(){}}},
  storage:{session:{get:async key=>({[key]:jobs[key]}),set:async values=>Object.assign(jobs,values),remove:async key=>{delete jobs[key]}}},
  tabs:{get:async id=>{const t=created.find(t=>t.id===id);if(!t)throw new Error('Aba não encontrada');return t},remove:async id=>{created=created.filter(t=>t.id!==id)},create:async options=>{const t={id:++nextTab,...options};created.push(t);return t},update:async(id,options)=>{const t=created.find(t=>t.id===id);if(!t)throw new Error('Aba não encontrada');if(options.url&&!jobs['job:'+id])throw new Error('Tarefa não registrada antes da navegação');Object.assign(t,options);return t},onRemoved:{addListener(){}}}
};
await import('/background.js');
await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='/panel-bridge.js';s.onload=resolve;s.onerror=reject;document.head.append(s)});
const {extensionRequest}=await import('/bridge-client.js');
function check(condition,label){const li=document.createElement('li');li.textContent=(condition?'✓ ':'✕ ')+label;document.getElementById('results').append(li);if(!condition)throw new Error(label)}
try{
  check((await extensionRequest('PING')).version==='0.5.2','Painel reconhece a versão da extensão.');
  const car={id:'qa-'+crypto.randomUUID(),brand:'Volkswagen',model:'T-Cross · SIMULAÇÃO',year:2022,price:100000,mileage:40000,photos:[]};
  const result=await extensionRequest('PREPARE',{car});
  check(created.length===1&&created[0].url==='https://www.facebook.com/marketplace/create/vehicle','Preparar envia o cadastro e abre uma única aba de veículo.');
  const fb={url:'https://www.facebook.com/marketplace/create/vehicle',tab:{id:result.tabId}};
  const job=await invoke({type:'JOB'},fb);
  check(job.ok&&job.data.autoStart&&job.data.car.model===car.model,'Formulário recebe o carro correto e a ordem para iniciar sozinho.');
  const first=await invoke({type:'START'},fb),second=await invoke({type:'START'},fb);
  check(first.data===true&&second.data===false,'O início automático é consumido uma vez, preservando a revisão ao recarregar.');
  await invoke({type:'REPORT',report:'✓ Preenchimento encerrado; revisão necessária.',result:'ready'},fb);
  const [status]=await extensionRequest('STATUS',{ids:[car.id]});
  check(status.status==='review'&&status.report.includes('Preenchimento encerrado'),'Relatório retorna ao painel e atualiza o estado para revisão.');
  const blocked=await invoke({type:'LOCAL_PREPARE',args:{car}},{url:'https://outro-site.test/',tab:{id:100}});
  check(!blocked.ok&&created.length===1,'Outra origem não pode disparar preparação.');
  const bad={...car,id:'invalid',price:-1};let rejected=false;
  try{await extensionRequest('PREPARE',{car:bad})}catch{rejected=true}
  check(rejected&&created.length===1,'Cadastro inválido não abre uma aba.');
  document.getElementById('summary').textContent='PASSOU: sete verificações da conexão e do início automático.';
}catch(error){document.getElementById('summary').textContent='FALHOU: '+error.message;}
