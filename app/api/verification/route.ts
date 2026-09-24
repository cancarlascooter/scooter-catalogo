import {db,bucket,safe,sameOrigin,clean,HttpError,publicStore} from '@/lib/store';
import {digest,token,rateLimit} from '@/lib/admin-auth';
import {currentVerification,verificationCookie,purgeExpiredDocuments,normalizePhone} from '@/lib/customer-verification';
export async function GET(req:Request){return safe(async()=>{const shop=new URL(req.url).searchParams.get('shopId')||'';await purgeExpiredDocuments();return Response.json({profile:await currentVerification(shop)},{headers:{'Cache-Control':'no-store'}})})}
export async function POST(req:Request){return safe(async()=>{
 sameOrigin(req);if(Number(req.headers.get('content-length')||0)>11*1024*1024)throw new HttpError(413,'Cada imagen debe pesar menos de 5 MB.');
 if(!await rateLimit('verification:'+digest(req.headers.get('cf-connecting-ip')||'local'),10))throw new HttpError(429,'Espera 15 minutos antes de enviar otra solicitud.');
 const data=await req.formData(),shopId=clean(data.get('shopId'),60);await publicStore(shopId);await purgeExpiredDocuments();
 const previous=await currentVerification(shopId);if(previous&&previous.status!=='rejected')throw new HttpError(409,'Ya tienes una solicitud. Consulta su estado.');
 const name=clean(data.get('name'),80),instagram=clean(data.get('instagram'),31).replace(/^@/,''),phone=normalizePhone(clean(data.get('phone'),25));
 if(!name||!/^[a-zA-Z0-9_.]{1,30}$/.test(instagram)||!/^\d{10,15}$/.test(phone)||data.get('consent')!=='yes')throw new HttpError(400,'Completa tus datos y acepta la revisión manual.');
 const files: {file:File,type:string,key:string}[]=[];const id=crypto.randomUUID();
 for(const field of ['ine','selfie']){const file=data.get(field);if(!(file instanceof File)||!file.size||file.size>5*1024*1024)throw new HttpError(400,'Adjunta ambas imágenes JPG o PNG, de hasta 5 MB.');const b=new Uint8Array(await file.slice(0,12).arrayBuffer());const type=b[0]===255&&b[1]===216&&b[2]===255?'image/jpeg':b.slice(0,8).join(',')==='137,80,78,71,13,10,26,10'?'image/png':'';if(!type)throw new HttpError(400,'Solo se aceptan imágenes JPG o PNG.');files.push({file,type,key:'verification/'+id+'/'+field})}
 const secret=token();try{for(const f of files)await bucket().put(f.key,f.file.stream(),{httpMetadata:{contentType:f.type}});await db().prepare('INSERT INTO customer_verifications(id,shop_id,name,instagram,phone,secret_hash,id_key,selfie_key,created_at) VALUES(?,?,?,?,?,?,?,?,?)').bind(id,shopId,name,instagram,phone,digest(secret),files[0].key,files[1].key,new Date().toISOString()).run()}catch(e){for(const f of files)await bucket().delete(f.key).catch(()=>{});throw e}
 return Response.json({profile:{id,name,instagram,phone,status:'pending'}},{status:201,headers:{'Cache-Control':'no-store','Set-Cookie':`${verificationCookie(shopId)}=${secret}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=15552000`}});
})}
