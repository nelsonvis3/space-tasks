import {backup,DatabaseSync} from 'node:sqlite'
import {mkdir,writeFile,chmod,readdir,stat,statfs,unlink,rename} from 'node:fs/promises'
import {resolve} from 'node:path'
import {randomUUID} from 'node:crypto'
const DAY=86400000
async function listBackups(folder){return Promise.all((await readdir(folder)).filter(name=>/^space-[\dT-]+Z-[a-f0-9-]+\.sqlite$/.test(name)).map(async name=>({path:resolve(folder,name),at:(await stat(resolve(folder,name))).mtimeMs})))}
/** Spread copies over time so a burst of restarts can never push out every older copy:
 * the newest `recent`, plus the newest of each of the last 7 days and of each of the last 5 weeks. */
export function backupsToKeep(files,now=Date.now(),recent=2){
 const sorted=[...files].sort((a,b)=>b.at-a.at),keep=new Set(sorted.slice(0,Math.max(1,recent))),slots=new Set()
 for(const file of sorted){const age=now-file.at,slot=age<7*DAY?'d'+Math.floor(file.at/DAY):age<35*DAY?'w'+Math.floor(file.at/(7*DAY)):null;if(slot&&!slots.has(slot)){slots.add(slot);keep.add(file)}}
 return keep
}
/** Keep older backups until a new consistent SQLite copy passes integrity_check. */
export async function createBackup(db,directory,{retain=2,now=Date.now()}={}){
 const folder=resolve(directory);await mkdir(folder,{recursive:true,mode:0o700})
 // A copy needs the database size again; refusing early keeps a full disk from also breaking live saves.
 const size=db.prepare('PRAGMA page_count').get().page_count*db.prepare('PRAGMA page_size').get().page_size,disk=await statfs(folder)
 if(disk.bavail*disk.bsize<size*2)throw new Error('Not enough free disk space for a database backup.')
 const target=resolve(folder,`space-${new Date().toISOString().replace(/[:.]/g,'-')}-${randomUUID()}.sqlite`),temporary=target+'.partial'
 await writeFile(temporary,'',{flag:'wx',mode:0o600})
 try{await backup(db,temporary);await chmod(temporary,0o600);const check=new DatabaseSync(temporary);try{check.exec('PRAGMA journal_mode=DELETE');/* A WAL copy would leave -wal/-shm files beside it forever. */if(check.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw new Error('Database backup integrity check failed.')}finally{check.close()}await rename(temporary,target)}catch(error){await unlink(temporary).catch(()=>{});throw error}
 const files=await listBackups(folder),keep=backupsToKeep(files,now,retain)
 for(const file of files)if(!keep.has(file))await unlink(file.path).catch(error=>{if(error.code!=='ENOENT')throw error})
 return target
}
export function scheduleBackups(db,directory,{intervalMs=6*3600000,retain=2,onError=()=>console.error('Automatic database backup failed. Check persistent backup storage.')}={}){
 let pending=null,stopped=false
 const run=(skipIfRecent=false)=>{if(pending||stopped)return;pending=(async()=>{
  // Restarting the server must not add a copy each time when a recent one already exists.
  if(skipIfRecent&&(await listBackups(resolve(directory)).catch(()=>[])).some(file=>Date.now()-file.at<intervalMs))return
  await createBackup(db,directory,{retain})
 })().catch(onError).finally(()=>{pending=null})}
 run(true);const timer=setInterval(run,intervalMs);timer.unref()
 return async()=>{stopped=true;clearInterval(timer);await pending}
}
