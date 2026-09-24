import {env} from 'cloudflare:workers';
import {cookies} from 'next/headers';
import {scrypt,randomBytes,timingSafeEqual,createHash} from 'node:crypto';

export const SESSION_COOKIE='__Host-ropa_session';
export const settings=()=>env as unknown as Record<string,string>;
export const passwordMode=()=>settings().AUTH_MODE==='password';
export const authDb=()=>{if(!env.DB)throw new Error('Database unavailable');return env.DB};
export const digest=(value:string)=>createHash('sha256').update(value).digest('hex');
export const token=()=>randomBytes(32).toString('hex');
function derive(password:string,salt:string):Promise<Buffer>{return new Promise((resolve,reject)=>scrypt(password.normalize('NFKC'),salt,64,{N:16384,r:8,p:1,maxmem:33554432},(error,key)=>error?reject(error):resolve(key)))}
export async function hashPassword(password:string){const salt=randomBytes(16).toString('hex');return `scrypt:${salt}:${(await derive(password,salt)).toString('hex')}`}
export async function verifyPassword(password:string,stored:string){const [method,salt,hash]=stored.split(':');if(method!=='scrypt'||!salt||!hash)return false;const expected=Buffer.from(hash,'hex'),actual=await derive(password,salt);return expected.length===actual.length&&timingSafeEqual(expected,actual)}
export type AdminUser={id:string,email:string,owner_id:string,is_owner:number,permissions:string};
export async function currentAdmin():Promise<AdminUser|null>{const value=(await cookies()).get(SESSION_COOKIE)?.value;if(!value||! /^[a-f0-9]{64}$/.test(value))return null;return authDb().prepare('SELECT u.id,u.email,u.owner_id,u.is_owner,u.permissions FROM admin_sessions s JOIN admin_users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?').bind(digest(value),Date.now()).first<AdminUser>()}
export async function newSession(id:string){const value=token();await authDb().prepare('INSERT INTO admin_sessions(token_hash,user_id,expires_at) VALUES(?,?,?)').bind(digest(value),id,Date.now()+7*86400000).run();return `${SESSION_COOKIE}=${value}; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=604800`}
export function clearSession(){return `${SESSION_COOKIE}=; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age=0`}
export async function rateLimit(key:string,max:number){const now=Date.now();const row=await authDb().prepare('INSERT INTO admin_attempts(key,count,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET count=CASE WHEN expires_at<? THEN 1 ELSE count+1 END, expires_at=CASE WHEN expires_at<? THEN excluded.expires_at ELSE expires_at END RETURNING count').bind(key,now+900000,now,now).first<{count:number}>();return !!row&&row.count<=max}
