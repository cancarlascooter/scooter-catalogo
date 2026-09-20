import assert from 'node:assert/strict';
import fs from 'node:fs';
import {randomBytes,createHash} from 'node:crypto';
import {deflateSync} from 'node:zlib';
import {prepareProductPhoto} from '../app/product-photo.ts';
const base='http://localhost:8787',hash=b=>createHash('sha256').update(b).digest('hex');
const login=await fetch(base+'/api/admin-auth/login',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify({email:'local-test@example.com',password:'Local-only-test-password-92!'})});assert.equal(login.status,200);const cookie=login.headers.get('set-cookie').split(';')[0];
function crc32(b){let c=0xffffffff;for(const x of b){c^=x;for(let k=0;k<8;k++)c=(c>>>1)^((c&1)?0xedb88320:0)}return (c^0xffffffff)>>>0}
function chunk(type,data){const b=Buffer.concat([Buffer.from(type),data]),out=Buffer.alloc(b.length+8);out.writeUInt32BE(data.length);b.copy(out,4);out.writeUInt32BE(crc32(b),out.length-4);return out}
const width=4000,height=3000,rows=Buffer.alloc((width*3+1)*height);for(let y=0;y<height;y++)randomBytes(width*3).copy(rows,y*(width*3+1)+1);const ihdr=Buffer.alloc(13);ihdr.writeUInt32BE(width,0);ihdr.writeUInt32BE(height,4);ihdr[8]=8;ihdr[9]=2;
const photo=Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))]);
const file=new File([photo],'alta-resolucion.png',{type:'image/png'});assert.equal(await prepareProductPhoto(file),file);assert.ok(file.size>20*1024*1024);
const form=new FormData();for(const [k,v] of Object.entries({name:'Prueba local alta resolución',price:'100',department:'Pruebas',image:file}))form.append(k,v);
let r=await fetch(base+'/api/products',{method:'POST',headers:{origin:base,cookie},body:form});assert.equal(r.status,200,await r.clone().text());const {product}=await r.json();r=await fetch(base+'/api/image/'+product.image);assert.equal(hash(Buffer.from(await r.arrayBuffer())),hash(photo));
const free=Buffer.alloc(32*1024*1024);free.writeUInt32BE(free.length);free.write('free',4);const video=Buffer.concat([fs.readFileSync('public/samples/catalogo.mp4'),free]);
r=await fetch(base+'/api/videos',{method:'POST',headers:{origin:base,cookie,'content-type':'video/mp4','x-video-title':encodeURIComponent('Video grande de prueba')},body:video});assert.equal(r.status,201,await r.clone().text());const {video:saved}=await r.json();
r=await fetch(base+saved.source);assert.equal(hash(Buffer.from(await r.arrayBuffer())),hash(video));
r=await fetch(base+saved.source,{headers:{range:'bytes=0-1023'}});assert.equal(r.status,206);assert.equal((await r.arrayBuffer()).byteLength,1024);
console.log(`PASS: PNG original ${width}x${height} (${Math.round(photo.length/1024/1024)} MB), MP4 ${Math.round(video.length/1024/1024)} MB conservados byte por byte y reproducción parcial.`);
