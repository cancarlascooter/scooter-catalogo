export type Product={id:string,name:string,description:string,price:number,image:string,department:string,category:string,availableMty:number,availableCdmx:number};
export type Shop={id:string,name:string,phone:string};
export const money=(cents:number)=>new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(cents/100);
export async function api<T = {shop:Shop,products:Product[],product:Product,videos:CatalogVideo[]}>(path:string,options?:RequestInit):Promise<T>{const r=await fetch(path,{...options,cache:'no-store'});let d;try{d=await r.json()}catch{throw new Error('No pudimos conectar. Inténtalo de nuevo.')}if(!r.ok)throw new Error((d as {error?:string}).error||'No pudimos completar la solicitud.');return d as T;}

export const imageUrl=(image:string)=>image.startsWith('/samples/')?image:`/api/image/${image}`;

export type CatalogVideo={id:string,title:string,source:string};

export type Fulfillment='mty'|'cdmx'|'shipping';
export const fulfillmentLabel=(f:Fulfillment)=>({mty:'Monterrey',cdmx:'Ciudad de México',shipping:'Paquetería desde Monterrey'})[f];
export const isAvailable=(p:Product,f:Fulfillment)=>f==='cdmx'?p.availableCdmx!==0:p.availableMty!==0;
