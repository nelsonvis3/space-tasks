import {appStorage} from '../account/storage.ts'
import type {Priority} from '../gamification.ts'
export type Status='todo'|'in-progress'|'done'
export type Task={id:string;title:string;description:string;status:Status;priority:Priority;workspaceId:string;dueDate:string;createdAt?:number;completedAt?:number}
export type Workspace={id:string;name:string;emoji:string;color:string}
export type View='overview'|'board'|'calendar'|'statistics'|'guide'|'assistant'|'music'|'completed'
export const STATUS:Status[]=['todo','in-progress','done']
export const STATUS_NAMES:Record<Status,string>={todo:'To do','in-progress':'In progress',done:'Done'}
export const PRIORITIES:Priority[]=['Low','Medium','High']
export function localDate(date=new Date()){return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`}
export function readJson(key:string):unknown{try{return JSON.parse(appStorage.getItem(key)||'null')}catch{return null}}
export function savedText(key:string,fallback:string){try{return appStorage.getItem(key)||fallback}catch{return fallback}}
export function makeId(){return crypto.randomUUID()}
