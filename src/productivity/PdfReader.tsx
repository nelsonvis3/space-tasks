import {detectedLanguage} from './translation'
import {readSourceChoice,saveSourceChoice} from './readingPreferences'
import type {SourceChoice} from './readingPreferences'
import {PdfPagination} from './PdfPagination'
import {useEffect,useRef,useState} from 'react'
import {ArrowLeft,Languages,Download,Square,FileText,BookOpen,ScanText,RotateCw,RefreshCw} from 'lucide-react'
import {t,LANGUAGES} from '../i18n'
import type {Language} from '../i18n'
import {bookUrl} from './library'
import type {LocalBook} from './library'
import {loadPdf} from './pdfjs'
import type {PdfDocument,PdfLoading,RenderTask,PdfOutline} from './pdfjs'
import {cleanPdfText,extractionQuality,pageText,reflowParagraph} from './pdfText'
import type {ReadingOrder} from './pdfText'
import {pdfError} from './pdfErrors'
import {recognizePage} from './ocr'
import {usePageTranslation} from './usePageTranslation'
import {boundedPageScale} from './renderBudget'
import './reader.css'
type Extracted={page:number;text:string}
type OcrResult={text:string;confidence:number;language:Language}
export function PdfReader({book,language,onClose}:{book:LocalBook;language:Language;onClose:()=>void}){
 const T=(key:string)=>t(language,key)
 const [url,setUrl]=useState(''),[document,setDocument]=useState<PdfDocument|null>(null),[pagesText,setPagesText]=useState<string[]|null>(null),[pdfRequested,setPdfRequested]=useState(!book.textUrl)
 const [format,setFormat]=useState<'text'|'pdf'>('text'),[outline,setOutline]=useState<PdfOutline[]>([]),[page,setPage]=useState(1),[extracted,setExtracted]=useState<Extracted>({page:0,text:''}),[enabled,setEnabled]=useState(false),[error,setError]=useState(''),[rendering,setRendering]=useState(true)
 const [sourceChoice,setSourceChoice]=useState<SourceChoice>(()=>readSourceChoice(book.id)),[sourceGuess,setSourceGuess]=useState<Language|null>(null),[showOriginal,setShowOriginal]=useState(false)
 const [passwordRequired,setPasswordRequired]=useState(false),[password,setPassword]=useState(''),[order,setOrder]=useState<ReadingOrder>('document'),[rotation,setRotation]=useState(0),[ocrLanguage,setOcrLanguage]=useState<Language>(language),[autoOcr,setAutoOcr]=useState(false)
 const [ocrPages,setOcrPages]=useState<Record<number,OcrResult>>({}),[ocrTarget,setOcrTarget]=useState<{page:number;language:Language;rotation:number;sequence:number;translate:boolean}|null>(null),[ocrBusy,setOcrBusy]=useState(false),[ocrProgress,setOcrProgress]=useState(0)
 const root=useRef<HTMLElement>(null),canvas=useRef<HTMLCanvasElement>(null),paper=useRef<HTMLDivElement>(null),passwordUpdate=useRef<((value:string)=>void)|null>(null),ocrController=useRef<AbortController|null>(null),ocrSequence=useRef(0),close=useRef(onClose)
 close.current=onClose
 useEffect(()=>{paper.current?.scrollTo({top:0});paper.current?.parentElement?.scrollTo({top:0})},[page])
 const text=ocrPages[page]?.text??(extracted.page===page?extracted.text:''),quality=extractionQuality(text),pageCount=pagesText?.length||document?.numPages||0
 const source=sourceChoice==='auto'?(detectedLanguage(text)||sourceGuess||ocrPages[page]?.language||null):sourceChoice
 const showTranslation=enabled&&!!text.trim()
 const translation=usePageTranslation(text,source,language,enabled&&!ocrBusy,`${book.id}:${page}`)
 useEffect(()=>saveSourceChoice(book.id,sourceChoice),[book.id,sourceChoice])
 useEffect(()=>{if(sourceChoice==='auto'&&source)setOcrLanguage(source)},[source,sourceChoice])
 useEffect(()=>{const next=bookUrl(book);setUrl(next);return()=>{if(next.startsWith('blob:'))URL.revokeObjectURL(next)}},[book])
 useEffect(()=>{if(!book.textUrl)return;const controller=new AbortController();void fetch(book.textUrl,{signal:controller.signal}).then(response=>{if(!response.ok)throw Error();return response.json()}).then(data=>{if(!Array.isArray(data.pages)||!data.pages.length||!data.pages.every((p:unknown)=>typeof p==='string'))throw Error();setPagesText(data.pages);setSourceGuess(detectedLanguage(data.pages.filter((p:string)=>p.length>200).slice(0,8).join('\n').slice(0,20000)))}).catch(()=>{if(!controller.signal.aborted)setPdfRequested(true)});return()=>controller.abort()},[book.textUrl])
 // A loaded PDF stays alive across text/image mode, rotation, OCR and page changes.
 useEffect(()=>{if(!url||!pdfRequested)return;let active=true,loading:PdfLoading|null=null;setDocument(null);setError('')
  void loadPdf(url).then(task=>{loading=task;if(!active){void task.destroy();return}task.onPassword=(update,reason)=>{if(active){passwordUpdate.current=update;setPasswordRequired(true);if(reason===2)setError('The PDF password was incorrect. Please try again.')}};return task.promise.then(doc=>{if(active){setDocument(doc);setPasswordRequired(false);setError('');void doc.getOutline().then(items=>{if(active)setOutline(items||[])}).catch(()=>{})}})}).catch(cause=>{if(active){setError(pdfError(cause));setRendering(false);setOcrBusy(false);setOcrTarget(null)}})
  return()=>{active=false;void loading?.destroy().catch(()=>{})}
 },[url,pdfRequested])
 useEffect(()=>{const handler=(event:KeyboardEvent)=>{if(event.key==='Escape'&&root.current?.checkVisibility())close.current()};window.document.addEventListener('keydown',handler);return()=>window.document.removeEventListener('keydown',handler)},[])
 useEffect(()=>{
  if(format==='text'&&pagesText&&order==='document'){setExtracted({page,text:cleanPdfText(pagesText[page-1]||'')});setRendering(false);return}
  if(!document)return;let active=true,render:RenderTask|null=null;setRendering(true);setError('')
  void document.getPage(page).then(async pdfPage=>{
   if(!active)return
   const content=await pdfPage.getTextContent();if(!active)return;setExtracted({page,text:pageText(content.items,order)})
   if(format==='pdf'){
    const base=pdfPage.getViewport({scale:1,rotation}),width=Math.max(240,Math.min(900,(paper.current?.clientWidth||600)-40)),scale=Math.min(width/base.width,1.7),viewport=pdfPage.getViewport({scale:boundedPageScale(base.width,base.height,scale*Math.min(window.devicePixelRatio||1,1.5)),rotation})
    // Separate job canvases prevent simultaneous rendering into a shared canvas.
    const raster=window.document.createElement('canvas');raster.width=Math.ceil(viewport.width);raster.height=Math.ceil(viewport.height);const context=raster.getContext('2d');if(!context)throw Error();render=pdfPage.render({canvasContext:context,viewport});await render.promise
    if(active&&canvas.current){const target=canvas.current;target.width=raster.width;target.height=raster.height;target.style.width=`${base.width*scale}px`;target.style.height=`${base.height*scale}px`;target.getContext('2d')?.drawImage(raster,0,0)}raster.width=raster.height=1
   }
   if(active)setRendering(false)
  }).catch(()=>{if(active){setRendering(false);setError('This PDF page could not be rendered. Try another page or download the original.')}})
  return()=>{active=false;render?.cancel()}
 },[document,page,format,pagesText,rotation,order])
 useEffect(()=>{if(ocrTarget&&ocrTarget.page!==page){ocrController.current?.abort();setOcrTarget(null);setOcrBusy(false)}},[page,ocrTarget])
 useEffect(()=>{if(!autoOcr||quality==='readable'||rendering)return;setPdfRequested(true);setOcrTarget(previous=>previous?.page===page&&previous.language===ocrLanguage&&previous.rotation===rotation?previous:{page,language:ocrLanguage,rotation,sequence:++ocrSequence.current,translate:true})},[autoOcr,quality,rendering,page,ocrLanguage,rotation])
 useEffect(()=>{
  if(!document||!ocrTarget||ocrTarget.page!==page)return;let active=true;const controller=new AbortController();ocrController.current=controller;setOcrBusy(true);setOcrProgress(0);setError('')
  void document.getPage(page).then(pdfPage=>recognizePage(pdfPage,ocrTarget.language,ocrTarget.rotation,controller.signal,progress=>{if(active)setOcrProgress(progress)})).then(result=>{if(active){setOcrPages(pages=>({...pages,[page]:{text:cleanPdfText(result.text),confidence:result.confidence,language:ocrTarget.language}}));setFormat('text');setEnabled(ocrTarget.translate);setShowOriginal(false)}}).catch(cause=>{if(active&&!controller.signal.aborted)setError(cause instanceof Error?cause.message:'OCR could not load. Check your connection and try again.')}).finally(()=>{if(active)setOcrBusy(false)})
  return()=>{active=false;controller.abort();setOcrBusy(false)}
 },[document,page,ocrTarget])
 async function jump(entry:PdfOutline){if(!document||!entry.dest)return;try{const dest=typeof entry.dest==='string'?await document.getDestination(entry.dest):entry.dest;if(!dest?.length)return;const index=typeof dest[0]==='number'?dest[0]:await document.getPageIndex(dest[0]);if(index>=0&&index<document.numPages)setPage(index+1)}catch{setError('This section could not be opened. Use the page controls instead.')}}
 function requestOcr(translate=true){setEnabled(false);setPdfRequested(true);setOcrBusy(true);setOcrTarget({page,language:ocrLanguage,rotation,sequence:++ocrSequence.current,translate})}
 function outlineEntries(entries:PdfOutline[],depth=0):Array<{entry:PdfOutline;depth:number}>{return entries.flatMap(entry=>[{entry,depth},...outlineEntries(entry.items||[],depth+1)])}
 return <section ref={root} className="enhanced-reader book-section" aria-label={book.name}>
  <header><button type="button" className="text-link" onClick={onClose}><ArrowLeft size={16}/>{T('Back to library')}</button><div><span className="section-kicker">{T('Reading section')}</span><h2>{book.name.replace(/\.pdf$/i,'')}</h2></div><a href={url} download={book.name}><Download size={16}/>{T('Download')}</a></header>
  <div className="reader-toolbar"><div className="reader-mode"><button className={format==='text'?'selected':''} aria-pressed={format==='text'} onClick={()=>setFormat('text')}><BookOpen size={15}/>{T('Text reading')}</button><button className={format==='pdf'?'selected':''} aria-pressed={format==='pdf'} onClick={()=>{setPdfRequested(true);setFormat('pdf');setShowOriginal(true)}}><FileText size={15}/>{T('Original PDF')}</button></div><button className="action-secondary" disabled={!text.trim()&&!enabled} aria-pressed={enabled} onClick={()=>{setEnabled(v=>!v);setShowOriginal(false)}}><Languages size={16}/>{T(enabled?'Stop translation':'Translate this page')}</button><label className="translation-source">{T('Document language')}<select value={sourceChoice} onChange={event=>{const next=event.target.value as SourceChoice;setSourceChoice(next);if(next!=='auto')setOcrLanguage(next)}}><option value="auto">{T('Detect automatically')}{source?` · ${source.toUpperCase()}`:''}</option>{LANGUAGES.map(item=><option key={item.code} value={item.code}>{item.code.toUpperCase()}</option>)}</select></label><span className="translation-target">{T('Target language')}: <strong>{language.toUpperCase()}</strong></span>{enabled&&<button type="button" className="action-secondary" aria-pressed={showOriginal} onClick={()=>setShowOriginal(value=>!value)}>{T(showOriginal?'Hide original text':'Compare with original')}</button>}</div>
  <PdfPagination page={page} total={pageCount} onChange={setPage} language={language}/>
  <details className="reader-tools"><summary>{T('Extraction and OCR tools')}</summary><div><label>{T('Reading order')}<select value={order} onChange={e=>{setPdfRequested(true);setOrder(e.target.value as ReadingOrder)}}><option value="document">{T('Document order')}</option><option value="rows">{T('By rows')}</option><option value="columns">{T('Two columns')}</option></select></label><label>{T('Document language for OCR')}<select value={ocrLanguage} onChange={e=>{setOcrLanguage(e.target.value as Language);setSourceChoice(e.target.value as Language)}}>{LANGUAGES.map(l=><option key={l.code} value={l.code}>{l.code.toUpperCase()}</option>)}</select></label><button className="action-secondary" type="button" onClick={()=>{setPdfRequested(true);setRotation(r=>(r+90)%360)}}><RotateCw size={15}/>{T('Rotate page')} {rotation}°</button><button className="action-secondary" disabled={ocrBusy} onClick={()=>requestOcr(true)}><ScanText size={16}/>{T('Extract and translate')} · {language.toUpperCase()}</button><button type="button" className="text-link" disabled={ocrBusy} onClick={()=>requestOcr(false)}>{T('Extract original text only')}</button><label className="checkbox-row"><input type="checkbox" checked={autoOcr} onChange={e=>setAutoOcr(e.target.checked)}/>{T('Use OCR when text is missing')}</label></div><p>{T('OCR runs on this device and downloads language data initially. Choose the document language, which can differ from the translation language.')}</p></details>
  {outline.length>0&&<details className="book-contents"><summary>{T('Table of contents')}</summary>{outlineEntries(outline).map(({entry,depth},i)=><button style={{paddingInlineStart:depth*14}} key={i} type="button" onClick={()=>void jump(entry)}>{entry.title}</button>)}</details>}
  {passwordRequired&&<form className="pdf-password" onSubmit={e=>{e.preventDefault();passwordUpdate.current?.(password);setPassword('');setPasswordRequired(false);setError('')}}><label>{T('PDF password')}<input autoFocus type="password" autoComplete="off" value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="action-primary">{T('Open PDF')}</button></form>}
  {error&&<p className="assistant-error" role="alert">{T(error)}</p>}
  {ocrBusy&&<div className="ocr-progress" role="status"><ScanText size={16}/>{T('Recognizing page text…')} {Math.round(ocrProgress*100)}%<progress value={ocrProgress} max={1}/><button className="text-link" onClick={()=>{ocrController.current?.abort();setOcrTarget(null);setOcrBusy(false);setAutoOcr(false)}}>{T('Cancel')}</button></div>}
  <div className={`reader-pages ${showTranslation?(showOriginal?'with-translation':'translation-only'):''}`}><div className="reader-paper" ref={paper} hidden={showTranslation&&!showOriginal}><canvas hidden={format!=='pdf'} ref={canvas} aria-label={`${T('Page')} ${page}`}/>{rendering&&<p role="status">{T('Loading page…')}</p>}{format==='text'&&text&&<article className="book-text" dir="auto"><span className="section-kicker">{T('Original text')}{source?` · ${source.toUpperCase()}`:''} · {T('Page')} {page}{ocrPages[page]?` · OCR ${Math.round(ocrPages[page].confidence)}%`:''}</span>{text.split(/\n\s*\n/).filter(Boolean).map((paragraph,i)=><p key={i}>{reflowParagraph(paragraph)}</p>)}</article>}{quality!=='readable'&&!rendering&&pageCount>0&&<div className="ocr-suggestion"><p>{T(quality==='empty'?'No text was found on this page. It may be blank or scanned.':'The text layer is unreadable. Try OCR to recognize the page image.')}</p><button type="button" className="action-secondary" disabled={ocrBusy} onClick={()=>requestOcr(true)}><ScanText size={16}/>{T('Extract and translate')} · {language.toUpperCase()}</button></div>}</div>
   {showTranslation&&<section className="reader-translation"><div className="section-heading"><h2>{T('Page translation')} · {language.toUpperCase()}</h2>{translation.busy&&<span role="status">{translation.model.status==='loading'?`${T('Downloading translator…')}${translation.model.downloaded?` ${(translation.model.downloaded/1024/1024).toFixed(1)} MB`:''}`:`${Math.round(translation.progress*100)}%`}</span>}</div><p className="source-note">{T('Translation runs on this device. The first use downloads its model; no text is sent to a translation provider.')}</p>{translation.busy&&<div className="translation-progress" role="status"><progress value={translation.model.status==='loading'?(translation.model.total?translation.model.downloaded/translation.model.total:0):translation.progress} max={1}/><p>{T(translation.model.status==='loading'?'Downloading translator…':'Translating the page…')}</p></div>}{translation.error&&<div className="assistant-error" role="alert">{T(translation.error)}<button className="text-link" onClick={translation.retry}><RefreshCw size={13}/>{T('Retry translation')}</button></div>}{translation.text&&<><p className="translated-text" lang={language} dir="auto">{translation.text}</p>{translation.complete&&translation.review&&<p role="status" className="assistant-error">{T('Check the numbers and references in this translation against the original.')}</p>}{translation.complete&&!translation.verified&&<p className="source-note">{T('Language verification is uncertain for this passage. Check the translation against the original.')}</p>}{!translation.complete&&<p className="source-note">{T('Translation in progress. This passage is not complete yet.')}</p>}</>}{translation.busy&&<button className="text-link" onClick={()=>setEnabled(false)}><Square size={13}/>{T('Cancel')}</button>}</section>}
  </div>
  <PdfPagination page={page} total={pageCount} onChange={setPage} language={language}/>
 </section>
}
