import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
const base='http://localhost:8794';
async function req(path,cookie='',data,method){const response=await fetch(base+path,{method:method||(data?'POST':'GET'),headers:{origin:base,cookie,...(data?{'content-type':'application/json'}:{})},body:data?JSON.stringify(data):undefined});const payload=await response.text();if(response.status===503)console.log('Unexpected 503',path,payload);return new Response(payload,{status:response.status,headers:response.headers})}
const login=await req('/api/admin-auth/login','',{email:'local-test@example.com',password:'Local-only-test-password-92!'});assert.equal(login.status,200);const owner=login.headers.get('set-cookie').split(';')[0];const ownerMe=await(await req('/api/admin-auth/me',owner)).json();
const created=[];async function invite(permissions){const email=`role-${Date.now()}-${created.length}@example.com`;let r=await req('/api/admin-auth/invite',owner,{email,permissions});assert.equal(r.status,200,await r.clone().text());const {url}=await r.json();r=await req('/api/admin-auth/accept','',{email,password:'Local-only-seller-password-92!',token:url.split('#invite=')[1]});assert.equal(r.status,201,await r.clone().text());const cookie=r.headers.get('set-cookie').split(';')[0],me=await(await req('/api/admin-auth/me',cookie)).json();const seller={id:me.user.id,cookie,email,permissions};created.push(seller);assert.deepEqual(me.user.permissions,permissions);assert.deepEqual(me.users,[]);return seller}
const a=await invite(['mis-ventas','pedidos']),b=await invite(['mis-ventas','pedidos']);
for(const path of ['/api/admin/dashboard','/api/admin/sales','/api/promotions','/api/inventory','/api/admin/settings','/api/videos','/api/push/send'])assert.equal((await req(path,a.cookie)).status,403,path);
for(const [path,method] of [['/api/products','POST'],['/api/products','DELETE'],['/api/products/import','POST'],['/api/inventory','POST'],['/api/admin/settings','PATCH'],['/api/admin/department-symbol','POST'],['/api/shop','POST'],['/api/shop','PATCH'],['/api/promotions','POST'],['/api/promotions','PATCH'],['/api/videos','POST'],['/api/videos','DELETE'],['/api/push/send','POST']])assert.equal((await req(path,a.cookie,{},method)).status,403,path);
assert.equal((await req('/api/admin-auth/permissions',a.cookie,{id:a.id,permissions:['productos']})).status,403);
assert.equal((await req('/api/admin-auth/permissions',owner,{id:a.id,permissions:['ventas']})).status,400);
assert.equal((await req('/api/admin-auth/permissions',owner,{id:ownerMe.user.id,permissions:[]})).status,404);
assert.equal((await req('/api/admin-auth/permissions',owner,{id:crypto.randomUUID(),permissions:[]})).status,404);
const {shop}=await(await req('/api/shop',owner)).json();const body=new FormData();body.set('name','Permission sales fixture');body.set('price','100');const product=await(await fetch(base+'/api/products',{method:'POST',headers:{origin:base,cookie:owner},body})).json();assert.ok(product.product?.id);
const orders=[];for(let i=0;i<3;i++){let r=await req('/api/orders','',{shopId:shop.id,customer:'Seller test',phone:'528111111111',address:'Calle prueba',fulfillment:'mty',requestKey:crypto.randomUUID(),items:[{id:product.product.id,quantity:i+1,choices:{}}]});assert.equal(r.status,201);orders.push(await r.json())}
const today=new Intl.DateTimeFormat('en-CA',{timeZone:'America/Monterrey',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());const daily=await(await req('/api/orders/daily?date='+today,owner)).json();orders.forEach(o=>o.id=daily.orders.find(x=>x.token===o.token).id);
assert.equal((await req('/api/orders/payment',a.cookie,{id:orders[0].id,status:'paid'},'PATCH')).status,200);
assert.equal((await req('/api/orders/payment',b.cookie,{id:orders[1].id,status:'paid'},'PATCH')).status,200);
assert.equal((await req('/api/orders/payment',b.cookie,{id:orders[0].id,status:'pending'},'PATCH')).status,403);
const sum=async(seller,extra='')=>{const r=await req('/api/admin/sales?scope=mine&from='+today+'&to='+today+extra,seller.cookie);assert.equal(r.status,200);return (await r.json()).days.reduce((n,d)=>n+d.paid,0)};
assert.equal(await sum(a),10000);assert.equal(await sum(b),20000);assert.equal(await sum(a,'&salesperson='+b.id),10000);
const visible=await(await req('/api/orders/daily?date='+today,a.cookie)).json();assert.ok(visible.orders.some(o=>o.id===orders[0].id));assert.ok(!visible.orders.some(o=>o.id===orders[1].id));
const race=await Promise.all([a,b].map(s=>req('/api/orders/payment',s.cookie,{id:orders[2].id,status:'paid'},'PATCH')));assert.equal(race.filter(r=>r.status===200).length,1);assert.equal(await sum(a)+await sum(b),60000);
assert.equal((await req('/api/admin-auth/permissions',owner,{id:a.id,permissions:[]})).status,200);assert.equal((await req('/api/orders/daily',a.cookie)).status,403);assert.equal((await req('/api/admin/sales?scope=mine',a.cookie)).status,403);
assert.equal((await req('/api/admin-auth/permissions',owner,{id:a.id,permissions:['mis-ventas','pedidos']})).status,200);
await writeFile('.wrangler/permissions-browser-fixture.json',JSON.stringify({owner,a,b,productId:product.product.id}));
console.log('PASS invitation permissions, owner-only global reports, direct API guards, no self-escalation, own sales isolation, paid order privacy, concurrent attribution, live permission changes.');
