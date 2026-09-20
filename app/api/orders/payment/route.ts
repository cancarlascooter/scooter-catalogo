import {db,myShop,safe,sameOrigin,HttpError} from '@/lib/store';
import {currentAdmin,passwordMode} from '@/lib/admin-auth';
import {getChatGPTUser} from '@/app/chatgpt-auth';
export async function PATCH(req:Request){return safe(async()=>{
 sameOrigin(req);const shop=await myShop('pedidos'),user=await getChatGPTUser(),admin=await currentAdmin();
 const {id,status}=await req.json() as {id:unknown,status:unknown};if(typeof id!=='string'||!['paid','pending'].includes(String(status)))throw new HttpError(400,'Elige un estado de pago válido.');
 const order=await db().prepare('SELECT id,status,salesperson_id FROM orders WHERE id=? AND shop_id=?').bind(id,shop.id).first<{id:string,status:string,salesperson_id:string|null}>();if(!order)throw new HttpError(404,'Pedido no encontrado.');
 const owner=admin?.is_owner||!passwordMode()?1:0,actor=admin?.id||user!.userId;
 if(!owner&&order.status==='paid'&&order.salesperson_id!==actor)throw new HttpError(403,'Solo el propietario puede corregir un pago registrado por otro perfil.');
 const date=new Date().toISOString(),seller=status==='paid'?actor:null;
 const access=" AND (?=1 OR status<>'paid' OR salesperson_id=?)";
 await db().batch([
 db().prepare('INSERT INTO order_payment_events(id,order_id,shop_id,actor,status,created_at) SELECT ?,id,shop_id,?,?,? FROM orders WHERE id=? AND shop_id=? AND status<>?'+access).bind(crypto.randomUUID(),user!.email,status,date,id,shop.id,status,owner,actor),
 db().prepare("UPDATE orders SET salesperson_id=?,status=?,snapshot=json_set(snapshot,'$.status',?,'$.paidAt',?) WHERE id=? AND shop_id=? AND status<>?"+access).bind(seller,status,status,status==='paid'?date:null,id,shop.id,status,owner,actor)
 ]);
 const saved=await db().prepare('SELECT status,salesperson_id FROM orders WHERE id=? AND shop_id=?').bind(id,shop.id).first<{status:string,salesperson_id:string|null}>();
 if(!saved||saved.status!==status||(!owner&&status==='paid'&&saved.salesperson_id!==actor))throw new HttpError(409,'Otro perfil actualizó este pedido. Actualiza la lista antes de continuar.');
 return Response.json({ok:true},{headers:{'Cache-Control':'no-store'}})
})}
