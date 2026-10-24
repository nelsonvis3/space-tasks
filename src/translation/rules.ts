import {prepareTranslationText,sentences} from './textQuality.ts'
import type {Language} from '../i18n'
import {translationChunks} from '../productivity/pdfText.ts'
export type TranslationSegment={text:string;paragraph:number}
export type InferenceResult={text:string;complete:boolean}
const ENGLISH_MODELS:Partial<Record<Language,string>>={es:'Xenova/opus-mt-en-es',de:'Xenova/opus-mt-en-de',fr:'Xenova/opus-mt-en-fr',it:'Xenova/opus-mt-en-it',pt:'Xenova/opus-mt-en-ROMANCE'}
export function translationModel(source:Language,target:Language){if(source==='en'&&ENGLISH_MODELS[target])return ENGLISH_MODELS[target]!;if(source==='es'&&target==='en')return'Xenova/opus-mt-es-en';return'Xenova/m2m100_418M'}
export function documentSegments(text:string,source:Language='en'):TranslationSegment[]{return prepareTranslationText(text).split(/\n\s*\n/).flatMap((paragraph,index)=>{const result:TranslationSegment[]=[];let batch='';for(const sentence of sentences(paragraph,source)){if(batch&&(batch.length+sentence.length+1)>480){result.push({text:batch,paragraph:index});batch=''}if(sentence.length>480){if(batch){result.push({text:batch,paragraph:index});batch=''}for(const part of translationChunks(sentence,480))result.push({text:part,paragraph:index})}else batch+=(batch?' ':'')+sentence}if(batch)result.push({text:batch,paragraph:index});return result})}
export function splitPassage(text:string){const characters=Array.from(text),half=Math.floor(characters.length/2);let cut=half;for(let distance=0;distance<half/2;distance++){if(/\s/.test(characters[half-distance]||'')){cut=half-distance;break}if(/\s/.test(characters[half+distance]||'')){cut=half+distance;break}}return[characters.slice(0,cut).join('').trim(),characters.slice(cut).join('').trim()] as const}
export class IncompleteTranslation extends Error{constructor(){super('Local translation could not finish this passage. Retry the page.')}}
/** A cap reached by one inference splits that source passage, never discards a page. */
export async function translatePassage(text:string,target:Language,infer:(text:string)=>Promise<InferenceResult>,check:()=>void,depth=0):Promise<string>{
 check();if(!/\p{L}/u.test(text))return text
 const result=await infer(text);check()
 if(result.complete&&result.text.trim())return result.text.trim()
 if(depth>=5||Array.from(text).length<20)throw new IncompleteTranslation()
 const[left,right]=splitPassage(text);if(!left||!right)throw new IncompleteTranslation()
 const a=await translatePassage(left,target,infer,check,depth+1),b=await translatePassage(right,target,infer,check,depth+1);return a+(target==='ja'?'':' ')+b
}
export async function translateDocument(text:string,target:Language,infer:(text:string)=>Promise<InferenceResult>,check:()=>void,onPart:(text:string,progress:number)=>void,source:Language='en'){const segments=documentSegments(text,source),parts:string[]=[];for(let i=0;i<segments.length;i++){const translated=await translatePassage(segments[i].text,target,infer,check);check();parts.push((i===0?'':segments[i].paragraph===segments[i-1].paragraph?(target==='ja'?'':' '):'\n\n')+translated);onPart(parts.join(''),(i+1)/segments.length)}return parts.join('')}
export function translationKey(identity:string,source:Language|null,target:Language,text:string){return JSON.stringify([identity,source,target,text])}
