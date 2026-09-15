'use client';
import { useEffect,useRef } from 'react';
import { flushSync } from 'react-dom';
type Tool={name:string,title:string,description:string,inputSchema:object,annotations:{readOnlyHint:boolean,untrustedContentHint:boolean},execute:(input:unknown)=>unknown};
export function usePageTools(tools:Tool[]){const current=useRef(tools);useEffect(()=>{current.current=tools});useEffect(()=>{const context=(document as Document & {modelContext?:{registerTool:(tool:Tool,options:{signal:AbortSignal})=>void|Promise<void>}}).modelContext;if(!context?.registerTool)return;const life=new AbortController();for(const tool of current.current){try{void Promise.resolve(context.registerTool({...tool,execute(input){let result:unknown;flushSync(()=>{result=current.current.find(t=>t.name===tool.name)!.execute(input)});return result}},{signal:life.signal})).catch(()=>{})}catch{}}return()=>life.abort()},[])}
