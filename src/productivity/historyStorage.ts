import {HISTORY_KEY,isHistory} from './metrics.ts'
import type {Sample} from './metrics.ts'
type StoragePort=Pick<Storage,'getItem'|'setItem'>
function parse(raw:string|null):unknown{try{return JSON.parse(raw||'null')}catch{return null}}
export function loadHistory(storage:Pick<Storage,'getItem'>):Sample[]{const data=parse(storage.getItem(HISTORY_KEY));return isHistory(data)?data:[]}
export function persistHistory(storage:StoragePort,history:Sample[]){const original=storage.getItem(HISTORY_KEY);if(original&&!isHistory(parse(original)))storage.setItem('orbit:recovery:history:v1',original);storage.setItem(HISTORY_KEY,JSON.stringify(history))}
