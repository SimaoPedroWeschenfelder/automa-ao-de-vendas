export const marketplaceUrl='https://www.facebook.com/marketplace/create/vehicle';
export function supportsFacebook(version){const m=String(version||'').match(/^(\d+)\.(\d+)\.(\d+)$/);return !!m&&(Number(m[1])>0||Number(m[2])>5||Number(m[2])===5&&Number(m[3])>=1)}
export function facebookState(task){return task.status==='review'?(task.result==='ready'?'ready':task.result==='failed'?'error':'attention'):task.status==='error'?'error':['opened','preparing'].includes(task.status)?'preparing':'attention'}
export function reportLines(value){return String(value||'').split('\n').filter(Boolean)}
export async function facebookPayload(car){
  let photos=car.photos||[];
  if(!photos.length&&Number.isInteger(car.imageIndex)&&car.imageIndex>=0&&car.imageIndex<6){
    const image=new Image();image.src=new URL('./cars.png',import.meta.url);await image.decode();const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth/3);canvas.height=Math.round(image.naturalHeight/2);const context=canvas.getContext('2d');if(!context)throw new Error('Não foi possível preparar a imagem ilustrativa.');context.drawImage(image,(car.imageIndex%3)*canvas.width,Math.floor(car.imageIndex/3)*canvas.height,canvas.width,canvas.height,0,0,canvas.width,canvas.height);photos=[{name:'pulse-teste-'+car.id+'.jpg',type:'image/jpeg',data:canvas.toDataURL('image/jpeg',.9)}];
  }
  return {...car,photos,notes:['TESTE DE DEMONSTRAÇÃO PULSE — NÃO PUBLICAR.',car.notes].filter(Boolean).join('\n\n')};
}
