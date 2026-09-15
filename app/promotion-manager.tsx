 'use client';
import {useEffect,useState,FormEvent} from 'react';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {api} from './shared';
export default function PromotionManager({shopId}:{shopId:string}){
 const [rows,setRows]=useState<{id:string,code:string,percent:number,active:number}[]>([]),[code,setCode]=useState(''),[percent,setPercent]=useState('10'),[busy,setBusy]=useState(false),[error,setError]=useState(''),[status,setStatus]=useState('');
 async function load(){try{const d=await api<{promotions:typeof rows}>('/api/promotions');setRows(d.promotions)}catch(e){setError((e as Error).message)}}
 useEffect(()=>{void load()},[shopId]);
 async function save(e:FormEvent){e.preventDefault();setBusy(true);setError('');setStatus('');try{await api('/api/promotions',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({code,percent:Number(percent)})});setCode('');await load();setStatus('Código creado y activo.')}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 async function toggle(id:string,active:boolean){setBusy(true);setError('');try{await api('/api/promotions',{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({id,active})});await load()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 return <section className="panel promotion-manager"><h2>Códigos de descuento</h2><p className="hint">Crea promociones por porcentaje. Se aplican a los productos, sin descontar el envío. Un código por pedido.</p><form onSubmit={save}><div className="form-grid"><label>Código<Input required value={code} onChange={e=>setCode(e.target.value.toUpperCase())} minLength={3} maxLength={30} pattern="[A-Za-z0-9_-]+" placeholder="Ej. VERANO10"/></label><label>Descuento (%)<Input required type="number" min="1" max="100" step="1" value={percent} onChange={e=>setPercent(e.target.value)}/></label></div><Button type="submit" disabled={busy}>Crear código</Button></form>{error&&<p className="error" role="alert">{error}</p>}{status&&<p role="status">{status}</p>}<div className="promotion-list">{rows.map(p=><div key={p.id}><span><strong>{p.code}</strong> · {p.percent}% · {p.active?'Activo':'Inactivo'}</span><Button variant="outline" disabled={busy} onClick={()=>toggle(p.id,!p.active)}>{p.active?'Desactivar':'Activar'}</Button></div>)}</div>{!rows.length&&<p className="hint">Todavía no tienes códigos de descuento.</p>}</section>
}
