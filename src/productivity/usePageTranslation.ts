import {useEffect,useRef,useState,useSyncExternalStore} from 'react'
import type {Language} from '../i18n'
import {LocalTranslator} from '../translation/LocalTranslator'
import {translationKey} from '../translation/rules'
export function usePageTranslation(text:string,source:Language|null,language:Language,enabled:boolean,identity:string){
 const [translator]=useState(()=>new LocalTranslator()),activeKey=translationKey(identity,source,language,text),model=useSyncExternalStore(translator.subscribe,translator.getSnapshot)
 const [result,setResult]=useState({key:'',text:'',verified:false,complete:false,review:false}),[progress,setProgress]=useState(0),[error,setError]=useState(''),[busy,setBusy]=useState(false),[attempt,setAttempt]=useState(0),cache=useRef(new Map<string,{text:string;verified:boolean;review?:boolean}>())
 useEffect(()=>()=>translator.dispose(),[translator])
 useEffect(()=>{setResult({key:activeKey,text:'',verified:false,complete:false,review:false});setError('');setProgress(0);if(!enabled||!text.trim()){setBusy(false);return}if(!source){setBusy(false);setError('Choose the document language to translate this page.');return}const key=activeKey,cached=cache.current.get(key);if(cached){setResult({key,...cached,review:!!cached.review,complete:true});setBusy(false);return}let active=true;setBusy(true)
  void translator.translate(text,source,language,(text,progress)=>{if(active){setResult({key,text,verified:false,complete:false,review:false});setProgress(progress)}}).then(next=>{if(active){cache.current.set(key,next);if(cache.current.size>20)cache.current.delete(cache.current.keys().next().value!);setResult({key,...next,review:!!next.review,complete:true});setProgress(1)}}).catch(cause=>{if(active)setError(cause instanceof Error?cause.message:'Local translation failed. Free some memory and retry the page.')}).finally(()=>{if(active)setBusy(false)})
  return()=>{active=false;translator.cancel()}
 },[text,source,language,enabled,identity,attempt,activeKey,translator])
 return{...result,text:result.key===activeKey?result.text:'',progress,error,busy,model,retry:()=>setAttempt(n=>n+1)}
}
