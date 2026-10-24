import {useState} from 'react'
import {ArrowDownRight,ArrowUpRight,Minus,Activity,CheckCheck,Clock3,AlertCircle} from 'lucide-react'
import {t,LANGUAGES} from '../i18n'
import type {Language} from '../i18n'
import type {Metrics,Sample} from './metrics.ts'
export function StatisticsPanel({metrics,history,language,compact=false}:{metrics:Metrics;history:Sample[];language:Language;compact?:boolean}){
 const [selected,setSelected]=useState<number|null>(null),T=(key:string)=>t(language,key)
 const points=history.slice(-40),change=points.length>1?points.at(-1)!.score-points.at(-2)!.score:0,Trend=change>0?ArrowUpRight:change<0?ArrowDownRight:Minus
 const locale=LANGUAGES.find(l=>l.code===language)?.locale||language
 const active=selected!==null?points[selected]:points.at(-1),w=800,h=230,pad=27
 const x=(i:number)=>points.length>1?pad+i*(w-pad*2)/(points.length-1):w/2,y=(value:number)=>h-pad-value/100*(h-pad*2)
 const line=points.map((p,i)=>`${i===0?'M':'L'}${x(i)},${y(p.score)}`).join(' ')
 return <section className={`statistics-panel ${compact?'statistics-panel--compact':''}`}>
  <header className="section-heading"><div><span className="section-kicker">{T('Live overview')}</span><h2>{T('Your productivity')}</h2></div><span className={`trend-pill trend-${change>0?'up':change<0?'down':'neutral'}`}><Trend size={17}/>{change>0?'+':''}{change} {T('points')}</span></header>
  <div className="productivity-score"><strong>{metrics.score}<small>/100</small></strong><span><i/>{T('Updates when your tasks change')}</span></div>
  <figure className="live-chart"><svg viewBox={`0 0 ${w} ${h}`} role="group" aria-label={T('Live productivity chart')}>
   <defs><linearGradient id={compact?'score-fill-mini':'score-fill'} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".2"/><stop offset="100%" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs>
   {[0,25,50,75,100].map(v=><g key={v}><line x1={pad} x2={w-pad} y1={y(v)} y2={y(v)} className="chart-grid"/><text x="0" y={y(v)+4}>{v}</text></g>)}
   {points.length>1&&<path d={`${line} L${x(points.length-1)},${h-pad} L${x(0)},${h-pad}Z`} fill={`url(#${compact?'score-fill-mini':'score-fill'})`}/>}
   {points.length>1&&<path d={line} fill="none" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>}
   {points.map((p,i)=><g key={`${p.at}-${i}`} tabIndex={0} role="button" aria-label={`${new Intl.DateTimeFormat(locale,{hour:'2-digit',minute:'2-digit'}).format(p.at)}: ${p.score}/100`} onFocus={()=>setSelected(i)} onBlur={()=>setSelected(null)} onClick={()=>setSelected(i)} onKeyDown={event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();setSelected(i)}}} onMouseEnter={()=>setSelected(i)} onMouseLeave={()=>setSelected(null)}><circle cx={x(i)} cy={y(p.score)} r="14" fill="transparent"/><circle cx={x(i)} cy={y(p.score)} r={i===(selected??points.length-1)?5:3} fill="currentColor"/></g>)}
  </svg><figcaption>{active?<><span>{new Intl.DateTimeFormat(locale,{month:'short',day:'numeric',hour:'2-digit',minute:'2-digit'}).format(active.at)}</span><strong>{active.score}/100 · {active.completed} {T('completed tasks')}</strong></>:T('Your history starts with your first recorded activity.')}</figcaption></figure>
  <p className="chart-explanation">{T('Completed tasks raise the score. Pending tasks past their due date lower it. No activity is invented.')}</p>
  {!compact&&<div className="statistics-metrics">{[{title:'Completed',value:metrics.completed,Icon:CheckCheck},{title:'In progress',value:metrics.active,Icon:Activity},{title:'Pending',value:metrics.pending,Icon:Clock3},{title:'Overdue',value:metrics.overdue,Icon:AlertCircle}].map(({title,value,Icon})=><article key={title}><Icon size={20}/><strong>{value}</strong><span>{T(title)}</span></article>)}</div>}
 </section>
}
