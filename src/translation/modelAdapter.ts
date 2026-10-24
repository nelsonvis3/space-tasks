import type {Language} from '../i18n'
import type {InferenceResult} from './rules.ts'
export type TokenStreamer={put:(tokens:bigint[][])=>void;end:()=>void}
export type Pipeline={
 (text:string,options:{src_lang?:string;tgt_lang?:string;max_new_tokens:number;do_sample:false;num_beams:number;streamer:TokenStreamer}):Promise<Array<{translation_text:string}>>
 model:{config:{eos_token_id:number|number[];max_position_embeddings?:number}}
 tokenizer?:((text:string,options:{truncation:false;return_tensor:false})=>{input_ids:number[]})&{model_max_length?:number;src_lang?:string}
 dispose:()=>Promise<void>
}
/** Public pipeline streamer exposes the final generated token, so a token cap
 * cannot be mistaken for a complete translation. No prompt or JSON grammar.
 */
export async function inferTranslation(pipe:Pipeline,model:string,text:string,source:Language,target:Language,onActivity:()=>void):Promise<InferenceResult>{let last:bigint|undefined,generated=0,first=true
 const input=model.endsWith('opus-mt-en-ROMANCE')&&target==='pt'?`>>pt<< ${text}`:text
 if(pipe.tokenizer){if(model.includes('m2m100'))pipe.tokenizer.src_lang=source;const tokens=pipe.tokenizer(input,{truncation:false,return_tensor:false}).input_ids,limit=Math.min(384,pipe.tokenizer.model_max_length||384,pipe.model.config.max_position_embeddings||384);if(tokens.length>limit-8)return{text:'',complete:false}}
 const streamer:TokenStreamer={put(tokens){if(first){first=false;return}const sequence=tokens[0]||[];generated+=sequence.length;last=sequence.at(-1);onActivity()},end(){}}
 const output=await pipe(input,{...(model.includes('m2m100')?{src_lang:source,tgt_lang:target}:{}),max_new_tokens:256,do_sample:false,num_beams:1,streamer})
 const eos=pipe.model.config.eos_token_id,ids=Array.isArray(eos)?eos:[eos]
 return{text:output[0]?.translation_text||'',complete:generated>0&&generated<256&&last!==undefined&&ids.some(id=>Number(last)===id)}
}
