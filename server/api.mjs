import {PDF_POLICY} from './static.mjs'
import {ApiError} from './store.mjs'
import {AttemptLimiter,requestBudget} from './limits.mjs'
const MAX_JSON=6*1024*1024+65536
export async function readBody(request,max){const declared=Number(request.headers.get('content-length'));if(Number.isFinite(declared)&&declared>max)throw new ApiError(413,'The request is too large.');const chunks=[];let size=0;const reader=request.body?.getReader();if(!reader)return Buffer.alloc(0);for(;;){const{done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw new ApiError(413,'The request is too large.')}chunks.push(Buffer.from(value))}return Buffer.concat(chunks)}
async function json(request,max=MAX_JSON){try{const value=JSON.parse((await readBody(request,max)).toString());if(!value||typeof value!=='object'||Array.isArray(value))throw new ApiError(400,'Invalid request.');return value}catch(e){if(e instanceof ApiError)throw e;throw new ApiError(400,'Invalid request.')}}
function cookie(request,name){return request.headers.get('cookie')?.split(';').map(v=>v.trim()).find(v=>v.startsWith(name+'='))?.slice(name.length+1)||''}
const reply=(body,status=200,headers={})=>new Response(JSON.stringify(body),{status,headers:{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers}})
export function createApi(store,{origins=['http://localhost:5173','http://127.0.0.1:5173','http://localhost:3001','http://127.0.0.1:3001'],secure=false,sameOrigin=false,registrationLimit=5,freeSpace=null,minFree=0}={}){
 // Only failed sign-ins count, so a user who signs in often is never locked out; every registration counts.
 const failures=new AttemptLimiter(),registrations=new AttemptLimiter({limit:registrationLimit}),upload=requestBudget(2),save=requestBudget(4);let activeAuth=0
 const cookieName=secure?'__Host-space_session':'space_session'
 // New accounts and uploads stop before the disk fills up; saving existing workspaces keeps working.
 const ensureSpace=async()=>{if(freeSpace&&await freeSpace()<minFree)throw new ApiError(507,'The server is out of storage space. Please try again later.')}
 return async(request,ip='local')=>{
  // Password checks share the sign-in limits: bounded scrypt work, and wrong passwords count as failures.
  const passwordWork=async work=>{failures.check(ip);if(activeAuth>=4)throw new ApiError(503,'Too many requests. Try again shortly.');activeAuth++;try{return await work()}catch(e){if(e instanceof ApiError&&e.status===403)failures.record(ip);throw e}finally{activeAuth--}}
  try{
  const url=new URL(request.url),path=url.pathname,method=request.method,token=cookie(request,cookieName),mutating=!['GET','HEAD','OPTIONS'].includes(method)
  if(mutating&&!origins.includes(request.headers.get('origin'))&&!(sameOrigin&&request.headers.get('origin')===url.origin))throw new ApiError(403,'This request was blocked. Reload the page and try again.')
  const sessionCookie=(value,maxAge)=>`${cookieName}=${value}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}${secure?'; Secure':''}`
  if(method==='POST'&&['/api/auth/register','/api/auth/login'].includes(path)){
   const registering=path.endsWith('register'),limiter=registering?registrations:failures
   limiter.check(ip);if(registering)await ensureSpace();if(activeAuth>=4)throw new ApiError(503,'Too many requests. Try again shortly.');if(registering)limiter.record(ip);activeAuth++
   try{const body=await json(request,16384),user=await store[registering?'register':'login'](body.username,body.password),session=store.session(user);store.logout(token);return reply({user,csrf:session.csrf},200,{'Set-Cookie':sessionCookie(session.token,30*86400)})}catch(e){if(!registering&&e instanceof ApiError&&e.status<500)limiter.record(ip);throw e}finally{activeAuth--}
  }
  const user=store.authenticate(token);if(!user)throw new ApiError(401,'Your session has expired. Sign in again.')
  if(request.headers.get('x-space-account')&&request.headers.get('x-space-account')!==user.id)throw new ApiError(401,'Your session has expired. Sign in again.')
  if(mutating&&request.headers.get('x-csrf-token')!==user.csrf)throw new ApiError(403,'This request was blocked. Reload the page and try again.')
  if(path==='/api/auth/me'&&method==='GET')return reply({user:{id:user.id,username:user.username},csrf:user.csrf})
  if(path==='/api/auth/logout'&&method==='POST'){store.logout(token);return reply({ok:true},200,{'Set-Cookie':sessionCookie('',0)})}
  if(path==='/api/auth/password'&&method==='POST')return await passwordWork(async()=>{const body=await json(request,16384);await store.changePassword(user.id,body.current,body.next,token);return reply({ok:true})})
  if(path==='/api/auth/sessions/close-others'&&method==='POST'){store.closeOtherSessions(user.id,token);return reply({ok:true})}
  if(path==='/api/account'&&method==='DELETE')return await passwordWork(async()=>{const body=await json(request,16384);await store.deleteAccount(user.id,body.password);return reply({ok:true},200,{'Set-Cookie':sessionCookie('',0)})})
  if(path==='/api/document'&&method==='GET')return reply(store.document(user.id))
  if(path==='/api/document'&&method==='PUT')return await save(async()=>{const body=await json(request);try{return reply(store.save(user.id,body.revision,body.data))}catch(e){if(e.status===409)return reply({error:e.message,document:store.document(user.id)},409);throw e}})
  if(path==='/api/document/revisions'&&method==='GET')return reply(store.revisions(user.id))
  const savedRevision=path.match(/^\/api\/document\/revisions\/(\d+)$/)?.[1];if(savedRevision&&method==='GET')return reply(store.previous(user.id,Number(savedRevision)))
  if(path==='/api/books/trash'&&method==='GET')return reply(store.books(user.id,true))
  const restoreId=path.match(/^\/api\/books\/([a-f0-9-]{36})\/restore$/)?.[1];if(restoreId&&method==='POST'){store.restoreBook(user.id,restoreId);return reply({ok:true})}
  if(path==='/api/books'&&method==='GET')return reply(store.books(user.id))
  if(path==='/api/books'&&method==='POST'){if(request.headers.get('content-type')?.split(';')[0].trim()!=='application/pdf')throw new ApiError(415,'Upload a PDF using the PDF importer.');let name;try{name=decodeURIComponent(request.headers.get('x-file-name')||'')}catch{throw new ApiError(400,'Invalid file name.')}await ensureSpace();return await upload(async()=>reply(store.addBook(user.id,name,await readBody(request,40*1024*1024)),201))}
  const id=path.match(/^\/api\/books\/([a-f0-9-]{36})$/)?.[1]
  if(id&&method==='GET'){const book=store.book(user.id,id);return new Response(book.file,{headers:{'Content-Type':'application/pdf','Content-Length':String(book.size),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Security-Policy':PDF_POLICY,'Content-Disposition':`inline; filename*=UTF-8''${encodeURIComponent(book.name)}`}})}
  if(id&&method==='DELETE'){store.deleteBook(user.id,id);return reply({ok:true})}
  throw new ApiError(404,'Page not found.')
 }catch(e){if(!(e instanceof ApiError))console.error('API operation failed:',e.code||e.name);return reply({error:e instanceof ApiError?e.message:'The server could not complete the request.'},e.status||500)}}
}
