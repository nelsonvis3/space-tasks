// SPACE Tasks desktop shell: serves the built interface from a private app:// origin and forwards
// /api/ to the published SPACE Tasks server, so desktop accounts are the same as on the web.
import {app,BrowserWindow,Menu,net,protocol,shell} from 'electron'
import {writeFile} from 'node:fs/promises'
import {dirname,join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createStaticHandler} from '../server/static.mjs'

const root=join(dirname(fileURLToPath(import.meta.url)),'..'),SCHEME='space',ORIGIN=`${SCHEME}://app`
// shortcut: no server is published yet, so desktop runs in device mode; set the HTTPS address here (or SPACE_SERVER_URL) once the web is live.
const DEFAULT_SERVER=''
const server=(process.env.SPACE_SERVER_URL??DEFAULT_SERVER).replace(/\/+$/,'')
if(server&&!/^https:\/\/[^/]+$/.test(server)&&!/^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(server))throw new Error('SPACE_SERVER_URL must be an HTTPS origin (or a local http://127.0.0.1 server for testing).')

app.setName('SPACE Tasks')
protocol.registerSchemesAsPrivileged([{scheme:SCHEME,privileges:{standard:true,secure:true,supportFetchAPI:true,corsEnabled:true,stream:true,codeCache:true}}])
if(!app.requestSingleInstanceLock())app.quit()

const unavailable=()=>new Response(JSON.stringify({error:'The server is unavailable. Your local changes are kept on this device.'}),{status:503,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})
async function forward(request,url){
 if(!server)return unavailable()
 const headers=new Headers(request.headers)
 // The server only accepts writes from its own origin; this shell is a first-party client of it.
 headers.set('origin',server)
 try{return await net.fetch(server+url.pathname+url.search,{method:request.method,headers,body:['GET','HEAD'].includes(request.method)?undefined:request.body,duplex:'half',credentials:'include',redirect:'manual'})}
 catch{return unavailable()}
}

function openWindow(){
 const capture=process.env.SPACE_DESKTOP_SCREENSHOT
 const window=new BrowserWindow({width:1280,height:840,minWidth:360,minHeight:560,show:!capture,paintWhenInitiallyHidden:true,backgroundColor:'#0c0f15',icon:join(root,'desktop','icons','512.png'),title:'SPACE Tasks',webPreferences:{sandbox:true,contextIsolation:true,nodeIntegration:false,spellcheck:false}})
 // Links to other sites open in the user's browser; the window itself never leaves the app.
 window.webContents.setWindowOpenHandler(({url})=>{if(/^https:\/\//.test(url))void shell.openExternal(url);return{action:'deny'}})
 window.webContents.on('will-navigate',(event,url)=>{if(!url.startsWith(ORIGIN+'/')){event.preventDefault();if(/^https:\/\//.test(url))void shell.openExternal(url)}})
 window.webContents.session.setPermissionRequestHandler((_contents,permission,callback)=>callback(permission==='clipboard-sanitized-write'))
 if(capture)window.webContents.once('did-finish-load',()=>setTimeout(async()=>{await writeFile(capture,(await window.webContents.capturePage()).toPNG());app.quit()},4000))
 void window.loadURL(ORIGIN+'/')
}

app.on('second-instance',()=>{const [window]=BrowserWindow.getAllWindows();if(window){if(window.isMinimized())window.restore();window.focus()}})
app.on('window-all-closed',()=>app.quit())
app.whenReady().then(async()=>{
 Menu.setApplicationMenu(null)
 const files=await createStaticHandler(join(root,'dist'),{secure:true})
 protocol.handle(SCHEME,request=>{const url=new URL(request.url);return url.pathname.startsWith('/api/')?forward(request,url):files(request)})
 openWindow()
})
