/** Songs the user adds stay in this browser only (IndexedDB): SPACE Tasks never uploads or hosts them. */
const DATABASE='space-music',STORE='songs',SAVE_ERROR='Changes could not be saved. Check your browser storage.'
export const MAX_SONG_BYTES=100*1024*1024
export const INVALID_SONG='Choose an audio file smaller than 100 MB.'
export type Song={id:string;owner:string;name:string;size:number;addedAt:number;file:Blob}
// Some systems report no MIME type for FLAC or Opus, so the extension also counts.
export function acceptsSong(file:{name:string;type:string;size:number}){return file.size>0&&file.size<=MAX_SONG_BYTES&&(file.type.startsWith('audio/')||/\.(mp3|m4a|aac|ogg|oga|opus|wav|flac|weba)$/i.test(file.name))}
export function songName(fileName:string){return fileName.replace(/\.[^.]+$/,'').replace(/[\x00-\x1f\x7f]/g,'').trim().slice(0,120)||'Song'}
function openDatabase():Promise<IDBDatabase>{return new Promise((resolve,reject)=>{const request=indexedDB.open(DATABASE,1);request.onupgradeneeded=()=>{request.result.createObjectStore(STORE,{keyPath:'id'}).createIndex('owner','owner')};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(new Error(SAVE_ERROR))})}
async function run<T>(mode:IDBTransactionMode,work:(store:IDBObjectStore)=>IDBRequest<T>|void):Promise<T|undefined>{const db=await openDatabase();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,mode),request=work(tx.objectStore(STORE));tx.oncomplete=()=>{db.close();resolve(request?request.result:undefined)};tx.onabort=tx.onerror=()=>{db.close();reject(new Error(SAVE_ERROR))}})}
export async function listSongs(owner:string):Promise<Song[]>{return((await run('readonly',store=>store.index('owner').getAll(owner)))as Song[]||[]).sort((a,b)=>a.addedAt-b.addedAt)}
export async function addSong(owner:string,file:File):Promise<Song>{if(!acceptsSong(file))throw new Error(INVALID_SONG);const song:Song={id:crypto.randomUUID(),owner,name:songName(file.name),size:file.size,addedAt:Date.now(),file};await run('readwrite',store=>{store.put(song)});return song}
export async function removeSong(owner:string,id:string){await run('readwrite',store=>{const request=store.get(id);request.onsuccess=()=>{if((request.result as Song|undefined)?.owner===owner)store.delete(id)}})}
export async function clearSongs(owner:string){await run('readwrite',store=>{const request=store.index('owner').getAllKeys(owner);request.onsuccess=()=>{for(const key of request.result)store.delete(key)}})}
