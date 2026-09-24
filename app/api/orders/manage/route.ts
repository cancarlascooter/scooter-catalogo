import {bucket,db,myShop,safe,sameOrigin,HttpError,clean,publicStore} from '@/lib/store';
import {currentAdmin} from '@/lib/admin-auth';
import {resolveSelection,type Choices} from '@/app/product-options';
import {isAvailable,shippingFeeFor,imageUrl,type Fulfillment} from '@/app/shared';
import {findPromotion,promoCustomerHash} from '@/lib/promotions';
import {calculateDiscount,promotionLabel} from '@/app/promotion-rules';
import type {OrderSummary} from '@/app/order-types';
async function access(id:string){
 const shop=await myShop('pedidos'),actor=await currentAdmin();
 if(!actor)throw new HttpError(401,'Inicia sesión.');
 const row=await db().prepare('SELECT snapshot,revision,request_key,status,salesperson_id FROM orders WHERE id=? AND shop_id=?').bind(id,shop.id).first<{snapshot:string,revision:number,request_key:string,status:string,salesperson_id:string|null}>();
 if(!row||(!actor.is_owner&&row.status==='paid'&&row.salesperson_id!==actor.id))throw new HttpError(404,'Pedido no disponible para este perfil.');
 if(row.status==='cancelled')throw new HttpError(409,'Este pedido ya fue eliminado.');
 return {shop,actor,row,order:JSON.parse(row.snapshot) as OrderSummary};
}
export async function GET(req:Request){return safe(async()=>{const a=await access(new URL(req.url).searchParams.get('id')||'');return Response.json({order:a.order,revision:a.row.revision,products:(await publicStore(String(a.shop.id))).products},{headers:{'Cache-Control':'no-store'}})})}
async function change(req:Request,remove:boolean){return safe(async()=>{
 sameOrigin(req);const data=await req.json() as Record<string,any>;const {shop,actor,row,order}=await access(clean(data.id,60));
 if(!Number.isSafeInteger(data.revision)||data.revision!==row.revision)throw new HttpError(409,'El pedido cambió. Vuelve a abrirlo antes de guardar.');
 const date=new Date().toISOString(),editId=crypto.randomUUID(),statements=[db().prepare('INSERT INTO order_edit_guards(id,order_id,revision) VALUES(?,?,?)').bind(editId,order.id,row.revision),db().prepare('INSERT INTO order_edits(id,order_id,shop_id,actor,action,snapshot,created_at) VALUES(?,?,?,?,?,?,?)').bind(editId,order.id,shop.id,actor.id,remove?'delete':'edit',row.snapshot,date)];
 const branch=(f?:Fulfillment)=>f==='cdmx'?'cdmx':'mty';
 function stock(item:OrderSummary['items'][number],f:Fulfillment|undefined,amount:number){if(!item.stockKey||(amount>0&&!item.inventoryTracked))return;statements.push(db().prepare('UPDATE inventory SET quantity=quantity+? WHERE shop_id=? AND stock_key=? AND branch=? AND EXISTS(SELECT 1 FROM products WHERE id=? AND shop_id=? AND inventory_tracked=1)').bind(amount,shop.id,item.stockKey,branch(f),item.id,shop.id));statements.push(db().prepare('INSERT INTO inventory_events(id,shop_id,product_id,stock_key,branch,mode,quantity,product_name,options,note,created_at) SELECT ?,?,?,?,?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM products WHERE id=? AND shop_id=? AND inventory_tracked=1)').bind(crypto.randomUUID(),shop.id,item.id,item.stockKey,branch(f),'order-edit',amount,item.name,JSON.stringify(item.options||[]),'Cambio de pedido '+order.id.slice(0,8),date,item.id,shop.id));}
 for(const item of order.items)stock(item,order.fulfillment,item.quantity);
 statements.push(db().prepare('DELETE FROM promotion_uses WHERE request_key=?').bind(row.request_key));
 let next:OrderSummary={...order,status:'cancelled'};
 if(!remove){
 const customer=clean(data.customer,80),phone=clean(data.phone,25),address=clean(data.address,400),notes=clean(data.notes,500);
 if(!customer||!/^\+?[0-9 ()-]{10,25}$/.test(phone)||address.length<5||!['mty','cdmx','shipping'].includes(data.fulfillment))throw new HttpError(400,'Revisa los datos del cliente y la entrega.');
 if(!Array.isArray(data.items)||!data.items.length||data.items.length>100)throw new HttpError(400,'Agrega al menos un producto.');
 const fulfillment=data.fulfillment as Fulfillment,products=(await publicStore(String(shop.id))).products,seen=new Set<string>();
 const items:OrderSummary['items']=data.items.map((entry:{id:string,quantity:number,choices?:Choices})=>{
 const p=products.find(p=>p.id===entry.id);if(!p||!isAvailable(p,fulfillment)||!Number.isInteger(entry.quantity)||entry.quantity<1||entry.quantity>99)throw new HttpError(400,'Revisa productos, cantidades y sucursal.');
 let selected;try{selected=resolveSelection(p,entry.choices||{},fulfillment)}catch(e){throw new HttpError(400,(e as Error).message)}
 if(seen.has(selected.key))throw new HttpError(400,'Combina las cantidades de las opciones repetidas.');seen.add(selected.key);
 const item={inventoryTracked:!!p.inventoryTracked,id:p.id,name:p.name,image:order.items.find(i=>i.id===p.id)?.image||imageUrl(p.image),department:p.department,category:p.category,quantity:entry.quantity,price:selected.price,options:selected.labels,choices:selected.choices,stockKey:selected.key};
 if(p.inventoryTracked)statements.push(db().prepare('INSERT INTO inventory(id,shop_id,product_id,stock_key,branch,quantity) VALUES(?,?,?,?,?,0) ON CONFLICT(shop_id,stock_key,branch) DO NOTHING').bind(crypto.randomUUID(),shop.id,p.id,selected.key,branch(fulfillment)));
 stock(item,fulfillment,-entry.quantity);return item;
 });
 for(const item of items){if(item.image?.startsWith('/api/image/')){const key=item.image.slice('/api/image/'.length);const copy='receipt-images/'+key;if(!await bucket().head(copy)){const source=await bucket().get(key);if(source)await bucket().put(copy,source.body,{httpMetadata:source.httpMetadata})}item.image='/api/order-image/'+key;}}
 const code=clean(data.couponCode,40).toUpperCase(),promotion=await findPromotion(String(shop.id),code),discount=promotion?calculateDiscount(items,promotion):0;
 if(promotion&&!discount)throw new HttpError(400,'Los productos no cumplen las condiciones de la promoción.');
 if(promotion&&promotion.id!=='demo')statements.push(db().prepare('INSERT INTO promotion_uses(request_key,promotion_id,customer_hash,config,created_at) VALUES(?,?,?,?,?)').bind(row.request_key,promotion.id,await promoCustomerHash(phone),promotion.config!,date));
 const subtotal=items.reduce((n,i)=>n+i.price*i.quantity,0),shippingFee=shippingFeeFor(fulfillment);
 next={...order,customer,phone,address,notes,fulfillment,items,subtotal,shippingFee,discount,couponCode:promotion?.code,promotionDescription:promotion?promotionLabel(promotion):undefined,discountPercent:promotion?.kind==='percent'?promotion.amount:undefined,total:subtotal+shippingFee-discount,verification:undefined};
 }
 statements.push(db().prepare('UPDATE orders SET snapshot=?,total=?,status=?,revision=revision+1 WHERE id=? AND shop_id=?').bind(JSON.stringify(next),next.total,next.status,order.id,shop.id),db().prepare('DELETE FROM order_edit_guards WHERE id=?').bind(editId));
 try{await db().batch(statements)}catch(e){if(/order_changed/.test(String(e)))throw new HttpError(409,'Otro perfil modificó el pedido. Vuelve a abrirlo.');if(/CHECK|inventory_unavailable/.test(String(e)))throw new HttpError(409,'No hay inventario suficiente. No se guardó ningún cambio.');if(/promotion_/.test(String(e)))throw new HttpError(409,'La promoción venció o alcanzó el límite de usos.');throw e}
 return Response.json({order:next,revision:row.revision+1},{headers:{'Cache-Control':'no-store'}});
})}
export const PATCH=(req:Request)=>change(req,false);
export const DELETE=(req:Request)=>change(req,true);
