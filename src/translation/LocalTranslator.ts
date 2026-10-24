import type {Language} from '../i18n'
import type {TranslationRequest,TranslationResponse,TranslationState} from './protocol'
export const TRANSLATOR_IDLE:TranslationState={status:'idle',progress:0,downloaded:0,total:0,model:'',error:''}
type WorkerPort={postMessage:(message:TranslationRequest)=>void;terminate:()=>void;onmessage:((event:MessageEvent<TranslationResponse>)=>void)|null;onerror:((event:ErrorEvent)=>void)|null}
type Pending={id:number;resolve:(result:{text:string;verified:boolean;review?:boolean})=>void;reject:(error:Error)=>void;part:(text:string,progress:number)=>void}
export class LocalTranslator{
 private worker:WorkerPort|null=null
 private state:TranslationState=TRANSLATOR_IDLE
 private listeners=new Set<()=>void>()
 private pending:Pending|null=null
 private serial=0
 private timer:ReturnType<typeof setTimeout>|undefined
 private factory:()=>WorkerPort
 constructor(factory:()=>WorkerPort=()=>new Worker(new URL('./translation.worker.ts',import.meta.url),{type:'module'})){this.factory=factory}
 subscribe=(listener:()=>void)=>{this.listeners.add(listener);return()=>{this.listeners.delete(listener)}}
 getSnapshot=()=>this.state
 private update(patch:Partial<TranslationState>){this.state={...this.state,...patch};this.listeners.forEach(fn=>fn())}
 private watch(){clearTimeout(this.timer);this.timer=setTimeout(()=>this.fail('The local translator stopped responding. Check your connection or free memory, then retry.'),180000)}
 private fail(message:string){const pending=this.pending;this.pending=null;clearTimeout(this.timer);this.worker?.terminate();this.worker=null;this.update({status:'error',error:message});pending?.reject(new Error(message))}
 private receive=({data}:MessageEvent<TranslationResponse>)=>{const pending=this.pending;if(!pending||data.id!==pending.id)return;this.watch()
  if(data.type==='activity')return
  if(data.type==='working'){this.update({status:'translating',progress:0});return}
  if(data.type==='download'){this.update({status:'loading',downloaded:data.loaded,total:data.total,model:data.model});return}
  if(data.type==='part'){this.update({status:'translating',progress:data.progress});pending.part(data.text,data.progress);return}
  if(data.type==='error'){this.fail(data.message);return}
  clearTimeout(this.timer);this.pending=null;this.update({status:'ready',progress:1,error:''});pending.resolve({text:data.text,verified:data.verified,review:data.review})
 }
 translate(text:string,source:Language,target:Language,part:(text:string,progress:number)=>void=()=>{}):Promise<{text:string;verified:boolean;review?:boolean}>{
  if(this.pending)return Promise.reject(new Error('Local translation is busy. Please wait for the current page.'))
  if(source===target){this.update({...TRANSLATOR_IDLE,status:'ready',progress:1});return Promise.resolve({text,verified:true})}
  try{if(!this.worker){this.worker=this.factory();this.worker.onmessage=this.receive;this.worker.onerror=()=>this.fail('The local translator could not start. Update your browser and allow its model files to download.')}}catch{return Promise.reject(new Error('The local translator could not start. Update your browser and allow its model files to download.'))}
  this.update({...TRANSLATOR_IDLE,status:'loading'});const id=++this.serial
  return new Promise<{text:string;verified:boolean;review?:boolean}>((resolve,reject)=>{this.pending={id,resolve,reject,part};this.watch();try{this.worker!.postMessage({id,type:'translate',text,source,target})}catch{this.fail('The local translator could not start. Update your browser and allow its model files to download.')}})
 }
 cancel(){const pending=this.pending;this.pending=null;clearTimeout(this.timer);if(pending){this.worker?.terminate();this.worker=null;pending.reject(new DOMException('Cancelled','AbortError'))}this.update({...TRANSLATOR_IDLE})}
 dispose(){this.cancel();this.worker?.terminate();this.worker=null;this.listeners.clear()}
}
