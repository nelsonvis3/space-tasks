import {BookOpen,ArrowUpRight} from 'lucide-react'
import {t} from '../i18n'
import type {Language} from '../i18n'
import {verseForDate} from './verses.ts'
export function DailyVerse({date,language}:{date:string;language:Language}){
 const v=verseForDate(date),T=(key:string)=>t(language,key)
 return <section className="daily-verse"><div><BookOpen size={17}/><span>{T('A thought for this day')}</span></div><blockquote>{language==='es'?v.text:T(v.adaptation)}</blockquote><footer><span>{T(v.reference)}<small>{T(language==='es'?'Reina-Valera 1909 · public domain':'Verse adaptation · source: RV1909')}</small></span><a href={v.url} target="_blank" rel="noreferrer" aria-label={T('Read the source')}><ArrowUpRight size={17}/></a></footer></section>
}
