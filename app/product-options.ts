import type {Product,OptionGroup} from './shared';
export type Choices=Record<string,string>;
export type CartEntry={id:string,quantity:number,choices:Choices};
export const visibleGroups=(p:Product)=>(p.options||[]).filter(g=>g.visible);
export function resolveSelection(p:Product,input:unknown={}){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('Elige las opciones del producto.');
 const raw=input as Choices,groups=visibleGroups(p),choices:Choices={},labels:string[]=[];let price=p.price;
 if(Object.keys(raw).length!==groups.length)throw new Error(`Selecciona ${groups.map(g=>g.label).join(', ')} para ${p.name}.`);
 for(const g of groups){const v=g.values.find(v=>v.id===raw[g.id]);if(!v)throw new Error(`Elige ${g.label} para ${p.name}.`);choices[g.id]=v.id;labels.push(`${g.label}: ${v.label}`);price+=v.adjustment}
 if(!Number.isSafeInteger(price)||price<1)throw new Error('El precio de esta opción no es válido.');
 return {choices,labels,price,key:JSON.stringify([p.id,...groups.map(g=>[g.id,choices[g.id]])])};
}
export function validateOptions(input:unknown,basePrice:number):OptionGroup[]{
 if(!Array.isArray(input)||input.length>3)throw new Error('Puedes agregar hasta 3 grupos de opciones.');
 const ids=new Set<string>();
 const groups:OptionGroup[]=input.map((g:any)=>{if(!g||typeof g.id!=='string'||!/^[a-zA-Z0-9_-]{1,60}$/.test(g.id)||ids.has(g.id)||typeof g.label!=='string'||!g.label.trim()||g.label.length>40||typeof g.visible!=='boolean'||!Array.isArray(g.values)||!g.values.length||g.values.length>20)throw new Error('Revisa los nombres y opciones de cada grupo (máximo 20 opciones).');ids.add(g.id);const values=new Set<string>();const names=new Set<string>();return {id:g.id,label:g.label.trim(),visible:g.visible,values:g.values.map((v:any)=>{if(!v||typeof v.id!=='string'||!/^[a-zA-Z0-9_-]{1,60}$/.test(v.id)||values.has(v.id)||typeof v.label!=='string'||!v.label.trim()||v.label.length>40||names.has(v.label.trim().toLowerCase())||!Number.isSafeInteger(v.adjustment)||Math.abs(v.adjustment)>99999999)throw new Error('Cada opción necesita un nombre único y un ajuste de precio válido.');values.add(v.id);names.add(v.label.trim().toLowerCase());return {id:v.id,label:v.label.trim(),adjustment:v.adjustment}})}});
 const active=groups.filter(g=>g.visible);const min=basePrice+active.reduce((n,g)=>n+Math.min(...g.values.map(v=>v.adjustment)),0),max=basePrice+active.reduce((n,g)=>n+Math.max(...g.values.map(v=>v.adjustment)),0);if(min<1||max>99999999)throw new Error('Todas las combinaciones deben costar entre $0.01 y $999,999.99.');return groups;
}
