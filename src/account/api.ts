import {activeAccount} from './storage'
import type {WorkspaceDocument} from './storage'
export type User={id:string;username:string}
export type DocumentResponse={revision:number;data:WorkspaceDocument}
let csrf=''
export function setCsrf(value:string){csrf=value}
export class RequestError extends Error{status:number;document?:DocumentResponse;constructor(message:string,status:number,document?:DocumentResponse){super(message);this.status=status;this.document=document}}
export async function api<T>(path:string,options:RequestInit={},expectedAccount:string|null=activeAccount()):Promise<T>{
 let response:Response
 try{response=await fetch(path,{...options,credentials:'same-origin',signal:options.signal||AbortSignal.timeout(45000),headers:{...(expectedAccount?{'X-Space-Account':expectedAccount}:{}),...(options.body&&typeof options.body==='string'?{'Content-Type':'application/json'}:{}),...(options.method&&options.method!=='GET'?{'X-CSRF-Token':csrf}:{}),...options.headers}})}catch{throw new RequestError('The server is unavailable. Your local changes are kept on this device.',0)}
 if(!response.ok){let body;try{body=await response.json()}catch{body={error:'The server could not complete the request.'}}throw new RequestError(body.error||'The server could not complete the request.',response.status,body.document)}
 return await response.json() as T
}
