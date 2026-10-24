import {createHash} from 'node:crypto'
import {createReadStream} from 'node:fs'
import {readFile,realpath,stat} from 'node:fs/promises'
import {resolve,extname,sep} from 'node:path'
import {Readable} from 'node:stream'
const TYPES={'.txt':'text/plain; charset=utf-8','.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.mjs':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.wav':'audio/wav','.mp3':'audio/mpeg','.ogg':'audio/ogg','.flac':'audio/flac','.pdf':'application/pdf','.json':'application/json','.wasm':'application/wasm','.woff2':'font/woff2','.ico':'image/x-icon'}
export const BASE_HEADERS={'X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin','X-Frame-Options':'DENY','Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=()'}
export const PDF_POLICY="sandbox; default-src 'none'; base-uri 'none'; frame-ancestors 'none'"
function encodings(header){const weights=new Map();for(const item of (header||'').split(',')){const[name,...parameters]=item.trim().toLowerCase().split(';'),q=parameters.find(p=>p.trim().startsWith('q='));const value=q?Number(q.trim().slice(2)):1;if(name)weights.set(name,Number.isFinite(value)&&value>=0&&value<=1?value:0)}return['br','gzip'].map(name=>({name,q:weights.get(name)??weights.get('*')??0})).filter(item=>item.q>0).sort((a,b)=>b.q-a.q).map(item=>item.name)}
// Runtimes are served from /vendor (scripts/vendor.mjs), so no script comes from a CDN.
// Only model data is downloaded; huggingface.co redirects to its storage hosts and CSP checks only the host after a redirect.
const MODEL_SOURCES=['https://huggingface.co/Xenova/','https://huggingface.co/mlc-ai/','https://*.huggingface.co','https://*.hf.co','https://raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs/','https://tessdata.projectnaptha.com/4.0.0/']
export function contentSecurityPolicy(html){const hashes=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].filter(match=>match[1].trim()).map(match=>`'sha256-${createHash('sha256').update(match[1]).digest('base64')}'`);return[
 "default-src 'self'",
 `script-src 'self' 'wasm-unsafe-eval' ${hashes.join(' ')}`,
 "style-src 'self' 'unsafe-inline'",
 "font-src 'self'",
 "img-src 'self' data: blob:",
 "media-src 'self' blob:",
 `connect-src 'self' blob: ${MODEL_SOURCES.join(' ')}`,
 "worker-src 'self' blob:",
 "object-src 'none'", "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'",
 ].join('; ')}
export async function createStaticHandler(directory,{secure=false}={}){
 const root=await realpath(directory),index=resolve(root,'index.html'),policy=contentSecurityPolicy(await readFile(index,'utf8'))
 return async request=>{
  const headers={...BASE_HEADERS,'Content-Security-Policy':policy,'Cache-Control':'no-cache',...(secure?{'Strict-Transport-Security':'max-age=31536000'}:{})},answer=(message,status)=>new Response(request.method==='HEAD'?null:message,{status,headers:{...headers,'Content-Type':'text/plain; charset=utf-8'}})
  if(!['GET','HEAD'].includes(request.method))return answer('Method not allowed',405)
  let pathname;try{pathname=decodeURIComponent(new URL(request.url).pathname);if(pathname.includes('\0'))return answer('Invalid path',400)}catch{return answer('Invalid path',400)}
  let path=resolve(root,'.'+pathname);if(path!==root&&!path.startsWith(root+sep))return answer('Forbidden',403)
  let info;try{if(path===root)path=index;path=await realpath(path);if(!path.startsWith(root+sep))return answer('Forbidden',403);info=await stat(path);if(!info.isFile())return answer('Not found',404)}catch{if(!extname(pathname)&&request.headers.get('accept')?.includes('text/html')){path=index;info=await stat(index)}else return answer('Not found',404)}
  const extension=extname(path).toLowerCase();headers['Content-Type']=TYPES[extension]||'application/octet-stream'
  if(extension==='.pdf')headers['Content-Security-Policy']=PDF_POLICY
  if(path.startsWith(resolve(root,'assets')+sep))headers['Cache-Control']='public, max-age=31536000, immutable'
  if(['.js','.css','.html','.svg','.json','.txt'].includes(extension)){headers.Vary='Accept-Encoding';for(const encoding of encodings(request.headers.get('accept-encoding'))){try{const compressed=await realpath(path+(encoding==='br'?'.br':'.gz'));if(!compressed.startsWith(root+sep))continue;const candidate=await stat(compressed);if(!candidate.isFile())continue;path=compressed;info=candidate;headers['Content-Encoding']=encoding;break}catch{/* Uncompressed files remain usable without a build compressor. */}}}
  headers['Content-Length']=String(info.size)
  return new Response(request.method==='HEAD'?null:Readable.toWeb(createReadStream(path)),{headers})
 }
}
