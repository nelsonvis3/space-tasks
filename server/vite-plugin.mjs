import {scheduleBackups} from './backups.mjs'
import {resolve} from 'node:path'
import {mkdirSync} from 'node:fs'
import {Store} from './store.mjs'
import {createApi} from './api.mjs'
import {handleApi} from './http.mjs'
import {BASE_HEADERS} from './static.mjs'
import {requireRuntime} from './runtime.mjs'
export function spaceApiPlugin({dataDir='data',backups=true}={}){
 function install(server){requireRuntime();const directory=resolve(dataDir);mkdirSync(directory,{recursive:true,mode:0o700});const store=new Store(resolve(directory,'space.sqlite')),api=createApi(store,{origins:[],sameOrigin:true});const stopBackups=backups?scheduleBackups(store.db,resolve(directory,'backups')):null;let closed=false
  server.httpServer?.once('close',()=>{if(!closed){closed=true;if(stopBackups)void stopBackups().then(()=>store.close());else store.close()}})
  server.middlewares.use((req,res,next)=>{if(!req.url?.startsWith('/api/'))return next();for(const[key,value]of Object.entries(BASE_HEADERS))res.setHeader(key,value);void handleApi(api,req,res).catch(()=>{if(res.headersSent){res.destroy();return}res.writeHead(503,{'Content-Type':'application/json'});res.end(JSON.stringify({error:'The server could not complete the request.'}))})})
 }
 return{name:'space-local-api',configureServer:install,configurePreviewServer:install}
}
