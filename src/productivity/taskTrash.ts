import type {Task} from './model.ts'
import {loadTasks,persistTasks,TASK_KEY} from './taskStorage.ts'
export const TRASH_KEY='orbit:trash:tasks:v1'
type StoragePort=Pick<Storage,'getItem'|'setItem'>
export function trashedTasks(storage:Pick<Storage,'getItem'>){return loadTasks({getItem:key=>key===TASK_KEY?storage.getItem(TRASH_KEY):null})}
function persistTrash(storage:StoragePort,tasks:Task[]){const mapped=(key:string)=>key===TASK_KEY?TRASH_KEY:'orbit:recovery:task-trash:v1';persistTasks({getItem:key=>storage.getItem(mapped(key)),setItem:(key,value)=>storage.setItem(mapped(key),value)},tasks)}
/** Save the recovery copy first. A crash between writes can duplicate a task,
 * but cannot remove its last copy. IDs and reward ledgers are retained. */
export function archiveTask(storage:StoragePort,tasks:Task[],id:string){const task=tasks.find(item=>item.id===id);if(!task)return tasks;persistTrash(storage,[task,...trashedTasks(storage).filter(item=>item.id!==id)]);const next=tasks.filter(item=>item.id!==id);persistTasks(storage,next);return next}
export function restoreTask(storage:StoragePort,tasks:Task[],id:string){const trash=trashedTasks(storage),task=trash.find(item=>item.id===id);if(!task)return tasks;const next=tasks.some(item=>item.id===id)?tasks:[task,...tasks];persistTasks(storage,next);persistTrash(storage,trash.filter(item=>item.id!==id));return next}
