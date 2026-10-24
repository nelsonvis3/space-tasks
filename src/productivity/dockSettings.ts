export const DOCK_IDS=['overview','board','calendar','statistics','guide','assistant','music'] as const
export type DockId=typeof DOCK_IDS[number]
export const GLYPHS=['home','tasks','calendar','chart','book','chat','music','target','briefcase','layers','list','sparkles','headphones','compass','clock','folder','heart','graduation'] as const
export type Glyph=typeof GLYPHS[number]
export type DockItem={id:DockId;glyph:Glyph;color:string;visible:boolean;image?:string}
export type DockSettings={autoHide:boolean;style:'floating'|'full'|'compact';position:'bottom'|'top'|'left'|'right';size:number;gap:number;offset:number;opacity:number;blur:number;radius:number;magnify:number;background:string;labels:'hover'|'always'|'none';indicator:'dot'|'line'|'none';shape:'rounded'|'circle'|'square';items:DockItem[]}
const COLORS=['#2688ff','#9361ee','#ed546d','#17b987','#ef9c32','#5374f5','#de58ba']
const ICONS:Glyph[]=['home','tasks','calendar','chart','book','chat','headphones']
export const DEFAULT_DOCK:DockSettings={autoHide:false,style:'floating',position:'bottom',size:44,gap:6,offset:50,opacity:86,blur:22,radius:20,magnify:18,background:'#243448',labels:'hover',indicator:'dot',shape:'rounded',items:DOCK_IDS.map((id,i)=>({id,glyph:ICONS[i],color:COLORS[i],visible:true}))}
export function isHex(value:unknown):value is string{return typeof value==='string'&&/^#[0-9a-f]{6}$/i.test(value)}
function number(value:unknown,fallback:number,min:number,max:number){return typeof value==='number'&&Number.isFinite(value)?Math.round(Math.min(max,Math.max(min,value))):fallback}
export function normalizeDock(value:unknown):DockSettings{
 const v=value&&typeof value==='object'?value as Partial<DockSettings>:{},d=DEFAULT_DOCK
 const choice=<T extends string>(value:unknown,values:readonly T[],fallback:T):T=>values.includes(value as T)?value as T:fallback
 const source=Array.isArray(v.items)?v.items:[],seen=new Set<string>(),items:DockItem[]=[]
 for(const raw of [...source,...d.items]){if(!raw||!DOCK_IDS.includes(raw.id)||seen.has(raw.id))continue;seen.add(raw.id);const def=d.items.find(i=>i.id===raw.id)!
  items.push({id:raw.id,glyph:choice(raw.glyph,GLYPHS,def.glyph),color:isHex(raw.color)?raw.color:def.color,visible:typeof raw.visible==='boolean'?raw.visible:true,...(typeof raw.image==='string'&&raw.image.length<=180000&&/^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(raw.image)?{image:raw.image}:{})})
 }
 return {autoHide:typeof v.autoHide==='boolean'?v.autoHide:d.autoHide,style:choice(v.style,['floating','full','compact'],d.style),position:choice(v.position,['bottom','top','left','right'],d.position),size:number(v.size,d.size,28,72),gap:number(v.gap,d.gap,0,20),offset:number(v.offset,d.offset,10,90),opacity:number(v.opacity,d.opacity,30,100),blur:number(v.blur,d.blur,0,32),radius:number(v.radius,d.radius,0,36),magnify:number(v.magnify,d.magnify,0,40),background:isHex(v.background)?v.background:d.background,labels:choice(v.labels,['hover','always','none'],d.labels),indicator:choice(v.indicator,['dot','line','none'],d.indicator),shape:choice(v.shape,['rounded','circle','square'],d.shape),items}
}
export function hexRgba(hex:string,alpha:number){return `rgba(${parseInt(hex.slice(1,3),16)},${parseInt(hex.slice(3,5),16)},${parseInt(hex.slice(5,7),16)},${alpha})`}
