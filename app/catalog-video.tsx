'use client';
import {useState} from 'react';
import type {CatalogVideo} from './shared';
export default function VideoCard({video}:{video:CatalogVideo}){const [failed,setFailed]=useState(false);return <article className="catalog-video">{failed?<div className="video-error" role="status"><p>No pudimos reproducir este video.</p><button onClick={()=>setFailed(false)}>Volver a intentar</button></div>:<video key={video.source} controls playsInline preload="metadata" aria-label={video.title} onError={()=>setFailed(true)} src={video.source}/>}<h3>{video.title}</h3></article>}
