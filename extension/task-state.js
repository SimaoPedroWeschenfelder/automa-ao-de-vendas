export const activeStatuses=['opened','preparing'];
export const publishedStatuses=['published','sale_pending','sold'];
export function supportsBackground(version){const match=String(version||'').match(/^(\d+)\.(\d+)\./);return !!match&&(Number(match[1])>0||Number(match[2])>=4)}
export function taskIndicator(car,now=Date.now()){
  if(publishedStatuses.includes(car.status))return {tone:'neutral',label:car.status==='published'?'Publicação informada':car.status==='sold'?'Retirada confirmada':'Retirada pendente'};
  if(activeStatuses.includes(car.status)){
    const last=car.progressAt||car.preparedAt||car.updated||now;
    if(now-last>120000)return {tone:'attention',label:'Sem resposta · abrir revisão'};
    return {tone:'working',label:car.phase||'Preparando em segundo plano…'};
  }
  if(car.result==='failed'||car.status==='error')return {tone:'error',label:'Falha na preparação · tentar novamente'};
  if(car.status==='review'&&car.result==='ready')return {tone:'ready',label:'Preenchido · pronto para revisar'};
  if(car.result==='attention'||car.status==='review')return {tone:'attention',label:'Preparação encerrada · há pendências'};
  return {tone:'neutral',label:'Aguardando preparação'};
}
export function currentJob(car,job,tabId){return !!car&&!!job&&typeof car.jobId==='string'&&!!car.jobId&&car.jobId===job.jobId&&car.tabId===tabId}
export function outcome(value){return ['ready','attention','failed'].includes(value)?value:'attention'}
