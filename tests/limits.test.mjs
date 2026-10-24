import {test} from 'node:test'
import assert from 'node:assert/strict'
import {AttemptLimiter} from '../server/limits.mjs'
import {createApi} from '../server/api.mjs'
import {clientIp} from '../server/http.mjs'
import {ApiError,Store} from '../server/store.mjs'
test('attempt limiting stays bounded, forgets the oldest client when full and lets expired clients retry',()=>{
 const limiter=new AttemptLimiter({capacity:2,limit:2,interval:1000})
 limiter.take('a',0);limiter.take('a',1);limiter.take('b',2)
 assert.throws(()=>limiter.take('a',3),{status:429})
 limiter.take('c',3);assert.equal(limiter.entries.size,2);assert.ok(!limiter.entries.has('a'))
 limiter.take('c',60001);assert.equal(limiter.entries.size,1)
})
test('only failed sign-ins count toward the limit and registrations have their own cap',async()=>{
 const origin='http://localhost:5173',store={register:(username)=>({id:username,username}),login:(username,password)=>{if(password!=='right-password')throw new ApiError(401,'Incorrect username or password.');return{id:username,username}},session:()=>({token:'t',csrf:'c'}),logout:()=>{}}
 const api=createApi(store),post=(path,password,ip='203.0.113.9',username='nelson')=>api(new Request(origin+path,{method:'POST',headers:{origin},body:JSON.stringify({username,password})}),ip).then(response=>response.status)
 for(let i=0;i<25;i++)assert.equal(await post('/api/auth/login','right-password'),200)
 for(let i=0;i<20;i++)assert.equal(await post('/api/auth/login','wrong-password'),401)
 assert.equal(await post('/api/auth/login','right-password'),429)
 assert.equal(await post('/api/auth/login','right-password','198.51.100.7'),200)
 for(let i=0;i<5;i++)assert.equal(await post('/api/auth/register','right-password','203.0.113.9','user'+i),200)
 assert.equal(await post('/api/auth/register','right-password','203.0.113.9','user9'),429)
})
test('client addresses group IPv6 networks and only trust a proxy when configured',()=>{
 const req=(remoteAddress,headers={})=>({socket:{remoteAddress},headers}),proxied={'x-forwarded-for':'192.0.2.1, 198.51.100.7'}
 assert.equal(clientIp(req('::ffff:203.0.113.9')),'203.0.113.9')
 assert.equal(clientIp(req('2001:db8::1')),'2001:db8:0:0::/64')
 assert.equal(clientIp(req('2001:db8:1:2:aaaa::1')),clientIp(req('2001:db8:1:2:bbbb:cccc:dddd:2')))
 assert.equal(clientIp(req('10.0.0.1',proxied)),'10.0.0.1')
 assert.equal(clientIp(req('10.0.0.1',proxied),true),'198.51.100.7')
})
test('concurrent uploads are rejected before buffering and failed reads release their slot',async()=>{
 const origin='https://space.test',controllers=[],store={authenticate:()=>({id:'a',csrf:'test'}),addBook:(_id,name,file)=>({name,size:file.length})},api=createApi(store,{origins:[origin]})
 const request=()=>new Request(origin+'/api/books',{method:'POST',headers:{origin,'x-csrf-token':'test','content-type':'application/pdf','x-file-name':'notes.pdf'},body:new ReadableStream({start(controller){controllers.push(controller)}}),duplex:'half'})
 const pending=[api(request()),api(request())];await new Promise(resolve=>setImmediate(resolve))
 const rejected=request();assert.equal((await api(rejected)).status,503)
 controllers[0].error(new Error('Disconnected'));assert.equal((await pending[0]).status,500)
 const retry=api(request());await new Promise(resolve=>setImmediate(resolve))
 for(const controller of [controllers[1],controllers[3]]){controller.enqueue(new TextEncoder().encode('%PDF-1.7'));controller.close()}
 assert.equal((await pending[1]).status,201);assert.equal((await retry).status,201)
 await rejected.body.cancel()
})
test('version history is capped by size per account and always keeps the newest versions',async()=>{
 const store=new Store(':memory:',{revisionBytes:3000});try{const user=await store.register('history-user','long-password');let revision=0
  for(let i=0;i<10;i++)revision=store.save(user.id,revision,{'orbit:tasks:v2':String(i).repeat(900)}).revision
  const kept=store.revisions(user.id).map(item=>item.revision),bytes=kept.reduce((total,saved)=>total+Buffer.byteLength(JSON.stringify(store.previous(user.id,saved).data)),0)
  assert.ok(bytes<=3000,`history uses ${bytes} bytes`);assert.ok(kept.length>=2);assert.equal(kept[0],revision-1);assert.deepEqual(kept,[...kept].sort((a,b)=>b-a))
 }finally{store.close()}
})
test('below the free-disk reserve new accounts and uploads are refused while existing workspaces still save',async()=>{
 const origin='http://localhost:5173',store={register:()=>({id:'a',username:'a'}),session:()=>({token:'t',csrf:'c'}),logout:()=>{},authenticate:()=>({id:'a',username:'a',csrf:'c'}),save:(_id,revision,data)=>({revision:revision+1,data}),document:()=>({revision:0,data:{}}),addBook:()=>({})}
 const api=createApi(store,{freeSpace:async()=>10,minFree:1000}),call=(path,method,body,headers={})=>api(new Request(origin+path,{method,headers:{origin,'x-csrf-token':'c',...headers},body}),'203.0.113.9').then(response=>response.status)
 assert.equal(await call('/api/auth/register','POST',JSON.stringify({username:'new-user',password:'long-password'})),507)
 assert.equal(await call('/api/books','POST','%PDF-1.7',{'content-type':'application/pdf','x-file-name':'a.pdf'}),507)
 assert.equal(await call('/api/document','PUT',JSON.stringify({revision:0,data:{'orbit:tasks:v2':'[]'}})),200)
 assert.equal(await createApi(store,{freeSpace:async()=>5000,minFree:1000})(new Request(origin+'/api/auth/register',{method:'POST',headers:{origin},body:JSON.stringify({username:'new-user',password:'long-password'})})).then(response=>response.status),200)
})
