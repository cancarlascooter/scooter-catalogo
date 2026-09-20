import {db,bucket,myShop,safe,sameOrigin,clean,HttpError} from '@/lib/store';
const MAX=90*1024*1024;
export async function GET(){return safe(async()=>{const shop=await myShop();const rows=await db().prepare('SELECT id,title,source FROM videos WHERE shop_id=? ORDER BY created_at DESC').bind(shop.id).all();return Response.json({videos:rows.results},{headers:{'Cache-Control':'no-store'}})})}
export async function POST(req:Request){return safe(async()=>{
 sameOrigin(req);const shop=await myShop();
 const size=Number(req.headers.get('content-length'));if(!Number.isSafeInteger(size)||size<=0||size>MAX)throw new HttpError(413,'Usa un video de hasta 90 MB.');
 let title='';try{title=clean(decodeURIComponent(req.headers.get('x-video-title')||''),100)}catch{throw new HttpError(400,'Revisa el título del video.')}
 if(!title||!req.body)throw new HttpError(400,'Escribe el título y selecciona un video.');
 // Inspect only the signature; stream the original body to R2 without buffering the video.
 const reader=req.clone().body!.getReader();const signature=new Uint8Array(16);let used=0;
 try{while(used<16){const {value,done}=await reader.read();if(done)break;const n=Math.min(16-used,value.length);signature.set(value.subarray(0,n),used);used+=n}}finally{void reader.cancel().catch(()=>{})}
 const mime=req.headers.get('content-type')?.split(';')[0];let type='';
 if(new TextDecoder().decode(signature.slice(4,8))==='ftyp'&&mime==='video/mp4')type='video/mp4';
 if(signature.slice(0,4).join(',')==='26,69,223,163'&&mime==='video/webm')type='video/webm';
 if(!type)throw new HttpError(400,'Selecciona un video MP4 o WebM.');
 const id=crypto.randomUUID(),key=`videos/${id}`,source=`/api/video/${id}`;
 await bucket().put(key,req.body,{httpMetadata:{contentType:type}});
 try{await db().prepare('INSERT INTO videos (id,shop_id,title,source,created_at) VALUES (?,?,?,?,?)').bind(id,shop.id,title,source,Date.now()).run()}catch(e){await bucket().delete(key).catch(()=>{});throw e}
 return Response.json({video:{id,title,source}},{status:201});
})}
export async function DELETE(req:Request){return safe(async()=>{sameOrigin(req);const shop=await myShop();const data=await req.json() as {id?:unknown};const id=clean(data.id,60);const found=await db().prepare('SELECT id FROM videos WHERE id=? AND shop_id=?').bind(id,shop.id).first();if(!found)throw new HttpError(404,'El video ya no está disponible.');await db().prepare('DELETE FROM videos WHERE id=? AND shop_id=?').bind(id,shop.id).run();await bucket().delete(`videos/${id}`).catch(()=>{});return Response.json({ok:true})})}
