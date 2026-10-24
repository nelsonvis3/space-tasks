import type {ChatMessage,ModelState,WorkerRequest,WorkerResponse} from './browserProtocol'
const EMPTY:ModelState={status:'idle',progress:0,model:'Qwen2.5-0.5B-Instruct',error:''}
type GPU={requestAdapter:()=>Promise<{features:{has:(value:string)=>boolean}}|null>}
class BrowserAI{
 private state:ModelState=EMPTY
 private listeners=new Set<()=>void>()
 private worker:Worker|null=null
 private epoch=0
 private id=0
 private pending:{id:number;resolve:()=>void;reject:(error:Error)=>void;chunk?:(text:string)=>void;timer:ReturnType<typeof setTimeout>}|null=null
 subscribe=(fn:()=>void)=>{this.listeners.add(fn);return()=>this.listeners.delete(fn)}
 getSnapshot=()=>this.state
 private update(next:Partial<ModelState>){this.state={...this.state,...next};this.listeners.forEach(fn=>fn())}
 private post(value:WorkerRequest){this.worker?.postMessage(value)}
 private fail(message:string){if(this.pending){clearTimeout(this.pending.timer);this.pending.reject(new Error(message));this.pending=null}this.worker?.terminate();this.worker=null;this.update({status:'error',error:message})}
 private receive=({data}:MessageEvent<WorkerResponse>)=>{
  if(!this.pending||data.id!==this.pending.id)return
  if(data.type==='progress'){this.update({progress:data.progress});return}
  if(data.type==='chunk'){this.pending.chunk?.(data.text);return}
  if(data.type==='error'){this.fail(data.message);return}
  clearTimeout(this.pending.timer);this.pending.resolve();this.pending=null;this.update({status:'ready',progress:1,error:''})
 }
 async activate(){
  if(this.state.status==='ready'||this.state.status==='generating')return
  if(this.state.status==='loading')throw new Error('The model is still loading.')
  const epoch=++this.epoch
  this.update({status:'loading',progress:0,error:''})
  try{
   const gpu=(navigator as Navigator&{gpu?:GPU}).gpu
   if(!window.isSecureContext||!gpu)throw new Error('This browser cannot run local AI. Enable WebGPU in a compatible browser and use HTTPS or localhost.')
   const adapter=await gpu.requestAdapter();if(epoch!==this.epoch)return;if(!adapter)throw new Error('No compatible GPU is available for local AI.')
   this.worker?.terminate();this.worker=new Worker(new URL('./browser.worker.ts',import.meta.url),{type:'module'})
   this.worker.onmessage=this.receive;this.worker.onerror=()=>this.fail('The local model could not load. Check your connection, available memory and WebGPU support.')
   const model=`Qwen2.5-0.5B-Instruct-${adapter.features.has('shader-f16')?'q4f16_1':'q4f32_1'}-MLC`
   await this.request({id:++this.id,type:'init',model},180000)
  }catch(cause){if(epoch!==this.epoch)return;const message=cause instanceof Error?cause.message:'The local model could not load. Check your connection, available memory and WebGPU support.';this.fail(message);throw new Error(message)}
 }
 private request(request:WorkerRequest,timeout:number,chunk?:(text:string)=>void){return new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{this.worker?.terminate();this.worker=null;this.fail('The local model timed out. Check your connection or try again with more free memory.')},timeout);this.pending={id:request.id,resolve,reject,chunk,timer};this.post(request)})}
 waitUntilReady(){if(this.state.status==='ready')return Promise.resolve();return new Promise<void>((resolve,reject)=>{const timer=setTimeout(()=>{stop();reject(new Error('The local model timed out. Check your connection or try again with more free memory.'))},180000);const stop=this.subscribe(()=>{if(['ready','error','idle'].includes(this.state.status)){clearTimeout(timer);stop();if(this.state.status==='ready')resolve();else reject(new Error(this.state.error||'Request cancelled.'))}})})}
 async generate(messages:ChatMessage[],chunk:(text:string)=>void,maxTokens=256){
  if(this.state.status!=='ready')throw new Error('Local AI is not ready.')
  this.update({status:'generating',error:''})
  await this.request({id:++this.id,type:'generate',messages,maxTokens},90000,chunk)
 }
 cancel(){if(this.state.status==='generating')this.post({id:this.id,type:'cancel'})}
 release(){
  this.epoch++
  if(this.pending){clearTimeout(this.pending.timer);this.pending.reject(new Error('Request cancelled.'));this.pending=null}
  this.worker?.terminate();this.worker=null;this.update({...EMPTY})
 }
}
export const browserAI=new BrowserAI()
