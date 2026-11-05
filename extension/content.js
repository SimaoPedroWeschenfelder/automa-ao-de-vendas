(() => {
  if(document.getElementById('patio-assistant'))return;
  const send=async(type,args={})=>{const r=await chrome.runtime.sendMessage({type,...args});if(!r?.ok)throw new Error(r?.error||'Extensão indisponível.');return r.data};
  const norm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
  const visible=e=>!!e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden';
  const pause=ms=>new Promise(r=>setTimeout(r,ms));
  async function until(find,ms=7000){const end=Date.now()+ms;while(Date.now()<end){const found=find();if(found)return found;await pause(160)}return null}
  function labels(e){return [e.getAttribute('aria-label'),...(e.labels?[...e.labels].map(l=>l.textContent):[]),e.getAttribute('placeholder'),e.getAttribute('aria-labelledby')?.split(' ').map(id=>document.getElementById(id)?.textContent).join(' ')].filter(Boolean).map(norm)}
  function field(names){const all=[...document.querySelectorAll('input:not([type=file]):not([type=hidden]),textarea,[role=combobox]')].filter(e=>visible(e)&&!e.disabled&&!e.readOnly&&!e.closest('#patio-assistant')&&names.some(n=>labels(e).includes(norm(n))));return all.length===1?all[0]:null}
  function fill(e,v){const proto=e instanceof HTMLTextAreaElement?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(e,v);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))}
  function sameValue(e,value,title){if(!['Preço','Quilometragem'].includes(title))return e.value===value;const currency=/^\s*R\$/i.test(e.value);let text=e.value.replace(/^\s*R\$\s*/i,'').replace(/\s|\u00a0/g,'');if(text.includes(','))text=text.replace(/\./g,'').replace(',','.');else if(currency||/^\d{1,3}(\.\d{3})+$/.test(text))text=text.replace(/\./g,'');return /^\d+(\.\d+)?$/.test(text)&&Number(text)===Number(value)}
  function dismiss(e){for(const type of ['keydown','keyup'])e.dispatchEvent(new KeyboardEvent(type,{key:'Escape',code:'Escape',bubbles:true}))}
  function optionLeaves(){const boxes=[...document.querySelectorAll('[role=listbox]')].filter(visible);return boxes.length===1?[...boxes[0].querySelectorAll('[role=option]')].filter(e=>visible(e)&&!e.querySelector('[role=option]')):[]}
  function option(values){for(const value of values){const found=optionLeaves().filter(e=>norm(e.textContent)===norm(value));if(found.length===1)return found[0]}return null}
  function cityOption(value){const exact=option([value]);if(exact)return exact;const city=norm(String(value).split(/[,/]/)[0]);const matches=optionLeaves().filter(e=>{const primary=[...e.querySelectorAll('span')].find(s=>norm(s.textContent));return primary&&norm(primary.textContent)===city});return matches.length===1?matches[0]:null}
  function selected(e,values){return [...e.querySelectorAll('span')].some(s=>values.some(v=>norm(s.textContent)===norm(v)))}
  async function select(names,values,report){
    values=values.filter(Boolean).map(String);if(!values.length){report.push(`⚠ ${names[0]}: não informado.`);return false}
    const e=await until(()=>field(names));if(!e){report.push(`⚠ ${names[0]}: campo não localizado.`);return false}
    if(e instanceof HTMLInputElement&&e.getAttribute('role')!=='combobox'){fill(e,values[0]);report.push(`✓ ${names[0]}: ${values[0]}.`);return true}
    if(selected(e,values)){report.push(`✓ ${names[0]}: ${values[0]}.`);return true}
    e.scrollIntoView({block:'center'});e.click();const item=await until(()=>option(values),3500);
    if(!item){dismiss(e);report.push(`⚠ ${names[0]}: opção “${values[0]}” ausente ou ambígua.`);return false}
    item.scrollIntoView({block:'center'});item.click();await pause(220);
    const current=field(names),ok=current&&selected(current,values);report.push(`${ok?'✓':'⚠'} ${names[0]}: ${ok?values[0]:'confira a seleção na tela'}.`);return !!ok;
  }
  async function main(){
    let job;for(let i=0;i<8&&!job;i++){job=await send('JOB');if(!job)await pause(400)}if(!job?.car)return;
    const c=job.car,host=document.createElement('div');host.id='patio-assistant';host.style.cssText='position:fixed;bottom:18px;right:18px;z-index:2147483647;width:340px;max-width:calc(100vw - 36px)';
    const shadow=host.attachShadow({mode:'open'});shadow.innerHTML='<style>:host{font:13px/1.5 Segoe UI,Arial;color:#193828}section{background:#fff;border:1px solid #c3d4ba;box-shadow:0 8px 40px #0003;border-radius:14px;padding:18px}h3{margin:0 0 8px;font-size:18px}p{margin:8px 0}button{background:#245d42;color:white;border:0;border-radius:7px;padding:9px 12px;cursor:pointer;margin:4px;font:inherit}button:disabled{opacity:.5}textarea{width:100%;box-sizing:border-box;height:65px;font:12px/1.4 Segoe UI}small{color:#69806a}pre{white-space:pre-wrap;max-height:190px;overflow:auto;font:12px/1.5 Segoe UI}</style><section><h3>Pulse · preparando anúncio</h3><div id="details"><p id="car"></p><p id="state">Aguardando formulário…</p><pre id="report"></pre><button id="fill" disabled>Tentar novamente</button><small>Descrição do cadastro:</small><textarea readonly id="description"></textarea><p><small>A publicação continua sob sua revisão.</small></p></div><button id="hide">Recolher</button></section>';
    document.body.append(host);host.dataset.result='working';const $=s=>shadow.querySelector(s);
    shadow.querySelector('style').textContent+='h3:before{content:"";display:inline-block;width:9px;height:9px;margin-right:8px;border-radius:50%;background:#5d8ec1}:host([data-result="ready"]) h3:before{background:#32a34a}:host([data-result="attention"]) h3:before{background:#dba214}:host([data-result="failed"]) h3:before{background:#d65543}';
    $('#car').textContent=`${c.brand} ${c.model} · ${c.year} · R$ ${Number(c.price).toLocaleString('pt-BR')}`;
    const desc=job.description||[`${c.brand} ${c.model} ${c.year}`,`Quilometragem: ${Number(c.mileage).toLocaleString('pt-BR')} km`,c.notes].filter(Boolean).join('\n');$('#description').value=desc;
    $('#hide').onclick=()=>{$('#details').hidden=!$('#details').hidden;$('#hide').textContent=$('#details').hidden?'Expandir':'Recolher'};
    let running=false,attached=false;
    async function prepare(){
      if(running)return;running=true;host.dataset.result='working';$('#fill').disabled=true;const report=[];let failed=false;
      const heartbeat=setInterval(()=>send('PROGRESS',{phase:$('#state').textContent}).catch(()=>{}),5000);
      const progress=t=>{$('#state').textContent=t;$('#report').textContent=report.join('\n');send('PROGRESS',{phase:t}).catch(()=>{})};
      try{
        if(!/^\/marketplace\/create\/vehicle\/?$/.test(location.pathname))throw new Error('Abra a criação de anúncio de veículo nesta aba.');
        progress('Carregando os campos do Facebook…');
        if(!await until(()=>field(['Tipo de veículo','Vehicle type']),25000))throw new Error('Formulário não carregou. Confira o login e o acesso ao Marketplace.');
        progress('Selecionando o tipo de veículo…');
        if(!await select(['Tipo de veículo','Vehicle type'],['Carro/picape','Car/truck'],report))throw new Error('Não foi possível configurar o formulário de carro.');
        progress('Selecionando ano e fabricante…');
        await select(['Ano','Year'],[String(c.year)],report);await select(['Fabricante','Marca','Make'],[c.brand],report);
        for(const [title,names,value] of [['Modelo',['Modelo','Model'],[c.model,c.version].filter(Boolean).join(' ')],['Quilometragem',['Quilometragem','Mileage'],String(c.mileage)],['Preço',['Preço','Price'],String(c.price)],['Descrição',['Descrição','Description'],desc]]){
          progress(`Preenchendo ${title.toLowerCase()}…`);const e=await until(()=>field(names),4000);
          if(!e||!(e instanceof HTMLInputElement||e instanceof HTMLTextAreaElement)){report.push(`⚠ ${title}: campo não localizado.`);continue}
          if(e.value&&!sameValue(e,value,title)){report.push(`⚠ ${title}: valor existente preservado; confira.`);continue}
          e.focus();fill(e,value);await pause(150);const ok=sameValue(e,value,title);report.push(`${ok?'✓':'⚠'} ${title}: ${ok?'preenchido':'confira na tela'}.`);
        }
        progress('Selecionando detalhes cadastrados…');
        if(c.transmission){const t=norm(c.transmission);const values=t==='manual'?['Transmissão manual',c.transmission]:['automatico','automatica','transmissao automatica'].includes(t)?['Transmissão automática',c.transmission]:[c.transmission];await select(['Câmbio','Transmission'],values,report);}else report.push('⚠ Câmbio não informado. Confira o valor padrão do Facebook.');
        if(c.fuel)await select(['Tipo de combustível','Fuel type'],[c.fuel],report);else report.push('⚠ Combustível não informado.');
        for(const [names,value] of [[['Estilo da carroceria','Body style'],c.bodyStyle],[['Cor externa','Exterior color'],c.exteriorColor],[['Cor interna','Interior color'],c.interiorColor],[['Condição do veículo','Vehicle condition'],c.condition]])if(value)await select(names,[value],report);
        if(c.city){progress('Definindo a localização…');const e=field(['Localização','Location']);if(e instanceof HTMLInputElement){e.focus();fill(e,c.city);await pause(900);const item=await until(()=>cityOption(c.city),6000);if(item){item.click();await pause(220);const current=field(['Localização','Location']),ok=current&&current.getAttribute('aria-expanded')!=='true'&&norm(current.value.split(/[,/]/)[0])===norm(c.city.split(/[,/]/)[0]);report.push(`${ok?'✓':'⚠'} Cidade: ${ok?'selecionada; confira a localização na revisão':'confira a seleção no Facebook'}.`)}else{dismiss(e);report.push(`⚠ Localização: confirme a sugestão correta para ${c.city}.`)}}else report.push('⚠ Localização: campo não localizado.')}else report.push('⚠ Cidade não informada. Confira a localização do anúncio.');
        progress('Anexando fotos…');
        if(c.photos?.length&&!attached){const input=await until(()=>{const matches=[...document.querySelectorAll('input[type=file]')].filter(e=>/image/i.test(e.getAttribute('accept')||'')&&(e.multiple||c.photos.length===1));return matches.length===1?matches[0]:null},6000);
          if(!input||input.files?.length)report.push('⚠ Fotos: entrada ausente ou já preenchida; confira as miniaturas.');
          else{const dt=new DataTransfer();for(const p of c.photos){const [meta,b64]=p.data.split(',');if(!/^data:image\/(jpeg|png|webp);base64$/.test(meta))throw new Error('Formato de foto inválido.');dt.items.add(new File([Uint8Array.from(atob(b64),x=>x.charCodeAt(0))],p.name,{type:p.type}))}input.files=dt.files;input.dispatchEvent(new Event('change',{bubbles:true}));attached=true;
            const confirmed=await until(()=>{const count=document.body.innerText.match(/(\d+)\s+fotos?\s+anexadas?/i);return count&&Number(count[1])>=c.photos.length},30000);
            report.push(`${confirmed?'✓':'⚠'} Fotos: ${confirmed?`${c.photos.length} anexadas; confira as miniaturas`:'arquivos enviados ao formulário; confirme se o upload terminou'}.`);
          }
        }else report.push(attached?'✓ Fotos já enviadas nesta aba; confira as miniaturas.':'⚠ Nenhuma foto cadastrada.');
        const next=[...document.querySelectorAll('button,[role=button]')].filter(visible).find(e=>['avancar','next'].includes(norm(e.textContent)));
        if(next&&(next.disabled||next.getAttribute('aria-disabled')==='true'))report.push('⚠ O Facebook ainda não liberou a próxima etapa. Confira campos obrigatórios e processamento das fotos.');
        for(const alert of [...document.querySelectorAll('[role=alert]')].filter(visible)){const message=alert.textContent.trim();if(/erro|falha|não foi possível|failed|error/i.test(message))report.push('⚠ Mensagem do Facebook: '+message.slice(0,300))}
        report.push('Revise todos os campos. O agente não marcou declarações de ausência de danos ou pendências.');
        shadow.querySelector('h3').textContent=report.some(l=>l.startsWith('⚠'))?'Pulse · revise as pendências':'Pulse · pronto para revisar';progress('Preparação encerrada. Confira o anúncio antes de publicar.');
      }catch(e){failed=true;report.push('⚠ '+e.message);shadow.querySelector('h3').textContent='Pulse · falha na preparação';progress('A preparação encontrou uma falha. Seus dados estão salvos.');}
      finally{clearInterval(heartbeat);const result=failed?'failed':report.some(l=>l.startsWith('⚠'))?'attention':'ready';host.dataset.result=result;$('#report').textContent=report.join('\n');$('#fill').disabled=false;running=false;await send('REPORT',{report:report.join('\n'),result}).catch(()=>{$('#state').textContent='Não foi possível avisar o painel. Confira sua conexão com a extensão.'})}
    }
    $('#details').hidden=true;$('#hide').textContent='Ver detalhes';
    shadow.querySelector('h3').style.cursor='pointer';shadow.querySelector('h3').onclick=()=>{$('#details').hidden=!$('#details').hidden};
    $('#fill').onclick=async()=>{try{if(await send('RETRY'))await prepare();else $('#state').textContent='Esta preparação não está mais ativa. Volte ao painel e use Preparar novamente.'}catch(e){$('#state').textContent=e.message}};
    if(job.autoStart&&await send('START'))await prepare();else{$('#state').textContent='Esta aba já foi preparada. Seus ajustes foram preservados. Use Tentar novamente se necessário.';$('#fill').disabled=false}
  }
  main().catch(async error=>{const warning=document.createElement('aside');warning.style.cssText='position:fixed;bottom:16px;right:16px;z-index:2147483647;background:#fff0eb;color:#9c382b;border:1px solid #e4b1a7;padding:16px;max-width:320px;font:13px/1.5 Segoe UI';warning.textContent='Pulse não conseguiu iniciar. Volte ao painel e tente novamente. '+error.message;(document.body||document.documentElement).append(warning);await send('REPORT',{result:'failed',report:'⚠ Não foi possível iniciar: '+error.message}).catch(()=>{})});
})();
