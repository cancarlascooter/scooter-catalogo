import {cookies} from 'next/headers';
import {authDb,passwordMode,settings,currentAdmin,digest,token,hashPassword,verifyPassword,newSession,clearSession,rateLimit,SESSION_COOKIE} from '@/lib/admin-auth';
import {HttpError,safe} from '@/lib/store';
export const dynamic='force-dynamic';
const json=(data:unknown,status=200,cookie?:string)=>Response.json(data,{status,headers:{'Cache-Control':'no-store',...(cookie?{'Set-Cookie':cookie}:{})}});
export async function GET(){return safe(async()=>{if(!passwordMode())throw new HttpError(404,'No disponible.');const user=await currentAdmin();if(!user)return json({user:null});const users=user.is_owner?(await authDb().prepare('SELECT id,email,is_owner FROM admin_users WHERE owner_id=? ORDER BY created_at').bind(user.owner_id).all()).results:[];return json({user,users})})}
export async function POST(req:Request,{params}:{params:Promise<{action:string}>}){return safe(async()=>{
 if(!passwordMode())throw new HttpError(404,'No disponible.');
 const origin=req.headers.get('origin');if(!origin||origin!==new URL(req.url).origin)throw new HttpError(403,'Solicitud no permitida.');
 if(Number(req.headers.get('content-length')||0)>8192)throw new HttpError(413,'Solicitud demasiado grande.');
 const {action}=await params;
 const body=await req.text();if(body.length>8192)throw new HttpError(413,'Solicitud demasiado grande.');
 let data:Record<string,unknown>;try{data=JSON.parse(body||'{}')}catch{throw new HttpError(400,'Revisa los datos.')}if(!data||typeof data!=='object')throw new HttpError(400,'Revisa los datos.');
 const email=typeof data.email==='string'?data.email.trim().toLowerCase():'';
 const password=typeof data.password==='string'?data.password:'';
 if(['login','setup','accept'].includes(action)){
   const ip=req.headers.get('cf-connecting-ip')||'local';
   if(!await rateLimit('ip:'+digest(ip),40)||!await rateLimit('email:'+digest(email),10))throw new HttpError(429,'Demasiados intentos. Espera 15 minutos.');
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254||password.length>128)throw new HttpError(400,'Revisa tu correo y contraseña.');
   if(action==='login'){
     const user=await authDb().prepare('SELECT id,password_hash FROM admin_users WHERE email=?').bind(email).first<{id:string,password_hash:string}>();
     const fallback='scrypt:00000000000000000000000000000000:'+('00'.repeat(64));
     const valid=await verifyPassword(password,user?.password_hash||fallback);
     if(!user||!valid)throw new HttpError(401,'Correo o contraseña incorrectos.');
     return json({ok:true},200,await newSession(user.id));
   }
   if(password.length<12)throw new HttpError(400,'Usa una contraseña de al menos 12 caracteres.');
   const secret=typeof data.token==='string'?data.token:'';
   const id=crypto.randomUUID();
   if(action==='setup'){
     if(!settings().ADMIN_SETUP_TOKEN||digest(secret)!==digest(settings().ADMIN_SETUP_TOKEN))throw new HttpError(403,'El enlace de activación no es válido.');
     if(await authDb().prepare('SELECT slot FROM admin_installation WHERE slot=1').first())throw new HttpError(409,'La cuenta ya fue creada. Inicia sesión.');
     const hash=await hashPassword(password);
     await authDb().batch([
       authDb().prepare('INSERT INTO admin_installation(slot,owner_id) VALUES(1,?)').bind(id),
       authDb().prepare('INSERT INTO admin_users(id,email,password_hash,owner_id,is_owner,created_at) VALUES(?,?,?,?,1,?)').bind(id,email,hash,id,Date.now()),
       authDb().prepare('INSERT INTO shops(id,owner,name,phone) VALUES(?,?,?,?)').bind(crypto.randomUUID(),id,'Mi tienda','528125818920')
     ]);
   }else{
     const invitation=await authDb().prepare('SELECT owner_id FROM admin_invites WHERE token_hash=? AND email=? AND expires_at>?').bind(digest(secret),email,Date.now()).first<{owner_id:string}>();
     if(!invitation)throw new HttpError(403,'La invitación venció o no corresponde a este correo.');
     if(await authDb().prepare('SELECT id FROM admin_users WHERE email=?').bind(email).first())throw new HttpError(409,'Este correo ya tiene acceso.');
     const hash=await hashPassword(password);
     const result=await authDb().batch([
       authDb().prepare('INSERT INTO admin_users(id,email,password_hash,owner_id,is_owner,created_at) SELECT ?,email,?,owner_id,0,? FROM admin_invites WHERE token_hash=? AND email=? AND expires_at>?').bind(id,hash,Date.now(),digest(secret),email,Date.now()),
       authDb().prepare('DELETE FROM admin_invites WHERE token_hash=?').bind(digest(secret))
     ]);if(result[0].meta.changes!==1)throw new HttpError(409,'La invitación ya fue utilizada.');
   }
   return json({ok:true},201,await newSession(id));
 }
 const user=await currentAdmin();if(!user)throw new HttpError(401,'Inicia sesión para continuar.');
 if(action==='logout'){const value=(await cookies()).get(SESSION_COOKIE)?.value||'';await authDb().prepare('DELETE FROM admin_sessions WHERE token_hash=?').bind(digest(value)).run();return json({ok:true},200,clearSession())}
 if(action==='password'){
   if(password.length<12||password.length>128)throw new HttpError(400,'Usa entre 12 y 128 caracteres.');
   if(!await rateLimit('password:'+user.id,10))throw new HttpError(429,'Espera 15 minutos.');
   const row=await authDb().prepare('SELECT password_hash FROM admin_users WHERE id=?').bind(user.id).first<{password_hash:string}>();
   if(typeof data.currentPassword!=='string'||data.currentPassword.length>128||!row||!await verifyPassword(data.currentPassword,row.password_hash))throw new HttpError(403,'La contraseña actual no es correcta.');
   await authDb().batch([authDb().prepare('UPDATE admin_users SET password_hash=? WHERE id=?').bind(await hashPassword(password),user.id),authDb().prepare('DELETE FROM admin_sessions WHERE user_id=?').bind(user.id)]);
   return json({ok:true},200,await newSession(user.id));
 }
 if(!user.is_owner)throw new HttpError(403,'Solo el propietario puede administrar accesos.');
 if(action==='invite'){
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>254)throw new HttpError(400,'Escribe un correo válido.');
   if(await authDb().prepare('SELECT id FROM admin_users WHERE email=?').bind(email).first())throw new HttpError(409,'Este correo ya tiene acceso.');
   const value=token();await authDb().batch([authDb().prepare('DELETE FROM admin_invites WHERE email=? AND owner_id=?').bind(email,user.owner_id),authDb().prepare('INSERT INTO admin_invites VALUES(?,?,?,?)').bind(digest(value),email,user.owner_id,Date.now()+86400000)]);
   return json({url:new URL('/acceso',req.url).href+'#invite='+value,email});
 }
 if(action==='revoke'){
   if(typeof data.id!=='string'||data.id===user.id)throw new HttpError(400,'No puedes quitar tu propio acceso.');
   await authDb().prepare('DELETE FROM admin_users WHERE id=? AND owner_id=? AND is_owner=0').bind(data.id,user.owner_id).run();return json({ok:true});
 }
 throw new HttpError(404,'Acción no disponible.');
})}
