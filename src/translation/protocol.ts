import type {Language} from '../i18n'
export type TranslationState={status:'idle'|'loading'|'translating'|'ready'|'error';progress:number;downloaded:number;total:number;model:string;error:string}
export type TranslationRequest={id:number;type:'translate';text:string;source:Language;target:Language}
export type TranslationResponse={id:number;type:'download';loaded:number;total:number;model:string}|{id:number;type:'activity'}|{id:number;type:'working'}|{id:number;type:'part';text:string;progress:number}|{id:number;type:'done';text:string;verified:boolean;review?:boolean}|{id:number;type:'error';message:string}
