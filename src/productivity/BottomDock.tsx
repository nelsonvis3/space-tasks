import {useLayoutEffect,useRef,useState} from 'react'
import type {CSSProperties} from 'react'
import {House,Columns3,CalendarDays,ChartNoAxesCombined,BookOpen,MessagesSquare,Headphones,SlidersHorizontal,ChevronUp,Target,BriefcaseBusiness,Layers,ListTodo,Sparkles,Compass,Clock3,Folder,Heart,GraduationCap,Music} from 'lucide-react'
import type {Language} from '../i18n'
import {t} from '../i18n'
import type {View} from './model.ts'
import {contrast} from './palette'
import {hexRgba} from './dockSettings'
import type {DockSettings,Glyph} from './dockSettings'
export {DEFAULT_DOCK,normalizeDock} from './dockSettings'
export type {DockSettings} from './dockSettings'
import './customization.css'
export const GLYPH_ICONS={home:House,tasks:Columns3,calendar:CalendarDays,chart:ChartNoAxesCombined,book:BookOpen,chat:MessagesSquare,music:Music,target:Target,briefcase:BriefcaseBusiness,layers:Layers,list:ListTodo,sparkles:Sparkles,headphones:Headphones,compass:Compass,clock:Clock3,folder:Folder,heart:Heart,graduation:GraduationCap} satisfies Record<Glyph,typeof House>
export const NAVIGATION=[{id:'overview',label:'Productivity room'},{id:'board',label:'Tasks'},{id:'calendar',label:'Calendar'},{id:'statistics',label:'Statistics room'},{id:'guide',label:'Study and activities'},{id:'assistant',label:'Assistant'},{id:'music',label:'Music'}] as const
export function BottomDock({view,onNavigate,settings,onSettings,language,preview=false}:{view:View;onNavigate:(view:View)=>void;settings:DockSettings;onSettings:()=>void;language:Language;preview?:boolean}){
 const [open,setOpen]=useState(false),T=(key:string)=>t(language,key),vertical=['left','right'].includes(settings.position),visible=settings.items.filter(i=>i.visible)
 const region=useRef<HTMLDivElement>(null)
 useLayoutEffect(()=>{if(preview||!region.current)return;const node=region.current;const update=()=>{const rect=node.getBoundingClientRect(),viewport=vertical?window.innerHeight:window.innerWidth,span=vertical?rect.height:rect.width,root=node.closest<HTMLElement>('.space-app'),header=root?.querySelector('.space-topbar')?.getBoundingClientRect().bottom||83,min=(vertical?Math.max(12,header+12):10)+span/2,max=viewport-10-span/2;root?.style.setProperty('--dock-header-end',`${header+12}px`);root?.style.setProperty('--dock-extent',`${vertical?rect.width:rect.height}px`);node.style.setProperty('--dock-anchor',`${Math.min(Math.max(viewport*settings.offset/100,min),Math.max(min,max))}px`)};const observer=new ResizeObserver(update);observer.observe(node);window.addEventListener('resize',update);update();return()=>{observer.disconnect();window.removeEventListener('resize',update)}},[preview,vertical,settings.offset,settings.position])
 const vars={'--dock-size':`${settings.style==='compact'?Math.min(settings.size,36):settings.size}px`,'--dock-gap':`${settings.gap}px`,'--dock-offset':`${settings.offset}%`,'--dock-bg':hexRgba(settings.background,settings.opacity/100),'--dock-blur':`${settings.blur}px`,'--dock-radius':`${settings.radius}px`,'--dock-scale':1+settings.magnify/100,'--dock-count':visible.length+1} as CSSProperties
 return <div ref={region} style={vars} className={`dock-region dock-position-${settings.position} dock-style-${settings.style} dock-labels-${settings.labels} dock-indicator-${settings.indicator} dock-shape-${settings.shape} ${vertical?'dock-vertical':''} ${settings.autoHide&&!preview?'dock-autohide':''} ${open?'dock-open':''} ${preview?'dock-preview':''}`}>
  {settings.autoHide&&!preview&&<button type="button" className="dock-reveal" aria-label={T(open?'Hide navigation':'Show navigation')} aria-expanded={open} onClick={()=>setOpen(s=>!s)}><ChevronUp size={16}/></button>}
  <nav className="bottom-dock" aria-label={T(preview?'Dock preview':'Main navigation')}>
   {visible.map(item=>{const label=NAVIGATION.find(n=>n.id===item.id)!.label,Icon=GLYPH_ICONS[item.glyph],active=view===item.id||(item.id==='board'&&view==='completed');return <button key={item.id} type="button" className={`dock-item ${active?'active':''}`} aria-label={T(label)} aria-current={active?'page':undefined} onClick={()=>{onNavigate(item.id);setOpen(false)}}><span className="dock-icon" style={{color:contrast(item.color,'#ffffff')>=3?'#ffffff':'#102338',background:`linear-gradient(145deg,${item.color},color-mix(in srgb,${item.color},#101b3a 25%))`}}>{item.image?<img src={item.image} alt=""/>:<Icon size={24} strokeWidth={1.9}/>}</span><span className="dock-tooltip">{T(label)}</span><i/></button>})}
   <span className="dock-separator"/>
   <button type="button" className="dock-item" aria-label={T('Dock settings')} onClick={onSettings}><span className="dock-icon dock-icon-settings"><SlidersHorizontal size={23}/></span><span className="dock-tooltip">{T('Dock settings')}</span><i/></button>
  </nav>
 </div>
}
