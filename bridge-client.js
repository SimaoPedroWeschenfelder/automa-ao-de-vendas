const commands={PREPARE:'PREPARE_V2',STATUS:'STATUS_V2',FOCUS:'FOCUS_V2'};
export function createExtensionClient(channelWindow,origin){
  let connectorId=null,discovering=null;
  function request(command,args,timeout,target){return new Promise((resolve,reject)=>{
    const id=crypto.randomUUID();
    const cleanup=()=>{clearTimeout(timer);channelWindow.removeEventListener('message',listener)};
    const listener=event=>{
      const m=event.data;
      if(event.source!==channelWindow||event.origin!==origin||m?.channel!=='patio:reply'||m.id!==id||typeof m.connectorId!=='string'||!m.connectorId||(target&&m.connectorId!==target))return;
      if(command==='DISCOVER_V2'&&m.ok&&m.data?.connectorId!==m.connectorId)return;
      cleanup();m.ok?resolve(m.data):reject(new Error(m.error||'O conector não respondeu.'));
    };
    const timer=setTimeout(()=>{cleanup();reject(new Error('Conector Pulse desconectado. Recarregue a extensão 0.5.2 e atualize esta página no mesmo navegador.'))},timeout);
    channelWindow.addEventListener('message',listener);
    channelWindow.postMessage({channel:'patio:request',id,command,args,connectorId:target},origin);
  })}
  async function discover(timeout){
    if(discovering)return discovering;
    discovering=(async()=>{try{const info=await request('DISCOVER_V2',{},timeout,connectorId);connectorId=info.connectorId;return info}catch(error){connectorId=null;throw error}finally{discovering=null}})();
    return discovering;
  }
  return async function(command,args={},timeout=12000){
    if(command==='PING')return discover(timeout);
    if(!commands[command])throw new Error('Operação do conector não reconhecida.');
    if(!connectorId)await discover(timeout);
    try{return await request(commands[command],args,timeout,connectorId)}catch(error){connectorId=null;throw error}
  };
}
let defaultClient;
export function extensionRequest(...args){defaultClient||=createExtensionClient(window,location.origin);return defaultClient(...args)}
