export const marketplaceUrl='https://www.facebook.com/marketplace/create/vehicle';
export function supportsFacebook(version){const m=String(version||'').match(/^(\d+)\.(\d+)\.(\d+)$/);return !!m&&(Number(m[1])>0||Number(m[2])>5||Number(m[2])===5&&Number(m[3])>=2)}
export function facebookState(task){return task.status==='review'?(task.result==='ready'?'ready':task.result==='failed'?'error':'attention'):task.status==='error'?'error':['opened','preparing'].includes(task.status)?'preparing':'attention'}
export function reportLines(value){return String(value||'').split('\n').filter(Boolean)}
export async function facebookPayload(car){
  if(car.demo||car.needsReview||Number.isInteger(car.imageIndex))throw new Error('Revise o cadastro e use fotos reais antes de preparar o anúncio.');
  return {...car,photos:car.photos||[],notes:car.notes||''};
}
