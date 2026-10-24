import {test} from 'node:test'
import assert from 'node:assert/strict'
import {Store} from '../server/store.mjs'
import {createApi} from '../server/api.mjs'
const origin='http://localhost:5173'
function request(path,method='GET',body,session={}){return new Request(origin+path,{method,headers:{origin,...(session.cookie?{cookie:session.cookie}:{}),...(session.csrf?{'x-csrf-token':session.csrf}:{}),...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{})})}
async function signIn(api,path,username,password){const response=await api(request(path,'POST',{username,password}));assert.equal(response.status,200);return{cookie:response.headers.get('set-cookie').split(';')[0],csrf:(await response.json()).csrf}}
const me=(api,session)=>api(request('/api/auth/me','GET',null,session)).then(response=>response.status)

test('changing the password needs the current one, keeps this session and signs out every other device',async()=>{
 const store=new Store(),api=createApi(store);try{
  const here=await signIn(api,'/api/auth/register','owner','old-password-1'),other=await signIn(api,'/api/auth/login','owner','old-password-1')
  assert.equal((await api(request('/api/auth/password','POST',{current:'wrong-password',next:'new-password-1'},here))).status,403)
  assert.equal((await api(request('/api/auth/password','POST',{current:'old-password-1',next:'short'},here))).status,400)
  assert.equal((await api(request('/api/auth/password','POST',{current:'old-password-1',next:'new-password-1'},here))).status,200)
  assert.equal(await me(api,here),200);assert.equal(await me(api,other),401)
  assert.equal((await api(request('/api/auth/login','POST',{username:'owner',password:'old-password-1'}))).status,401)
  assert.equal((await api(request('/api/auth/login','POST',{username:'owner',password:'new-password-1'}))).status,200)
 }finally{store.close()}
})
test('signing out other devices keeps only the current session',async()=>{
 const store=new Store(),api=createApi(store);try{
  const here=await signIn(api,'/api/auth/register','traveler','long-password'),other=await signIn(api,'/api/auth/login','traveler','long-password')
  assert.equal((await api(request('/api/auth/sessions/close-others','POST',null,{cookie:here.cookie}))).status,403)
  assert.equal((await api(request('/api/auth/sessions/close-others','POST',null,here))).status,200)
  assert.equal(await me(api,here),200);assert.equal(await me(api,other),401)
 }finally{store.close()}
})
test('deleting the account needs the password and removes its sessions, workspace, versions and PDF files',async()=>{
 const store=new Store(),api=createApi(store);try{
  const here=await signIn(api,'/api/auth/register','leaving','long-password'),keep=await signIn(api,'/api/auth/register','staying','long-password'),id=store.authenticate(here.cookie.split('=')[1]).id
  store.save(id,0,{'orbit:tasks:v2':'[1]'});store.save(id,1,{'orbit:tasks:v2':'[2]'});store.addBook(id,'notes.pdf',Buffer.from('%PDF-1.7\nprivate'))
  assert.equal((await api(request('/api/account','DELETE',{password:'wrong-password'},here))).status,403)
  const deleted=await api(request('/api/account','DELETE',{password:'long-password'},here))
  assert.equal(deleted.status,200);assert.match(deleted.headers.get('set-cookie'),/Max-Age=0/)
  assert.equal(await me(api,here),401)
  for(const table of ['users','sessions','documents','revisions','books'])assert.equal(store.db.prepare(`SELECT COUNT(*) n FROM ${table} WHERE ${table==='users'?'id':'user_id'}=?`).get(id).n,0,table)
  assert.equal((await api(request('/api/auth/login','POST',{username:'leaving',password:'long-password'}))).status,401)
  assert.equal(await me(api,keep),200)
 }finally{store.close()}
})
