import {safe} from '@/lib/store';import {pushKeys} from '@/lib/push';
export async function GET(){return safe(async()=>Response.json({publicKey:pushKeys().publicKey},{headers:{'Cache-Control':'no-store'}}))}
