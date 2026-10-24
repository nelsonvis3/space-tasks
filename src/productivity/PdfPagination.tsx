import {useId} from 'react'
import {ChevronLeft,ChevronRight} from 'lucide-react'
import {t} from '../i18n'
import type {Language} from '../i18n'
export function PdfPagination({page,total,onChange,language}:{page:number;total:number;onChange:(page:number)=>void;language:Language}){
 const id=useId(),T=(key:string)=>t(language,key)
 return <nav className="pdf-pagination" aria-label={T('PDF page navigation')}>
  <button type="button" className="pdf-page-button pdf-page-previous" disabled={!total||page<=1} onClick={()=>onChange(page-1)}><ChevronLeft size={20}/><span>{T('Previous page')}</span></button>
  <div className="pdf-page-counter"><label htmlFor={id}>{T('Page')}</label><input id={id} type="number" inputMode="numeric" min={1} max={total||1} disabled={!total} value={page} onChange={event=>{const next=Number(event.target.value);if(Number.isInteger(next)&&next>=1&&next<=total)onChange(next)}}/><span>{T('of')} <strong>{total||'…'}</strong></span></div>
  <button type="button" className="pdf-page-button pdf-page-next" disabled={!total||page>=total} onClick={()=>onChange(page+1)}><span>{T('Next page')}</span><ChevronRight size={20}/></button>
 </nav>
}
