export type PromotionRule={kind:'percent'|'fixed'|'bundle',amount:number,buy:number,pay:number,productIds:string[],expiresAt:string|null,maxUses:number|null};
export type Promotion=PromotionRule&{id:string,code:string,percent:number,active?:number,config?:string};
export function promotionLabel(p:PromotionRule){return p.kind==='fixed'?`$${(p.amount/100).toFixed(2)} de descuento`:p.kind==='bundle'?`${p.buy}×${p.pay}`:`${p.amount}% de descuento`}
export function calculateDiscount(items:{id:string,price:number,quantity:number}[],p:PromotionRule,now=Date.now()){
 if(p.expiresAt&&Date.parse(p.expiresAt)<=now)return 0;
 const eligible=items.filter(i=>!p.productIds.length||p.productIds.includes(i.id)),subtotal=eligible.reduce((n,i)=>n+i.price*i.quantity,0);
 if(p.kind==='percent')return Math.round(subtotal*p.amount/100);
 if(p.kind==='fixed')return Math.min(subtotal,p.amount);
 const groups=new Map<string,{price:number,quantity:number}[]>();for(const item of eligible)groups.set(item.id,[...(groups.get(item.id)||[]),item]);let total=0;for(const entries of groups.values()){let free=Math.floor(entries.reduce((n,i)=>n+i.quantity,0)/p.buy)*(p.buy-p.pay);for(const item of [...entries].sort((a,b)=>a.price-b.price)){const units=Math.min(free,item.quantity);total+=units*item.price;free-=units;if(!free)break}}return total;
}
export function normalizePromoPhone(phone:string){let digits=phone.replace(/\D/g,'');if(digits.length===13&&digits.startsWith('521'))digits='52'+digits.slice(3);if(digits.length===10)digits='52'+digits;return digits}
export function decodePromotion(row:{id:string,code:string,percent:number,config:string,active?:number}):Promotion {return {kind:'percent',amount:row.percent,buy:3,pay:2,productIds:[],expiresAt:null,maxUses:null,...JSON.parse(row.config||'{}'),...row}}
