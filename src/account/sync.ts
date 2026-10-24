import {snapshot,syncMeta,saveSyncMeta} from './storage.ts'
import type {WorkspaceDocument} from './storage.ts'
/** Drain edits made while a request was in flight before reporting 'saved'.
 * Metadata advances only after the server acknowledges a committed revision. */
export async function drainPending(id:string,current:()=>boolean,save:(revision:number,data:WorkspaceDocument)=>Promise<{revision:number}>,flush:()=>boolean=()=>true){
 while(current()){
  if(!flush())throw new Error('Changes could not be saved. Check your browser storage.')
  if(!syncMeta(id).dirty)return true
  const sent=snapshot(id),result=await save(syncMeta(id).revision,sent);if(!current())return false
  // A visible edit can fail to reach localStorage while this PUT is in flight.
  // Advance the acknowledged revision but keep it pending until live state saves.
  const flushed=flush(),dirty=!flushed||JSON.stringify(sent)!==JSON.stringify(snapshot(id))
  saveSyncMeta(id,{revision:result.revision,dirty})
  if(!flushed)throw new Error('Changes could not be saved. Check your browser storage.')
 }
 return false
}
