import {findPromotion} from '@/lib/promotions';
import { publicStore,safe,HttpError,clean,db,sameOrigin } from '@/lib/store';
import {isAvailable,shippingFeeFor,promotionDiscount} from '@/app/shared';
import type {Fulfillment} from '@/app/shared';
import type {OrderSummary} from '@/app/order-types';
export async function POST(req:Request){return safe(async()=>{
 sameOrigin(req);
 const data=await req.json() as {items?:{id:string,quantity:number}[],shopId?:unknown,customer?:unknown,phone?:unknown,address?:unknown,notes?:unknown,requestKey?:unknown,fulfillment?:unknown,couponCode?:unknown};
 if(!data||!Array.isArray(data.items)||!data.items.length||data.items.length>100)throw new HttpError(400,'Agrega productos a tu carrito.');
 const customer=clean(data.customer,80),phone=clean(data.phone,25),address=clean(data.address,400),notes=clean(data.notes,500),shopId=clean(data.shopId,60),requestKey=clean(data.requestKey,60);
 if(!customer||!/^\+?[0-9 ()-]{10,25}$/.test(phone)||address.length<5)throw new HttpError(400,'Escribe tu nombre, teléfono y dirección completa.');
 if(!/^[a-f0-9-]{36}$/.test(requestKey))throw new HttpError(400,'Vuelve a intentar guardar el pedido.');
 if(!['mty','cdmx','shipping'].includes(String(data.fulfillment)))throw new HttpError(400,'Elige Monterrey, CDMX o paquetería antes de pedir.');const fulfillment=data.fulfillment as Fulfillment;
 const couponCode=clean(data.couponCode,40).toUpperCase();
 const payload=JSON.stringify({customer,phone,address,notes,shopId,fulfillment,couponCode,items:data.items});
 const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(payload))),b=>b.toString(16).padStart(2,'0')).join('');
 const previous=await db().prepare('SELECT token,request_hash FROM orders WHERE request_key=?').bind(requestKey).first<{token:string,request_hash:string}>();
 if(previous){if(previous.request_hash!==hash)throw new HttpError(409,'El pedido cambió. Vuelve a intentarlo.');return Response.json({token:previous.token},{headers:{'Cache-Control':'no-store'}})}
 const {shop,products}=await publicStore(shopId);const seen=new Set();
 const items=data.items.map(item=>{if(!item||!Number.isInteger(item.quantity)||item.quantity<1||item.quantity>99||seen.has(item.id))throw new HttpError(400,'Revisa las cantidades de tu carrito.');seen.add(item.id);const p=products.find(p=>p.id===item.id);if(!p||!isAvailable(p,fulfillment))throw new HttpError(409,'Un producto ya no está disponible en la sucursal elegida. Actualiza la tienda y revisa tu carrito.');return {id:p.id,name:p.name,price:p.price,quantity:item.quantity}});
 const subtotal=items.reduce((sum,i)=>sum+i.price*i.quantity,0),shippingFee=shippingFeeFor(fulfillment);
 const promotion=await findPromotion(shopId,couponCode),discount=promotion?promotionDiscount(subtotal,promotion.percent):0;
 const order:OrderSummary={id:crypto.randomUUID(),token:crypto.randomUUID().replaceAll('-','')+crypto.randomUUID().replaceAll('-',''),date:new Date().toISOString(),shop,items,customer,phone,address,notes,subtotal,shippingFee,discount,couponCode:promotion?.code,discountPercent:promotion?.percent,total:subtotal-discount+shippingFee,status:'pending',fulfillment};
 await db().prepare('INSERT INTO orders (id,token,request_key,request_hash,shop_id,created_at,snapshot,total,status) VALUES (?,?,?,?,?,?,?,?,?) ON CONFLICT(request_key) DO NOTHING').bind(order.id,order.token,requestKey,hash,shop.id,order.date,JSON.stringify(order),order.total,'pending').run();
 const saved=await db().prepare('SELECT token,request_hash FROM orders WHERE request_key=?').bind(requestKey).first<{token:string,request_hash:string}>();if(!saved)throw new Error('Order not saved');if(saved.request_hash!==hash)throw new HttpError(409,'El pedido cambió. Vuelve a intentarlo.');
 return Response.json({token:saved.token},{status:201,headers:{'Cache-Control':'no-store'}});
})}
