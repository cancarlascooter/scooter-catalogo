import Storefront from './storefront';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}){return <Storefront shopId={(await params).id}/>}
