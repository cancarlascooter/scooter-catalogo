import type {CatalogVideo} from './shared';
export function uploadVideo(file:File,title:string,onProgress:(percent:number)=>void):Promise<{video:CatalogVideo}>{
 return new Promise((resolve,reject)=>{
  const xhr=new XMLHttpRequest();xhr.open('POST','/api/videos');xhr.timeout=15*60*1000;
  xhr.setRequestHeader('Content-Type',file.type||(/\.mov$/i.test(file.name)?'video/quicktime':/\.webm$/i.test(file.name)?'video/webm':'video/mp4'));xhr.setRequestHeader('X-Video-Title',encodeURIComponent(title));xhr.setRequestHeader('X-Video-Size',String(file.size));
  xhr.upload.onprogress=e=>{if(e.lengthComputable)onProgress(Math.min(100,Math.round(e.loaded/e.total*100)))};
  xhr.onerror=()=>reject(new Error('Se interrumpió la conexión al subir el video. Mantén esta pantalla abierta y vuelve a intentarlo con una conexión estable.'));
  xhr.ontimeout=()=>reject(new Error('La carga tardó demasiado. Revisa tu conexión y vuelve a intentarlo.'));
  xhr.onload=()=>{let data;try{data=JSON.parse(xhr.responseText)}catch{
   const message=xhr.status===413?'El video supera el tamaño permitido (90 MB).':xhr.status===401?'Tu sesión venció. Inicia sesión de nuevo.':`El servidor interrumpió la carga (error ${xhr.status}). Conservamos el video seleccionado; vuelve a intentarlo.`;
   reject(new Error(message));return;
  }if(xhr.status<200||xhr.status>=300){reject(new Error(data.error||`No se pudo guardar el video (error ${xhr.status}).`));return}if(!data.video){reject(new Error('El servidor no confirmó que se guardó el video. Actualiza la lista antes de intentarlo nuevamente.'));return}resolve(data)};
  xhr.send(file);
 });
}
