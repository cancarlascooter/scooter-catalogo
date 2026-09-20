import assert from 'node:assert/strict';
const base='http://localhost:8794';let cookie='';async function req(path,data,auth=true,method){return fetch(base+path,{method:method||(data?'POST':'GET'),headers:{origin:base,...(auth?{cookie}:{}),...(data?{'content-type':'application/json'}:{})},body:data?JSON.stringify(data):undefined})}
let r=await req('/api/admin-auth/login',{email:'local-test@example.com',password:'Local-only-test-password-92!'});assert.equal(r.status,200);cookie=r.headers.get('set-cookie').split(';')[0];const {shop}=await(await req('/api/shop')).json();
const f=new FormData();f.set('name','Promo fixture');f.set('price','100');r=await fetch(base+'/api/products',{method:'POST',headers:{cookie,origin:base},body:f});const {product}=await r.json();
const code='TEST'+Date.now();const rule={code,kind:'bundle',amount:0,buy:3,pay:2,productIds:[product.id],maxUses:1,expiresAt:new Date(Date.now()+3600000).toISOString()};r=await req('/api/promotions',rule);assert.equal(r.status,200,await r.clone().text());
const p=(await(await req('/api/promotions')).json()).promotions.find(p=>p.code===code);assert.equal(p.buy,3);
const payload={shopId:shop.id,customer:'Promo test',phone:'5281'+String(Date.now()).slice(-8),address:'Calle prueba 123',fulfillment:'shipping',couponCode:code,items:[{id:product.id,quantity:3,choices:{}}]};
const keys=[crypto.randomUUID(),crypto.randomUUID()];const result=await Promise.all(keys.map(requestKey=>req('/api/orders',{...payload,requestKey},false)));assert.deepEqual(result.map(r=>r.status).sort(),[201,409]);const win=result.findIndex(r=>r.status===201);const saved=await result[win].json();const fail=await result[1-win].json();assert.match(fail.error,/máximo/);
r=await req('/api/orders',{...payload,requestKey:keys[win]},false);assert.equal(r.status,200);assert.equal((await r.json()).token,saved.token);
const html=await(await req('/pedido/'+saved.token,undefined,false)).text();assert.ok(html.includes('$500.00'),'3 items $300 minus $100 plus $300 shipping');assert.ok(html.includes('3×2'));
r=await req('/api/orders',{...payload,phone:payload.phone.slice(2),requestKey:crypto.randomUUID()},false);assert.equal(r.status,409,'Equivalent phone cannot reuse');
r=await req('/api/promotions',{...rule,id:p.id,buy:4,pay:2});assert.equal(r.status,200);
r=await req('/api/orders',{...payload,items:[{id:product.id,quantity:4,choices:{}}],requestKey:crypto.randomUUID()},false);assert.equal(r.status,409,'Editing keeps usage count');
r=await req('/api/promotions',{...rule,id:p.id,kind:'fixed',amount:5000,maxUses:null});assert.equal(r.status,200);
r=await req('/api/orders',{...payload,requestKey:crypto.randomUUID()},false);assert.equal(r.status,201);const fixed=await r.json();assert.ok((await(await req('/pedido/'+fixed.token,undefined,false)).text()).includes('$550.00'));
await req('/api/promotions',{id:p.id,active:false},true,'PATCH');r=await req('/api/promotions/check',{shopId:shop.id,code},false);assert.equal(r.status,400);
r=await req('/api/promotions',{...rule,code:code+'E',expiresAt:'2020-01-01T00:00:00Z'});assert.equal(r.status,400);
const stats=await(await req('/api/admin/dashboard')).json();assert.equal(typeof stats.subscribers,'number');
await req('/api/products',{id:product.id},true,'DELETE');console.log('PASS concurrent usage limit, idempotent retry, phone aliases, editing retains uses, 3x2 and fixed totals with shipping, inactive/expired rejection, dashboard subscriber count.');
