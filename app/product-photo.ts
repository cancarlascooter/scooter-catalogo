export const MAX_PHOTO_BYTES=50*1024*1024;
export async function prepareProductPhoto(file:File):Promise<File>{
 if(file.size>MAX_PHOTO_BYTES)throw new Error('La foto supera los 50 MB permitidos.');
 if(!/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)&&!['image/jpeg','image/png','image/webp','image/heic','image/heif'].includes(file.type))throw new Error('Usa JPG, JPEG, PNG, WebP o HEIC.');
 const signature=new Uint8Array(await file.slice(0,16).arrayBuffer());
 const compatible=signature[0]===255&&signature[1]===216&&signature[2]===255?'image/jpeg':signature.slice(0,8).join(',')==='137,80,78,71,13,10,26,10'?'image/png':new TextDecoder().decode(signature.slice(0,4))==='RIFF'&&new TextDecoder().decode(signature.slice(8,12))==='WEBP'?'image/webp':'';
 if(compatible){if(file.type===compatible)return file;const extension=compatible==='image/jpeg'?'jpg':compatible.split('/')[1];return new File([file],file.name.replace(/\.[^.]+$/,'')+'.'+extension,{type:compatible})}
 const heic=/\.(heic|heif)$/i.test(file.name)||/image\/(heic|heif)/.test(file.type);
 // Browser-compatible photos are uploaded byte-for-byte, without a canvas or resize.
 if(!heic)return file;
 let output:Blob;
 try{const {heicTo}=await import('heic-to/csp');output=await heicTo({blob:file,type:'image/jpeg',quality:1}) as Blob}catch{throw new Error('Este dispositivo no pudo convertir la foto HEIC. Expórtala como JPG en calidad original e inténtalo de nuevo.');}
 const jpeg=new Uint8Array(await output.slice(0,3).arrayBuffer());if(jpeg[0]!==255||jpeg[1]!==216||jpeg[2]!==255)throw new Error('No se pudo convertir la foto a JPG. Inténtalo de nuevo.');
 if(output.size>MAX_PHOTO_BYTES)throw new Error('La conversión de HEIC supera 50 MB. Exporta la foto como JPG de hasta 50 MB.');
 return new File([output],file.name.replace(/\.[^.]+$/,'')+'.jpg',{type:'image/jpeg'});
}
