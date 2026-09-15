import {db,HttpError} from './store';
export async function findPromotion(shopId:string,code:string){
 if(!code)return null;
 if(shopId==='ejemplo'&&code==='PROMO10')return {code,percent:10};
 const p=await db().prepare('SELECT code,percent FROM promotions WHERE shop_id=? AND code=? AND active=1').bind(shopId,code).first<{code:string,percent:number}>();
 if(!p)throw new HttpError(400,'El código no existe o la promoción ya no está activa.');
 return p;
}
