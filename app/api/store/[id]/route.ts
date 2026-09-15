import { publicStore,safe } from '@/lib/store';
export const dynamic='force-dynamic';
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){return safe(async()=>Response.json(await publicStore((await params).id),{headers:{'Cache-Control':'no-store'}}))}
