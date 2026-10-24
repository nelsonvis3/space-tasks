import type {WorkerRequest,WorkerResponse,ChatMessage} from './browserProtocol'
type Engine={chat:{completions:{create:(request:{messages:ChatMessage[];stream:true;max_tokens:number;temperature:number})=>Promise<AsyncIterable<{choices:{delta:{content?:string};finish_reason?:string}[]}>>}};interruptGenerate:()=>void;unload:()=>Promise<void>}
type WebLLM={CreateMLCEngine:(model:string,config:{initProgressCallback:(p:{progress:number})=>void})=>Promise<Engine>}
const port=self as unknown as {postMessage:(value:WorkerResponse)=>void;onmessage:((event:MessageEvent<WorkerRequest>)=>void)|null}
let engine:Engine|null=null,busy=false
port.onmessage=async({data})=>{
 if(data.type==='cancel'){engine?.interruptGenerate();return}
 try{
  if(data.type==='init'){
   const url='/vendor/@mlc-ai/web-llm@0.2.85/lib/index.js'
   const runtime=await import(/* @vite-ignore */url) as WebLLM
   engine=await runtime.CreateMLCEngine(data.model,{initProgressCallback:p=>port.postMessage({id:data.id,type:'progress',progress:Math.max(0,Math.min(1,p.progress))})})
   port.postMessage({id:data.id,type:'ready'});return
  }
  if(!engine||busy)throw new Error('Local AI is not ready.')
  busy=true
  const stream=await engine.chat.completions.create({messages:data.messages,stream:true,max_tokens:Math.max(64,Math.min(768,data.maxTokens||256)),temperature:.4})
  for await(const chunk of stream){const text=chunk.choices?.[0]?.delta.content;if(text)port.postMessage({id:data.id,type:'chunk',text})}
  port.postMessage({id:data.id,type:'done'})
 }catch{port.postMessage({id:data.id,type:'error',message:data.type==='init'?'The local model could not load. Check your connection, available memory and WebGPU support.':'Local generation failed. Free some memory and try again.'})}
 finally{busy=false}
}
