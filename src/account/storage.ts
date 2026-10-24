let account:string|null=null
export const STORAGE_EVENT='space-storage-change'
export function activeAccount(){return account}
export function setStorageAccount(id:string|null){account=id}
export type WorkspaceDocument=Record<string,string>
export const isAppKey=(key:string)=>/^(orbit[:\-]|orbit-tasks:)/.test(key)
export function snapshot(id:string|null=account):WorkspaceDocument{const p=id?`space:user:${id}:`:'',out:WorkspaceDocument={};for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i)!;if(key.startsWith(p)&&isAppKey(key.slice(p.length)))out[key.slice(p.length)]=localStorage.getItem(key)!}return out}
export function syncMeta(id:string):{revision:number;dirty:boolean}{try{const v=JSON.parse(localStorage.getItem(`space:sync:${id}`)||'null');return v&&Number.isSafeInteger(v.revision)&&v.revision>=0&&typeof v.dirty==='boolean'?v:{revision:0,dirty:Object.keys(snapshot(id)).length>0}}catch{return{revision:0,dirty:Object.keys(snapshot(id)).length>0}}}
export function saveSyncMeta(id:string,value:{revision:number;dirty:boolean}){localStorage.setItem(`space:sync:${id}`,JSON.stringify(value))}
export const FLUSH_EVENT='space-flush-storage'
export function capturePending(){const detail={failed:false,data:{} as WorkspaceDocument};window.dispatchEvent(new CustomEvent(FLUSH_EVENT,{detail}));return detail}
export function flushPending(){return !capturePending().failed}
function dirty(id:string|null){if(id)saveSyncMeta(id,{...syncMeta(id),dirty:true})}
function changed(id:string|null){if(id)window.dispatchEvent(new CustomEvent(STORAGE_EVENT,{detail:{account:id}}))}
/** A captured store keeps unmount/pagehide handlers bound to their original user. */
export function scopedStorage(id:string|null=account){const p=id?`space:user:${id}:`:'';return{getItem(key:string){return localStorage.getItem(p+key)},setItem(key:string,value:string){if(localStorage.getItem(p+key)===value)return;dirty(id);localStorage.setItem(p+key,value);changed(id)},removeItem(key:string){if(localStorage.getItem(p+key)===null)return;dirty(id);localStorage.removeItem(p+key);changed(id)}}}
export const appStorage={getItem(key:string){return scopedStorage().getItem(key)},setItem(key:string,value:string){scopedStorage().setItem(key,value)},removeItem(key:string){scopedStorage().removeItem(key)}}

/** After a synchronized sign-out the server holds everything, so the next person on this browser finds nothing of the account. */
export function clearLocalAccount(id:string){const p=`space:user:${id}:`,keys:string[]=[];for(let i=0;i<localStorage.length;i++){const key=localStorage.key(i)!;if(key.startsWith(p))keys.push(key)}for(const key of [...keys,`space:sync:${id}`,`space:backup:${id}`])localStorage.removeItem(key)}
export function backupLocal(id:string,data:WorkspaceDocument){localStorage.setItem(`space:backup:${id}`,JSON.stringify({at:Date.now(),data}))}
export function applyDocument(id:string,data:WorkspaceDocument){const p=`space:user:${id}:`,old=snapshot(id),incoming=Object.fromEntries(Object.entries(data).filter(([key,value])=>isAppKey(key)&&typeof value==='string'));if(JSON.stringify(old)===JSON.stringify(incoming))return;if(Object.keys(old).length)backupLocal(id,old);const touched=new Set<string>();try{for(const[key,value]of Object.entries(incoming)){touched.add(key);localStorage.setItem(p+key,value)}for(const key of Object.keys(old))if(!(key in incoming)){touched.add(key);localStorage.removeItem(p+key)}}catch(error){for(const key of touched)localStorage.removeItem(p+key);for(const key of touched)if(key in old)localStorage.setItem(p+key,old[key]);throw error}}
