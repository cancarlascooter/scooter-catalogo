import { demoShop,demoProducts } from '@/app/demo';
import type { Product,Shop } from '@/app/shared';
import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
export function db(){if(!env.DB)throw new Error('Database unavailable');return env.DB;}
export function bucket(){if(!env.BUCKET)throw new Error('Storage unavailable');return env.BUCKET;}
export class HttpError extends Error{constructor(public status:number,message:string){super(message)}}
export async function owner(){const user=await getChatGPTUser();if(!user)throw new HttpError(401,'Inicia sesión para administrar tu catálogo.');return user.userId;}
export function sameOrigin(req:Request){const origin=req.headers.get('origin');const target=new URL(req.url);const forwarded=req.headers.get('x-forwarded-host');const allowed=new Set([target.host,forwarded].filter(Boolean));if(origin&&!allowed.has(new URL(origin).host))throw new HttpError(403,'Solicitud no permitida.');if(req.headers.get('sec-fetch-site')==='cross-site')throw new HttpError(403,'Solicitud no permitida.');}
export async function myShop(){const id=await owner();const shop=await db().prepare('SELECT id,name,phone FROM shops WHERE owner=?').bind(id).first();if(!shop)throw new HttpError(400,'Primero guarda los datos de tu negocio.');return shop;}
export async function safe(run:()=>Promise<Response>){try{return await run()}catch(e){if(e instanceof HttpError)return Response.json({error:e.message},{status:e.status});console.error('Store request failed',e);return Response.json({error:'No pudimos completar la solicitud. Tus cambios siguen en el formulario; inténtalo de nuevo.'},{status:503})}}
export function clean(value:unknown,max:number){if(typeof value!=='string')return '';return value.trim().slice(0,max)}
export async function publicStore(id:string){if(id==='ejemplo')return {shop:demoShop,products:demoProducts};const shop=await db().prepare('SELECT id,name,phone FROM shops WHERE id=?').bind(id).first<Shop>();if(!shop)throw new HttpError(404,'No encontramos esta tienda.');const products=await db().prepare('SELECT id,name,description,price,image FROM products WHERE shop_id=? ORDER BY created_at DESC').bind(id).all<Product>();return {shop,products:products.results}}
