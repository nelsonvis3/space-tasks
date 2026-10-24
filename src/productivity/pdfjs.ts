export type PdfViewport={width:number;height:number}
export type RenderTask={promise:Promise<void>;cancel:()=>void}
export type PdfPage={getViewport:(options:{scale:number;rotation?:number})=>PdfViewport;render:(options:{canvasContext:CanvasRenderingContext2D;viewport:PdfViewport})=>RenderTask;getTextContent:()=>Promise<{items:Array<import('./pdfText').TextItem>}>;cleanup:()=>void}
export type PdfOutline={title:string;dest:string|unknown[]|null;items:PdfOutline[]}
export type PdfDocument={numPages:number;getOutline:()=>Promise<PdfOutline[]|null>;getDestination:(id:string)=>Promise<unknown[]|null>;getPageIndex:(ref:unknown)=>Promise<number>;getPage:(page:number)=>Promise<PdfPage>;destroy:()=>Promise<void>}
export type PdfLoading={promise:Promise<PdfDocument>;destroy:()=>Promise<void>;onPassword?:(update:(password:string)=>void,reason:number)=>void}
type PdfJS={GlobalWorkerOptions:{workerSrc:string};getDocument:(options:{url:string;isEvalSupported:boolean;cMapUrl:string;cMapPacked:boolean;standardFontDataUrl:string;wasmUrl:string})=>PdfLoading}
const BASE='/vendor/pdfjs-dist@5.4.149/'
let runtime:Promise<PdfJS>|null=null
export function pdfRuntime(){if(!runtime){const url=BASE+'build/pdf.min.mjs';runtime=import(/* @vite-ignore */url).then(module=>{const pdf=module as PdfJS;pdf.GlobalWorkerOptions.workerSrc=BASE+'build/pdf.worker.min.mjs';return pdf}).catch(error=>{runtime=null;throw error})}return runtime}
export async function loadPdf(url:string){const pdf=await pdfRuntime();return pdf.getDocument({url,isEvalSupported:false,cMapUrl:BASE+'cmaps/',cMapPacked:true,standardFontDataUrl:BASE+'standard_fonts/',wasmUrl:BASE+'wasm/'})}
