import {Readable} from 'node:stream'
import {pipeline} from 'node:stream/promises'
export function httpRequest(req){const base=`http://${req.headers.host||'localhost'}`;return new Request(new URL(req.url,base),{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Readable.toWeb(req),duplex:'half'})})}
export async function writeResponse(response,res){res.writeHead(response.status,Object.fromEntries(response.headers));if(response.body)await pipeline(Readable.fromWeb(response.body),res);else res.end()}
/** Rate-limit key: IPv4 as is, IPv6 grouped by /64 so rotating addresses inside one network share a limit.
 * shortcut: trustProxy reads the last X-Forwarded-For entry, so it assumes exactly one proxy in front; add a hop count if there are more. */
export function clientIp(req,trustProxy=false){
 const forwarded=trustProxy?req.headers['x-forwarded-for']?.split(',').at(-1)?.trim():''
 const ip=(forwarded||req.socket.remoteAddress||'unknown').replace(/^::ffff:/,'').replace(/%.*$/,'')
 if(!ip.includes(':'))return ip
 const[head,tail]=ip.split('::'),left=head?head.split(':'):[],right=tail?tail.split(':'):[]
 return[...left,...Array(Math.max(0,8-left.length-right.length)).fill('0'),...right].slice(0,4).join(':')+'::/64'
}
/** Shared HTTP adapter. Stream errors are propagated, never left unhandled. */
export async function handleApi(api,req,res,{trustProxy=false}={}){await writeResponse(await api(httpRequest(req),clientIp(req,trustProxy)),res)}
