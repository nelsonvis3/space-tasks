import type {WorkspaceDocument} from './storage.ts'
const canonical=(data:WorkspaceDocument)=>JSON.stringify(Object.entries(data).sort(([a],[b])=>a.localeCompare(b)))
/** A server recovered from an older backup must never silently replace a newer
 * clean browser copy. Equal revision with unequal data is also a conflict. */
export function chooseWorkspace(meta:{revision:number;dirty:boolean},local:WorkspaceDocument,remote:{revision:number;data:WorkspaceDocument}):'local'|'remote'|'conflict'{
 if(meta.dirty)return meta.revision===remote.revision?'local':'conflict'
 if(Object.keys(local).length&&(meta.revision>remote.revision||meta.revision===remote.revision&&canonical(local)!==canonical(remote.data)))return'conflict'
 return'remote'
}
