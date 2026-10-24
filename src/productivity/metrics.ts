import type {Task} from './model.ts'
import {localDate} from './model.ts'
export type Metrics={total:number;completed:number;active:number;pending:number;overdue:number;completion:number;score:number}
export type Sample=Metrics&{at:number;scope:string}
export const HISTORY_KEY='orbit:productivity:history:v1'
export function metricsFor(tasks:Task[],today=localDate()):Metrics{
 const total=tasks.length,completed=tasks.filter(t=>t.status==='done').length,active=tasks.filter(t=>t.status==='in-progress').length,pending=total-completed
 const overdue=tasks.filter(t=>t.status!=='done'&&t.dueDate<today).length,completion=total?Math.round(completed/total*100):0
 // A missed deadline reduces the score. Merely viewing another page never does.
 const score=total?Math.max(0,Math.round((completed/total*100)-(overdue/total*25))):0
 return{total,completed,active,pending,overdue,completion,score}
}
export function recordSample(history:Sample[],metrics:Metrics,scope:string,at=Date.now()):Sample[]{
 const previous=[...history].reverse().find(s=>s.scope===scope)
 if(previous&&Object.keys(metrics).every(k=>previous[k as keyof Metrics]===metrics[k as keyof Metrics]))return history
 return [...history,{...metrics,scope,at}].slice(-600)
}
export function isHistory(data:unknown):data is Sample[]{
 return Array.isArray(data)&&data.length<=600&&data.every(s=>s&&typeof s.scope==='string'&&Number.isFinite(s.at)&&s.at>0&&Number.isFinite(new Date(s.at).getTime())&&['total','completed','active','pending','overdue','completion','score'].every(k=>Number.isSafeInteger(s[k])&&s[k]>=0)&&s.score<=100&&s.completion<=100&&s.completed+s.pending===s.total)
}
export function trend(history:Sample[],scope:string){const points=history.filter(s=>s.scope===scope);return points.length>1?points.at(-1)!.score-points.at(-2)!.score:0}
