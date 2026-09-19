'use client';
import {useId,useState,type InputHTMLAttributes} from 'react';
import {Eye,EyeOff} from 'lucide-react';
export default function PasswordField({label,...props}:Omit<InputHTMLAttributes<HTMLInputElement>,'type'|'id'> & {label:string}){
 const id=useId();const [visible,setVisible]=useState(false);
 return <div className="password-field"><label htmlFor={id}>{label}</label><div className="password-control"><input {...props} id={id} type={visible?'text':'password'}/><button type="button" className="password-toggle" aria-label={`${visible?'Ocultar':'Mostrar'} ${label.toLocaleLowerCase('es')}`} aria-controls={id} aria-pressed={visible} onClick={()=>setVisible(v=>!v)}>{visible?<EyeOff size={21} aria-hidden="true"/>:<Eye size={21} aria-hidden="true"/>}</button></div></div>
}
