import type { Product,Shop,CatalogVideo } from './shared';
export const demoShop:Shop={id:'ejemplo',name:'Casa Nómada',phone:'528125818920',promotionMessage:'Prueba PROMO10: 10% en productos.'};
export const demoProducts:Product[]=[
{id:'demo-headphones',availableMty:1,availableCdmx:0,name:'Audífonos inalámbricos',description:'Tu música, a donde vayas. Diseño cómodo para acompañarte todos los días.',price:89900,image:'/samples/headphones.jpg',department:'Electrónica',category:'Audio'},
{id:'demo-backpack',availableMty:0,availableCdmx:1,name:'Mochila de diario',description:'Un básico para tus planes. Espacio para llevar lo esencial a la oficina o de paseo.',price:64900,image:'/samples/backpack.jpg',department:'Accesorios',category:'Mochilas'},
{id:'demo-bottle',availableMty:1,availableCdmx:1,name:'Botella reutilizable',description:'Para acompañar tu rutina y llevar tu bebida favorita contigo.',price:28900,image:'/samples/bottle.jpg',department:'Hogar',category:'Botellas'},
{id:'demo-sneaker',availableMty:1,availableCdmx:0,name:'Tenis casuales',description:'Un par versátil para combinar con tus favoritos. Consulta tallas al hacer tu pedido.',price:119900,image:'/samples/sneaker.jpg',department:'Ropa',category:'Calzado'},
{id:'demo-jeans',options:[{id:'color',label:'Color',visible:true,values:[{id:'azul',label:'Azul',adjustment:0},{id:'negro',label:'Negro',adjustment:5000}]},{id:'talla',label:'Talla',visible:true,values:[{id:'ch',label:'Chica',adjustment:0},{id:'m',label:'Mediana',adjustment:0},{id:'g',label:'Grande',adjustment:3000}]}],availableMty:1,availableCdmx:1,name:'Jeans clásicos',description:'Un básico para combinar todos los días. Elige tu color y talla.',price:59900,image:'/samples/jeans.jpg',department:'Ropa',category:'Jeans'},
{id:'demo-camisa',availableMty:1,availableCdmx:1,name:'Camisa casual',description:'Para tus planes de todos los días. Consulta colores y tallas al hacer tu pedido.',price:44900,image:'/samples/camisa.jpg',department:'Ropa',category:'Camisas'}];

export const demoVideos:CatalogVideo[]=[{id:'demo-tour',title:'Recorrido de ejemplo · Fotografías del catálogo',source:'/samples/catalogo.mp4'}];
