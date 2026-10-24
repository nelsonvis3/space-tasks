import {appStorage,scopedStorage,FLUSH_EVENT} from './account/storage'
import {useEffect,useRef,useState,useSyncExternalStore} from 'react'
import type {FormEvent} from 'react'
import {Bot,Send,Square,Trash2,Download,MemoryStick} from 'lucide-react'
import {t,LANGUAGE_NAMES} from './i18n'
import type {Language} from './i18n'
import {browserAI} from './ai/browserAI'
import {assistantMessages} from './ai/browserProtocol'
import type {ChatMessage} from './ai/browserProtocol'
type Chat=Omit<ChatMessage,'role'>&{role:'assistant'|'user'}
const CHAT_KEY='orbit:assistant:chat:v1'
function readChat():Chat[]{try{const c=JSON.parse(appStorage.getItem(CHAT_KEY)||'[]');return Array.isArray(c)?c.filter(m=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string'&&m.content.trim()).slice(-24):[]}catch{return[]}}
export function AssistantPanel({language,tasks}:{language:Language;tasks:{title:string;status:string;priority:string}[]}){
 const model=useSyncExternalStore(browserAI.subscribe,browserAI.getSnapshot),[chat,setChat]=useState<Chat[]>(readChat),[input,setInput]=useState(''),[error,setError]=useState('')
 const [storage]=useState(()=>scopedStorage())
 const log=useRef<HTMLDivElement>(null),latest=useRef(chat),mounted=useRef(true),request=useRef(0),T=(key:string)=>t(language,key)
 const busy=model.status==='generating',ready=model.status==='ready'
 latest.current=chat
 useEffect(()=>{log.current?.scrollTo({top:log.current.scrollHeight,behavior:'instant'})},[chat])
 useEffect(()=>{mounted.current=true;const flush=(event?:Event)=>{const value=JSON.stringify(latest.current.slice(-24));if(event instanceof CustomEvent&&event.detail?.data)event.detail.data[CHAT_KEY]=value;try{storage.setItem(CHAT_KEY,value)}catch{if(event instanceof CustomEvent&&event.detail)event.detail.failed=true;setError('Changes could not be saved. Check your browser storage.')}};const id=window.setInterval(flush,2000);window.addEventListener('pagehide',flush);window.addEventListener(FLUSH_EVENT,flush);return()=>{mounted.current=false;browserAI.cancel();clearInterval(id);window.removeEventListener('pagehide',flush);window.removeEventListener(FLUSH_EVENT,flush)}},[])
 useEffect(()=>{try{storage.setItem(CHAT_KEY,JSON.stringify(chat.slice(-24)))}catch{setError('Changes could not be saved. Check your browser storage.')}},[chat,storage])
 async function send(e:FormEvent){e.preventDefault();if(!ready||!input.trim())return
  const token=++request.current,message=input.trim(),next:Chat[]=[...chat,{role:'user',content:message}];setChat([...next,{role:'assistant',content:''}]);setInput('');setError('')
  let content=''
  try{await browserAI.generate(assistantMessages(LANGUAGE_NAMES[language],tasks,next),text=>{content+=text;if(mounted.current&&request.current===token)setChat([...next,{role:'assistant',content}])});if(!content&&mounted.current&&request.current===token)setError('The model returned no text. Please try again.')}
  catch(cause){if(mounted.current&&request.current===token){setError(cause instanceof Error?cause.message:'Local generation failed. Free some memory and try again.');setInput(message)}}
 }
 return <section className="assistant-card browser-assistant"><div className="section-heading"><div><span className="section-kicker">{T('Private by design')}</span><h2>{T('A clear next step')}</h2></div><Bot size={24}/></div>
  <div className="browser-ai-header"><span>{model.model} · {T(busy?'Thinking...':ready?'Ready on this device':'Browser AI')}</span>{(ready||busy||model.status==='loading')&&<button type="button" onClick={()=>browserAI.release()}><MemoryStick size={14}/>{T('Free memory')}</button>}</div>
  {!ready&&!busy&&<div className="browser-ai-activation"><p>{T('Enable the assistant to download a small model to this browser. Your prompts and tasks are processed on your device, not sent to an AI provider.')}</p>{model.status==='loading'?<><progress value={model.progress} max="1" aria-label={T('Model download progress')}/><small role="status">{T('Downloading and preparing the model…')} {Math.round(model.progress*100)}%</small></>:<button className="action-primary" type="button" onClick={()=>{setError('');void browserAI.activate().catch(()=>{})}}><Download size={16}/>{T('Enable local assistant')}</button>}</div>}
  <div className="assistant-conversation" ref={log} role="log" aria-live="polite" aria-label={T('AI chat messages')}>{!chat.length&&<div className="assistant-welcome"><strong>{T('What would help you move forward?')}</strong><small>{T('Ask for a short plan, help prioritizing or a first small step.')}</small></div>}{chat.map((m,i)=><div className={`assistant-message assistant-message--${m.role}`} key={i}>{m.content||T('Thinking...')}</div>)}</div>
  {(error||model.error)&&<p className="assistant-error" role="alert">{T(error||model.error)}</p>}
  <form className="assistant-form" onSubmit={send}><input aria-label={T('Ask the AI assistant')} placeholder={T('Ask something about your tasks...')} value={input} maxLength={500} onChange={e=>setInput(e.target.value)}/><button type="submit" disabled={!ready||!input.trim()} aria-label={T('Send')}><Send size={17}/></button>{busy&&<button type="button" aria-label={T('Cancel response')} onClick={()=>browserAI.cancel()}><Square size={16}/></button>}</form><div className="assistant-footer"><small className="ai-privacy">{T('No API key or subscription. Initial download needs internet and a browser with WebGPU.')}</small><button className="ghost-icon" type="button" aria-label={T('Clear chat')} onClick={()=>{request.current++;browserAI.cancel();setChat([]);setError('')}}><Trash2 size={16}/></button></div>
 </section>
}
