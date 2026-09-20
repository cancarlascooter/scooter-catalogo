import type {Product,OptionGroup,Fulfillment} from './shared';
export type Choices=Record<string,string>;
export type CartEntry={id:string,quantity:number,choices:Choices};
export const visibleGroups=(p:Product)=>(p.options||[]).filter(g=>g.visible);
export function optionFinalPrice(p:Pick<Product,'price'|'shippingPrice'>,v:OptionGroup['values'][number],fulfillment:Fulfillment){
 const base=fulfillment==='shipping'?(p.shippingPrice??p.price):p.price;
 return fulfillment==='shipping'?(v.shippingAdjustment??(v.adjustment||base)):(v.adjustment||base);
}
export function productPriceRange(p:Product,fulfillment:Fulfillment='mty'){
 const groups=visibleGroups(p),base=fulfillment==='shipping'?(p.shippingPrice??p.price):p.price;
 const final=groups.find(g=>g.pricing==='final'&&g.values.some(v=>v.adjustment!==0||v.shippingAdjustment!==undefined));
 if(final){const prices=final.values.map(v=>optionFinalPrice(p,v,fulfillment));return {min:Math.min(...prices),max:Math.max(...prices)}}
 const legacy=groups.filter(g=>g.pricing!=='final');const adjustment=(v:OptionGroup['values'][number])=>fulfillment==='shipping'?(v.shippingAdjustment??v.adjustment):v.adjustment;
 return {min:base+legacy.reduce((n,g)=>n+Math.min(...g.values.map(adjustment)),0),max:base+legacy.reduce((n,g)=>n+Math.max(...g.values.map(adjustment)),0)};
}
export function resolveSelection(p:Product,input:unknown={},fulfillment:Fulfillment='mty'){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Elige las opciones del producto.');
 const raw=input as Choices,groups=visibleGroups(p),choices:Choices={},labels:string[]=[];let finalPrice:number|undefined;let price=fulfillment==='shipping'?(p.shippingPrice??p.price):p.price;
 if(Object.keys(raw).length!==groups.length)throw new Error(`Selecciona ${groups.map(g=>g.label).join(', ')} para ${p.name}.`);
 for(const g of groups){const v=g.values.find(v=>v.id===raw[g.id]);if(!v)throw new Error(`Elige ${g.label} para ${p.name}.`);choices[g.id]=v.id;labels.push(`${g.label}: ${v.label}`);if(g.pricing==='final'){if(g.values.some(x=>x.adjustment!==0||x.shippingAdjustment!==undefined))finalPrice=optionFinalPrice(p,v,fulfillment)}else price+=fulfillment==='shipping'?(v.shippingAdjustment??v.adjustment):v.adjustment}
 if(finalPrice!==undefined)price=finalPrice;
 if(!Number.isSafeInteger(price)||price<1)throw new Error('El precio de esta opción no es válido.');
 return {choices,labels,price,key:JSON.stringify([p.id,...groups.map(g=>[g.id,choices[g.id]])])};
}
export function validateOptions(input:unknown,basePrice:number,shippingPrice=basePrice):OptionGroup[]{
 if(!Array.isArray(input)||input.length>3)throw new Error('Puedes agregar hasta 3 grupos de opciones.');
 const ids=new Set<string>();
 const groups:OptionGroup[]=input.map((g:any)=>{if(!g||typeof g.id!=='string'||!/^[a-zA-Z0-9_-]{1,60}$/.test(g.id)||ids.has(g.id)||typeof g.label!=='string'||!g.label.trim()||g.label.length>40||typeof g.visible!=='boolean'||!Array.isArray(g.values)||!g.values.length||g.values.length>20)throw new Error('Revisa los nombres y opciones de cada grupo (máximo 20 opciones).');ids.add(g.id);const values=new Set<string>();const names=new Set<string>();return {...(g.pricing==='final'?{pricing:'final' as const}:{}),id:g.id,label:g.label.trim(),visible:g.visible,values:g.values.map((v:any)=>{if(!v||typeof v.id!=='string'||!/^[a-zA-Z0-9_-]{1,60}$/.test(v.id)||values.has(v.id)||typeof v.label!=='string'||!v.label.trim()||v.label.length>80||names.has(v.label.trim().toLowerCase())||!Number.isSafeInteger(v.adjustment)||Math.abs(v.adjustment)>99999999||(v.shippingAdjustment!==undefined&&(!Number.isSafeInteger(v.shippingAdjustment)||Math.abs(v.shippingAdjustment)>99999999)))throw new Error('Cada opción necesita un nombre único y un ajuste de precio válido.');if(g.pricing==='final'&&(v.adjustment<0||(v.shippingAdjustment!==undefined&&v.shippingAdjustment<1)))throw new Error('El precio final debe ser mayor que cero; deja el campo vacío para usar el precio del producto.');values.add(v.id);names.add(v.label.trim().toLowerCase());return {id:v.id,label:v.label.trim(),adjustment:v.adjustment,...(v.shippingAdjustment===undefined?{}:{shippingAdjustment:v.shippingAdjustment})}})}});
 const active=groups.filter(g=>g.visible);
 if(active.filter(g=>g.pricing==='final'&&g.values.some(v=>v.adjustment!==0||v.shippingAdjustment!==undefined)).length>1)throw new Error('Pon los precios en un solo grupo, por ejemplo Presentación. Deja vacíos los precios de los demás grupos.');
 const product={price:basePrice,shippingPrice,options:groups} as Product;const local=productPriceRange(product),ship=productPriceRange(product,'shipping');if(local.min<1||local.max>99999999||ship.min<1||ship.max>99999999)throw new Error('Todas las opciones deben costar entre $0.01 y $999,999.99.');return groups;
}
