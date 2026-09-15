import type {Metadata,Viewport} from 'next';
import Storefront from './storefront';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}){return <Storefront shopId={(await params).id}/>}

export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{const {id}=await params;return {manifest:'/api/manifest/'+encodeURIComponent(id),appleWebApp:{capable:true,statusBarStyle:'default'},icons:{apple:'/app-icon-192.png'}}}
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#ffffff'};
