import {customerBrand} from '@/app/customer-brand';
import type {Metadata,Viewport} from 'next';
import Storefront from './storefront';
export const dynamic='force-dynamic';
export default async function Page({params}:{params:Promise<{id:string}>}){return <Storefront shopId={(await params).id}/>}

export async function generateMetadata({params}:{params:Promise<{id:string}>}):Promise<Metadata>{const {id}=await params;const brand=customerBrand(id);return {title:brand.name,manifest:'/api/manifest/'+encodeURIComponent(id),appleWebApp:{capable:true,statusBarStyle:'default',title:brand.name},icons:{apple:brand.appleIcon,icon:brand.icon192,shortcut:brand.icon192}}}
export const viewport:Viewport={width:'device-width',initialScale:1,viewportFit:'cover',themeColor:'#ffffff'};
