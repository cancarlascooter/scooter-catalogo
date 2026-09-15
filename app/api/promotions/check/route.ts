import {safe,sameOrigin,clean,HttpError} from '@/lib/store';
import {findPromotion} from '@/lib/promotions';
export async function POST(req:Request){return safe(async()=>{sameOrigin(req);const data=await req.json() as {shopId?:unknown,code?:unknown};const code=clean(data.code,40).toUpperCase();if(!code)throw new HttpError(400,'Escribe un código.');return Response.json(await findPromotion(clean(data.shopId,60),code),{headers:{'Cache-Control':'no-store'}})})}
