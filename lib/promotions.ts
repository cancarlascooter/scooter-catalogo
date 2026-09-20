import {db,HttpError} from './store';
import {decodePromotion,normalizePromoPhone} from '@/app/promotion-rules';
export async function findPromotion(shopId:string,code:string){
 if(!code)return null;
 if(shopId==='ejemplo'&&code==='PROMO10')return decodePromotion({id:'demo',code,percent:10,config:'{}'});
 const row=await db().prepare('SELECT id,code,percent,config FROM promotions WHERE shop_id=? AND code=? AND active=1').bind(shopId,code).first<{id:string,code:string,percent:number,config:string}>();
 if(!row)throw new HttpError(400,'El código no existe o la promoción ya no está activa.');
 const p=decodePromotion(row);if(p.expiresAt&&Date.parse(p.expiresAt)<=Date.now())throw new HttpError(400,'Esta promoción ya venció.');return p;
}
export async function promoCustomerHash(phone:string){return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(normalizePromoPhone(phone)))),b=>b.toString(16).padStart(2,'0')).join('')}
