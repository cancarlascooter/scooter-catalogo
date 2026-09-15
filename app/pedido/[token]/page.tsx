import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/lib/store';
import type { OrderSummary } from '@/app/order-types';
import Summary from './summary';
export const dynamic='force-dynamic';
export const metadata:Metadata={title:'Resumen del pedido',description:'Consulta el pedido en la página.',robots:{index:false,follow:false},referrer:'no-referrer',openGraph:{title:'Ver pedido',description:'Abre el enlace para consultar el pedido.'}};
export default async function OrderPage({params}:{params:Promise<{token:string}>}){
 const {token}=await params;if(!/^[a-f0-9]{64}$/.test(token))notFound();
 let row:{snapshot:string}|null;
 try{row=await db().prepare('SELECT snapshot FROM orders WHERE token=?').bind(token).first<{snapshot:string}>()}
 catch{return <main className="workspace"><h1>No pudimos cargar el pedido</h1><p>El pedido sigue guardado. Recarga esta página para volver a intentarlo.</p></main>}
 if(!row)notFound();return <Summary order={JSON.parse(row.snapshot) as OrderSummary}/>;
}
