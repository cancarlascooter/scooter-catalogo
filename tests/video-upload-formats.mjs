import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
const base='http://localhost:8790';
let r=await fetch(base+'/api/admin-auth/login',{method:'POST',headers:{origin:base,'content-type':'application/json'},body:JSON.stringify({email:'local-test@example.com',password:'Local-only-test-password-92!'})});assert.equal(r.status,200);const cookie=r.headers.get('set-cookie').split(';')[0];
const sample=fs.readFileSync('public/samples/catalogo.mp4'),free=Buffer.alloc(25*1024*1024);free.writeUInt32BE(free.length);free.write('free',4);
const hash=b=>createHash('sha256').update(b).digest('hex');
for(const mime of ['video/mp4','video/quicktime']){
 const header=Buffer.from(sample);if(mime==='video/quicktime')header.write('qt  ',8);
 const bytes=Buffer.concat([header,free]);
 r=await fetch(base+'/api/videos',{method:'POST',headers:{cookie,origin:base,'content-type':mime,'x-video-title':encodeURIComponent('Prueba local de formato'),'x-video-size':String(bytes.length)},body:bytes});assert.equal(r.status,201,await r.clone().text());const {video}=await r.json();
 try{r=await fetch(base+video.source);assert.equal(r.headers.get('content-type'),mime);assert.equal(hash(Buffer.from(await r.arrayBuffer())),hash(bytes));r=await fetch(base+video.source,{headers:{Range:'bytes=0-1023'}});assert.equal(r.status,206);assert.equal((await r.arrayBuffer()).byteLength,1024)}finally{await fetch(base+'/api/videos',{method:'DELETE',headers:{cookie,origin:base,'content-type':'application/json'},body:JSON.stringify({id:video.id})})}
}
r=await fetch(base+'/api/videos',{method:'POST',headers:{cookie,origin:base,'content-type':'video/quicktime','x-video-title':'Invalid'},body:'this is not a video'});assert.equal(r.status,400);
console.log('PASS: MP4 and QuickTime fixtures >25 MB stored byte for byte, correct MIME and range playback; invalid file rejected.');
