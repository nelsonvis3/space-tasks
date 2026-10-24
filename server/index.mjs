import {createServer} from 'node:http'
import {httpRequest,handleApi,writeResponse} from './http.mjs'
import {mkdirSync} from 'node:fs'
import {statfs} from 'node:fs/promises'
import {resolve} from 'node:path'
import {Store} from './store.mjs'
import {createApi} from './api.mjs'
import {BASE_HEADERS,createStaticHandler} from './static.mjs'
import {scheduleBackups} from './backups.mjs'
import {requireRuntime} from './runtime.mjs'
requireRuntime()
const production=process.env.NODE_ENV==='production',origin=process.env.APP_ORIGIN,trustProxy=process.env.TRUST_PROXY==='1'
if(production&&(!origin||new URL(origin).origin!==origin||!origin.startsWith('https://')))throw new Error('Set APP_ORIGIN to the public HTTPS origin before starting in production.')
const data=resolve(process.env.DATA_DIR||'data');mkdirSync(data,{recursive:true,mode:0o700})
const registrationLimit=Number(process.env.REGISTRATION_LIMIT||5)
if(!Number.isSafeInteger(registrationLimit)||registrationLimit<1)throw new Error('REGISTRATION_LIMIT must be a positive whole number.')
const minFreeMb=Number(process.env.MIN_FREE_DISK_MB||2048)
if(!Number.isFinite(minFreeMb)||minFreeMb<0)throw new Error('MIN_FREE_DISK_MB must be zero or a positive number.')
const store=new Store(resolve(data,'space.sqlite')),api=createApi(store,{...(origin?{origins:[origin]}:{}),secure:production,registrationLimit,minFree:minFreeMb*1024*1024,freeSpace:()=>statfs(data).then(disk=>disk.bavail*disk.bsize)})
const stopBackups=scheduleBackups(store.db,process.env.BACKUP_DIR||'backups')
let files;try{files=await createStaticHandler('dist',{secure:production})}catch{/* API-only development server can run before a frontend build. */}
const server=createServer(async(req,res)=>{try{
 for(const[key,value]of Object.entries(BASE_HEADERS))res.setHeader(key,value)
 if(production)res.setHeader('Strict-Transport-Security','max-age=31536000')
 if(new URL(req.url,'http://localhost').pathname.startsWith('/api/')){await handleApi(api,req,res,{trustProxy});return}
 if(files)await writeResponse(await files(httpRequest(req)),res);else{res.writeHead(503,{'Content-Type':'text/plain'});res.end('Build the frontend with npm run build before serving it.')}
 }catch{if(res.headersSent)res.destroy();else{res.writeHead(500,{'Content-Type':'text/plain'});res.end('Request could not be completed.')}}})
server.requestTimeout=120000;server.headersTimeout=15000;server.on('error',error=>{console.error(`SPACE server could not listen: ${error.code||error.name}`);void stopBackups().then(()=>{store.close();process.exitCode=1})})
server.listen(Number(process.env.PORT||3001),process.env.HOST||'127.0.0.1',()=>console.log('SPACE server listening on configured host and port.'))
let stopping=false
function stop(){if(stopping)return;stopping=true;server.close(()=>{void stopBackups().then(()=>{store.close();process.exit(0)})})}process.on('SIGTERM',stop);process.on('SIGINT',stop)
