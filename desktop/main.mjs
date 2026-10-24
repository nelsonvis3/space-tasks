// SPACE Tasks desktop: the complete app on this computer. The interface is served from a private
// space:// origin and /api/ is answered in-process by the same server code, so no network port is opened.
import {app,BrowserWindow,Menu,dialog,protocol,shell} from 'electron'
import {mkdirSync,readFileSync,writeFileSync,rmSync} from 'node:fs'
import {statfs,writeFile} from 'node:fs/promises'
import {dirname,join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createStaticHandler} from '../server/static.mjs'
import {createApi} from '../server/api.mjs'
import {Store} from '../server/store.mjs'
import {scheduleBackups} from '../server/backups.mjs'

const root=join(dirname(fileURLToPath(import.meta.url)),'..'),SCHEME='space',ORIGIN=`${SCHEME}://app`
app.setName('SPACE Tasks')
protocol.registerSchemesAsPrivileged([{scheme:SCHEME,privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true,stream:true,codeCache:true}}])
if(!app.requestSingleInstanceLock())app.quit()

// Chromium keeps no cookies for custom schemes, so the shell holds the session itself in a private file.
const profile=app.getPath('userData'),sessionFile=join(profile,'session')
let session='';try{session=readFileSync(sessionFile,'utf8').trim()}catch{/* Not signed in yet. */}
function remember(setCookie){
 const pair=setCookie.split(';')[0]
 session=/Max-Age=0/i.test(setCookie)||pair.endsWith('=')?'':pair
 if(session)writeFileSync(sessionFile,session,{mode:0o600});else rmSync(sessionFile,{force:true})
}
function localApi(api){return async request=>{
 const headers=new Headers(request.headers)
 headers.set('origin',ORIGIN)
 if(session)headers.set('cookie',session);else headers.delete('cookie')
 const response=await api(new Request(request.url,{method:request.method,headers,body:['GET','HEAD'].includes(request.method)?undefined:request.body,duplex:'half'}),'desktop')
 const setCookie=response.headers.get('set-cookie');if(!setCookie)return response
 remember(setCookie)
 const clean=new Headers(response.headers);clean.delete('set-cookie')
 return new Response(response.body,{status:response.status,statusText:response.statusText,headers:clean})
}}

function openWindow(){
 const capture=process.env.SPACE_DESKTOP_SCREENSHOT
 const window=new BrowserWindow({width:1280,height:840,minWidth:360,minHeight:560,show:!capture&&!process.env.SPACE_DESKTOP_HIDDEN,paintWhenInitiallyHidden:true,backgroundColor:'#0c0f15',icon:join(root,'desktop','icons','512.png'),title:'SPACE Tasks',webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,spellcheck:false}})
 // Links to other sites open in the user's browser; the window itself never leaves the app.
 window.webContents.setWindowOpenHandler(({url})=>{if(/^https:\/\//.test(url))void shell.openExternal(url);return{action:'deny'}})
 window.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(ORIGIN+'/')){event.preventDefault();if(/^https:\/\//.test(url))void shell.openExternal(url)}})
 // The page only blocks closing when changes could not be stored; Electron would cancel silently, so ask.
 window.webContents.on('will-prevent-unload',event=>{if(dialog.showMessageBoxSync(window,{type:'warning',buttons:['Stay','Close anyway'],defaultId:0,cancelId:0,message:'Some changes could not be saved on this computer.',detail:'Check your free disk space and try again. Closing now may lose those changes.'})===1)event.preventDefault()})
 window.webContents.session.setPermissionRequestHandler((_contents,permission,callback)=>callback(permission==='clipboard-sanitized-write'))
 if(capture)window.webContents.once('did-finish-load',()=>setTimeout(async()=>{await writeFile(capture,(await window.webContents.capturePage()).toPNG());app.quit()},4000))
 void window.loadURL(ORIGIN+'/')
}

let shutdown=null
app.on('second-instance',()=>{const [window]=BrowserWindow.getAllWindows();if(window){if(window.isMinimized())window.restore();window.focus()}})
app.on('window-all-closed',()=>app.quit())
app.whenReady().then(async()=>{
 Menu.setApplicationMenu(null)
 const data=join(profile,'data');mkdirSync(data,{recursive:true,mode:0o700})
 const store=new Store(join(data,'space.sqlite')),stopBackups=scheduleBackups(store.db,join(profile,'backups'))
 // Keep 512 MB free on the user's disk for new accounts and PDF uploads; saving existing work is never refused.
 const api=localApi(createApi(store,{origins:[ORIGIN],freeSpace:()=>statfs(data).then(disk=>disk.bavail*disk.bsize),minFree:512*1024*1024}))
 const files=await createStaticHandler(join(root,'dist'),{secure:true})
 protocol.handle(SCHEME,request=>new URL(request.url).pathname.startsWith('/api/')?api(request):files(request))
 // Wait for a running backup and close SQLite cleanly before the process exits.
 shutdown=async()=>{await stopBackups();store.close()}
 openWindow()
})
app.on('will-quit',event=>{if(!shutdown)return;event.preventDefault();const done=shutdown;shutdown=null;void done().finally(()=>app.exit(0))})
