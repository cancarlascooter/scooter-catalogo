import type { Product,Shop } from './shared';
export const demoShop:Shop={id:'ejemplo',name:'Casa Nómada',phone:'528125818920'};
export const demoProducts:Product[]=[
{id:'demo-headphones',name:'Audífonos inalámbricos',description:'Tu música, a donde vayas. Diseño cómodo para acompañarte todos los días.',price:89900,image:'/samples/headphones.jpg'},
{id:'demo-backpack',name:'Mochila de diario',description:'Un básico para tus planes. Espacio para llevar lo esencial a la oficina o de paseo.',price:64900,image:'/samples/backpack.jpg'},
{id:'demo-bottle',name:'Botella reutilizable',description:'Para acompañar tu rutina y llevar tu bebida favorita contigo.',price:28900,image:'/samples/bottle.jpg'},
{id:'demo-sneaker',name:'Tenis casuales',description:'Un par versátil para combinar con tus favoritos. Consulta tallas al hacer tu pedido.',price:119900,image:'/samples/sneaker.jpg'}];
