import type {Language} from '../i18n'
import type {PdfPage,RenderTask} from './pdfjs'
import {boundedPageScale} from './renderBudget'
export const OCR_LANGUAGES:Record<Language,string>={en:'eng',es:'spa',pt:'por',fr:'fra',de:'deu',it:'ita',ja:'jpn'}
type OcrWorker={recognize:(image:HTMLCanvasElement,options:{rotateAuto:boolean})=>Promise<{data:{text:string;confidence:number}}>;terminate:()=>Promise<void>}
type Runtime={createWorker:(language:string,engine:number,options:{workerPath:string;corePath:string;langPath:string;logger:(message:{progress:number;status:string})=>void})=>Promise<OcrWorker>}
let runtime:Promise<Runtime>|null=null
function loadRuntime(){if(!runtime)runtime=new Promise<Runtime>((resolve,reject)=>{const script=document.createElement('script'),timer=setTimeout(()=>{script.remove();runtime=null;reject(new Error('OCR could not load. Check your connection and try again.'))},30000);script.src='/vendor/tesseract.js@6.0.1/dist/tesseract.min.js';script.async=true;script.onload=()=>{clearTimeout(timer);const api=(window as Window&{Tesseract?:Runtime}).Tesseract;if(api)resolve(api);else{runtime=null;reject(new Error('OCR could not load. Check your connection and try again.'))}};script.onerror=()=>{clearTimeout(timer);script.remove();runtime=null;reject(new Error('OCR could not load. Check your connection and try again.'))};document.head.append(script)});return runtime}
export function ocrScale(width:number,height:number){return boundedPageScale(width,height,2.5)}
export async function recognizePage(page:PdfPage,language:Language,rotation:number,signal:AbortSignal,onProgress:(progress:number)=>void):Promise<{text:string;confidence:number}>{
 const held:{worker:OcrWorker|null}={worker:null}
 let render:RenderTask|null=null,canvas:HTMLCanvasElement|null=null,alive=true
 function waitFor<T>(promise:Promise<T>,timeout=90000):Promise<T>{return new Promise((resolve,reject)=>{const stop=()=>{clearTimeout(timer);signal.removeEventListener('abort',cancelWait)},cancelWait=()=>{stop();reject(new DOMException('Cancelled','AbortError'))},timer=setTimeout(()=>{stop();reject(new Error('OCR could not load. Check your connection and try again.'))},timeout);signal.addEventListener('abort',cancelWait,{once:true});if(signal.aborted){cancelWait();return}promise.then(value=>{stop();resolve(value)},error=>{stop();reject(error)})})}
 const aborted=()=>{if(signal.aborted)throw new DOMException('Cancelled','AbortError')}
 const cancel=()=>{render?.cancel();void held.worker?.terminate().catch(()=>{})}
 signal.addEventListener('abort',cancel,{once:true})
 try{aborted();const base=page.getViewport({scale:1,rotation}),viewport=page.getViewport({scale:ocrScale(base.width,base.height),rotation});canvas=document.createElement('canvas');canvas.width=Math.ceil(viewport.width);canvas.height=Math.ceil(viewport.height);const context=canvas.getContext('2d');if(!context)throw new Error('OCR could not load. Check your connection and try again.');render=page.render({canvasContext:context,viewport});await render.promise;aborted();const api=await waitFor(loadRuntime(),35000);aborted()
  const initialization=api.createWorker(OCR_LANGUAGES[language],1,{workerPath:`${location.origin}/vendor/tesseract.js@6.0.1/dist/worker.min.js`,corePath:`${location.origin}/vendor/tesseract.js-core@6.0.0`,langPath:'https://tessdata.projectnaptha.com/4.0.0',logger:message=>{if(!signal.aborted)onProgress(Math.max(0,Math.min(1,message.progress||0)))}}).then(created=>{if(!alive||signal.aborted)void created.terminate().catch(()=>{});else held.worker=created;return created})
  const ready=await waitFor(initialization);aborted();const result=await waitFor(ready.recognize(canvas,{rotateAuto:true}));aborted();canvas.width=canvas.height=1;return{text:result.data.text,confidence:result.data.confidence}
 }catch(cause){if(signal.aborted)throw new DOMException('Cancelled','AbortError');throw new Error('OCR could not load. Check your connection and try again.',{cause})}finally{alive=false;if(canvas)canvas.width=canvas.height=1;signal.removeEventListener('abort',cancel);render?.cancel();void held.worker?.terminate().catch(()=>{})}
}
