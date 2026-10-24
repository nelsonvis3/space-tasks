import {fidelityIssues} from './textQuality'
import type {TranslationRequest,TranslationResponse} from './protocol'
import type {Pipeline} from './modelAdapter'
import {inferTranslation} from './modelAdapter'
import {translateDocument,translationModel} from './rules'
import {detectedLanguage} from '../productivity/translation'
type Runtime={env:{allowLocalModels:boolean;useBrowserCache:boolean;backends:{onnx:{wasm:{numThreads:number;proxy:boolean;wasmPaths:string}}}};pipeline:(task:'translation',model:string,options:{device:'wasm';dtype:'q8';progress_callback:(progress:{status:string;file?:string;loaded?:number;total?:number})=>void})=>Promise<Pipeline>}
const port=self as unknown as {postMessage:(value:TranslationResponse)=>void;onmessage:((event:MessageEvent<TranslationRequest>)=>void)|null}
let runtime:Promise<Runtime>|null=null,pipeline:Pipeline|null=null,loadedModel='',busy=false
function loadRuntime(){if(!runtime){const url='/vendor/@huggingface/transformers@3.8.1/dist/transformers.min.js';runtime=import(/* @vite-ignore */url).then(module=>{const api=module as Runtime;api.env.allowLocalModels=false;api.env.useBrowserCache=true;api.env.backends.onnx.wasm.numThreads=1;api.env.backends.onnx.wasm.proxy=false;api.env.backends.onnx.wasm.wasmPaths=new URL('/vendor/@huggingface/transformers@3.8.1/dist/',self.location.href).href;return api}).catch(error=>{runtime=null;throw error})}return runtime}
port.onmessage=async({data})=>{
 if(busy){port.postMessage({id:data.id,type:'error',message:'Local translation is busy. Please wait for the current page.'});return}busy=true
 const model=translationModel(data.source,data.target),files=new Map<string,{loaded:number;total:number}>();let phase:'load'|'translate'='load',heartbeat=0
 try{
  port.postMessage({id:data.id,type:'download',loaded:0,total:0,model})
  const api=await loadRuntime()
  if(loadedModel!==model||!pipeline){await pipeline?.dispose();pipeline=null;loadedModel='';pipeline=await api.pipeline('translation',model,{device:'wasm',dtype:'q8',progress_callback:progress=>{if(progress.file){files.set(progress.file,{loaded:progress.loaded||0,total:progress.total||0});let loaded=0,total=0;for(const file of files.values()){loaded+=file.loaded;total+=file.total}port.postMessage({id:data.id,type:'download',loaded,total,model})}}});loadedModel=model}
  phase='translate';port.postMessage({id:data.id,type:'working'});const pipe=pipeline
  const text=await translateDocument(data.text,data.target,async source=>{const result=await inferTranslation(pipe,model,source,data.source,data.target,()=>{if(Date.now()-heartbeat>1500){heartbeat=Date.now();port.postMessage({id:data.id,type:'activity'})}});return result},()=>{},(text,progress)=>port.postMessage({id:data.id,type:'part',text,progress}),data.source)
  const detected=detectedLanguage(text);if(detected&&detected!==data.target)throw new Error('The translation did not match the selected language. Please retry; the original text is preserved.')
  port.postMessage({id:data.id,type:'done',text,verified:detected===data.target,review:fidelityIssues(data.text,text).length>0})
 }catch(cause){const message=cause instanceof Error&&cause.message==='The translation did not match the selected language. Please retry; the original text is preserved.'?cause.message:phase==='load'?'The local translator could not download its files. Check your connection and available storage, then retry.':cause instanceof Error&&cause.name==='Error'&&cause.message==='Local translation could not finish this passage. Retry the page.'?cause.message:'Local translation failed. Free some memory and retry the page.';port.postMessage({id:data.id,type:'error',message})}
 finally{busy=false}
}
