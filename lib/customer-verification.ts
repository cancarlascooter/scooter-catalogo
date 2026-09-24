import {cookies} from 'next/headers';
import {db,bucket} from './store';
import {digest} from './admin-auth';
export const verificationCookie=(shop:string)=>'__Host-verification_'+digest(shop).slice(0,12);
export const normalizeName=(s:string)=>s.normalize('NFKC').trim().replace(/\s+/g,' ').toLocaleLowerCase('es-MX');
export const normalizePhone=(s:string)=>s.replace(/\D/g,'').replace(/^52(?=\d{10}$)/,'');
export async function currentVerification(shop:string){const key=(await cookies()).get(verificationCookie(shop))?.value;if(!key||!/^[a-f0-9]{64}$/.test(key))return null;return db().prepare('SELECT id,name,instagram,phone,status FROM customer_verifications WHERE shop_id=? AND secret_hash=?').bind(shop,digest(key)).first<{id:string,name:string,instagram:string,phone:string,status:string}>()}
export async function purgeExpiredDocuments(){const rows=await db().prepare("SELECT id,id_key,selfie_key FROM customer_verifications WHERE created_at<? AND (id_key<>'' OR selfie_key<>'') LIMIT 50").bind(new Date(Date.now()-7*86400000).toISOString()).all<{id:string,id_key:string,selfie_key:string}>();for(const row of rows.results){if(row.id_key)await bucket().delete(row.id_key);if(row.selfie_key)await bucket().delete(row.selfie_key);await db().prepare("UPDATE customer_verifications SET id_key='',selfie_key='',status=CASE WHEN status='pending' THEN 'rejected' ELSE status END WHERE id=?").bind(row.id).run()}}
