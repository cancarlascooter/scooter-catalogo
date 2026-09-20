import {db,bucket,myShop,safe,sameOrigin,clean,HttpError} from '@/lib/store';
const MAX=90*1024*1024;
export async function GET(){return safe(async()=>{const shop=await myShop('videos-admin');const rows=await db().prepare('SELECT id,title,source FROM videos WHERE shop_id=? ORDER BY created_at DESC').bind(shop.id).all();return Response.json({videos:rows.results},{headers:{'Cache-Control':'no-store'}})})}
export async function POST(req:Request){return safe(async()=>{
 sameOrigin(req);const shop=await myShop('videos-admin');
 const size=Number(req.headers.get('content-length')||req.headers.get('x-video-size'));if(!Number.isSafeInteger(size)||size<=0||size>MAX)throw new HttpError(413,'Usa un video de hasta 90 MB.');
 let title='';try{title=clean(decodeURIComponent(req.headers.get('x-video-title')||''),100)}catch{throw new HttpError(400,'Revisa el título del video.')}
 if(!title||!req.body)throw new HttpError(400,'Escribe el título y selecciona un video.');
 // Read the prefix once and replay it into a bounded stream, without cloning the upload.
 const reader=req.body.getReader(),prefix:Uint8Array[]=[];const signature=new Uint8Array(16);let used=0;
 try{while(used<16){const {value,done}=await reader.read();if(done)break;prefix.push(value);const n=Math.min(16-used,value.length);signature.set(value.subarray(0,n),used);used+=n}}catch(e){void reader.cancel().catch(()=>{});throw e}
 const mime=req.headers.get('content-type')?.split(';')[0];let type='';
 if(new TextDecoder().decode(signature.slice(4,8))==='ftyp'&&['video/mp4','video/quicktime'].includes(mime||''))type=mime!;
 if(signature.slice(0,4).join(',')==='26,69,223,163'&&mime==='video/webm')type='video/webm';
 if(!type){void reader.cancel().catch(()=>{});throw new HttpError(400,'Selecciona un video MP4, MOV de iPhone o WebM.');}
 const id=crypto.randomUUID(),key=`videos/${id}`,source=`/api/video/${id}`;
 const stream=new FixedLengthStream(size),writer=stream.writable.getWriter();
 const pumping=(async()=>{try{for(const value of prefix)await writer.write(value);while(true){const {value,done}=await reader.read();if(done)break;await writer.write(value)}await writer.close()}catch(e){await writer.abort(e).catch(()=>{});throw e}finally{void reader.cancel().catch(()=>{})}})();
 try{await Promise.all([pumping,bucket().put(key,stream.readable,{httpMetadata:{contentType:type}})])}catch(e){void reader.cancel().catch(()=>{});void writer.abort(e).catch(()=>{});throw e}

 try{await db().prepare('INSERT INTO videos (id,shop_id,title,source,created_at) VALUES (?,?,?,?,?)').bind(id,shop.id,title,source,Date.now()).run()}catch(e){await bucket().delete(key).catch(()=>{});throw e}
 return Response.json({video:{id,title,source}},{status:201});
})}
export async function DELETE(req:Request){return safe(async()=>{sameOrigin(req);const shop=await myShop('videos-admin');const data=await req.json() as {id?:unknown};const id=clean(data.id,60);const found=await db().prepare('SELECT id FROM videos WHERE id=? AND shop_id=?').bind(id,shop.id).first();if(!found)throw new HttpError(404,'El video ya no está disponible.');await db().prepare('DELETE FROM videos WHERE id=? AND shop_id=?').bind(id,shop.id).run();await bucket().delete(`videos/${id}`).catch(()=>{});return Response.json({ok:true})})}
