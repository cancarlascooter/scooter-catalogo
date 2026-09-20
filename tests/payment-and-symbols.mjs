import assert from 'node:assert/strict';
const base='http://localhost:8794';let cookie='';async function req(path,data,auth=true,method){return fetch(base+path,{method:method||(data?'POST':'GET'),headers:{origin:base,...(auth?{cookie}:{}),...(data?{'content-type':'application/json'}:{})},body:data?JSON.stringify(data):undefined})}
let r=await req('/api/admin-auth/login',{email:'local-test@example.com',password:'Local-only-test-password-92!'});assert.equal(r.status,200);cookie=r.headers.get('set-cookie').split(';')[0];
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Monterrey',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const all=await(await req('/api/orders/daily?date='+today)).json();const o=all.orders.find(o=>o.status==='pending');assert.ok(o);
const report=()=>req(`/api/admin/sales?from=${today}&to=${today}`).then(r=>r.json());const before=await report();const paid=before.days.reduce((n,d)=>n+d.paid,0);
r=await req('/api/orders/payment',{id:o.id,status:'paid'},false,'PATCH');assert.equal(r.status,401);
r=await req('/api/orders/payment',{id:crypto.randomUUID(),status:'paid'},true,'PATCH');assert.equal(r.status,404);
for(let i=0;i<2;i++){r=await req('/api/orders/payment',{id:o.id,status:'paid'},true,'PATCH');assert.equal(r.status,200)}
const after=await report();assert.equal(after.days.reduce((n,d)=>n+d.paid,0),paid+o.total);
let receipt=await(await req('/pedido/'+o.token,undefined,false)).text();assert.ok(receipt.includes('El negocio registró este pedido como pagado.'));
r=await req('/api/orders/payment',{id:o.id,status:'pending'},true,'PATCH');assert.equal(r.status,200);assert.equal((await report()).days.reduce((n,d)=>n+d.paid,0),paid);
assert.equal((await req('/api/admin/sales',undefined,false)).status,401);assert.equal((await req('/api/admin/sales?from=2025-01-01&to=2026-09-01')).status,400);
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==','base64');const body=new FormData();body.set('image',new Blob([png],{type:'image/png'}),'icon.png');r=await fetch(base+'/api/admin/department-symbol',{method:'POST',headers:{cookie,origin:base},body});assert.equal(r.status,200);const {symbol}=await r.json();const old=await(await req('/api/admin/settings')).json();r=await req('/api/admin/settings',{...old,departmentIcons:{...old.departmentIcons,General:symbol}},true,'PATCH');assert.equal(r.status,200);
const [,shop,id]=symbol.split(':');r=await req(`/api/department-symbol/${shop}/${id}`,undefined,false);assert.equal(r.status,200);assert.equal(r.headers.get('content-type'),'image/png');
r=await req('/api/admin/settings',{...old,departmentIcons:{General:`image:${crypto.randomUUID()}:${id}`}},true,'PATCH');assert.equal(r.status,400);
await req('/api/admin/settings',old,true,'PATCH');
console.log('PASS paid totals, idempotent payment updates, reversal, receipt status, private endpoints, date limits, symbol upload/persistence/public display and ownership validation');
