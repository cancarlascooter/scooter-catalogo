export async function prepareDepartmentSymbol(file:File):Promise<File>{
 if(file.size>50*1024*1024)throw new Error('El archivo debe pesar hasta 50 MB.');
 const signature=new TextDecoder().decode(await file.slice(0,5).arrayBuffer());
 let canvas:HTMLCanvasElement;
 if(signature==='%PDF-'){
  const pdfjs=await import('pdfjs-dist');
  const {default:workerUrl}=await import('pdfjs-dist/build/pdf.worker.min.mjs?url');
  pdfjs.GlobalWorkerOptions.workerSrc=workerUrl;
  const task=pdfjs.getDocument({data:new Uint8Array(await file.arrayBuffer())});
  task.onPassword=()=>{void task.destroy()};
  try{const doc=await task.promise;const page=await doc.getPage(1),base=page.getViewport({scale:1});const viewport=page.getViewport({scale:Math.min(1024/base.width,1024/base.height)});canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.ceil(viewport.width));canvas.height=Math.max(1,Math.ceil(viewport.height));await page.render({canvas,viewport,background:'rgba(255,255,255,0)'}).promise}catch{throw new Error('No pudimos abrir el PDF. Usa uno sin contraseña o sube el símbolo como imagen.')}finally{await task.destroy()}
 }else{
  const {prepareProductPhoto}=await import('./product-photo');const image=await prepareProductPhoto(file),url=URL.createObjectURL(image);
  try{const img=new Image();img.src=url;await img.decode();const scale=Math.min(1,1024/img.naturalWidth,1024/img.naturalHeight);canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));canvas.getContext('2d')!.drawImage(img,0,0,canvas.width,canvas.height)}catch{throw new Error('No pudimos leer la imagen. Intenta con otra foto.')}finally{URL.revokeObjectURL(url)}
 }
 const blob=await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('No se pudo preparar el símbolo.')),'image/png'));
 return new File([blob],'simbolo.png',{type:'image/png'});
}
