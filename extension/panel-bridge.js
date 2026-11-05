// Isolated bridge for the exact Pulse site and the local development panels.
(() => {
  if(!['http://127.0.0.1:4178','http://127.0.0.1:4180','https://pulse-vendas-demo.netlify.app'].includes(location.origin)||!['/','/panel.html','/index.html'].includes(location.pathname))return;
  const commands={DISCOVER_V2:'PING',PREPARE_V2:'PREPARE',STATUS_V2:'STATUS',FOCUS_V2:'FOCUS'};
  const connectorId=chrome.runtime.id;
  window.addEventListener('message',async event=>{
    const m=event.data,command=commands[m?.command];
    if(event.source!==window||event.origin!==location.origin||m?.channel!=='patio:request'||typeof m.id!=='string'||!command)return;
    if(command==='PING'?(m.connectorId&&m.connectorId!==connectorId):m.connectorId!==connectorId)return;
    let reply;
    try { reply=await chrome.runtime.sendMessage({type:'LOCAL_'+command,args:m.args}); }
    catch { reply={ok:false,error:'A extensão foi atualizada. Recarregue esta página para reconectar.'}; }
    window.postMessage({channel:'patio:reply',id:m.id,connectorId,...reply},location.origin);
  });
})();
