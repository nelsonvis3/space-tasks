import {messages} from './locales/messages.ts'
export type Language = 'en'|'es'|'pt'|'fr'|'de'|'it'|'ja'
export const LANGUAGES: {code:Language;name:string;locale:string}[] = [
  {code:'en',name:'English',locale:'en-US'},
  {code:'es',name:'Español',locale:'es-AR'},
  {code:'pt',name:'Português',locale:'pt-BR'},
  {code:'fr',name:'Français',locale:'fr-FR'},
  {code:'de',name:'Deutsch',locale:'de-DE'},
  {code:'it',name:'Italiano',locale:'it-IT'},
  {code:'ja',name:'日本語',locale:'ja-JP'},
]
export const LANGUAGE_NAMES:Record<Language,string>={en:'English',es:'Spanish',pt:'Portuguese',fr:'French',de:'German',it:'Italian',ja:'Japanese'}
const LOCALES=['es','pt','fr','de','it','ja']
export function hasTranslation(language:Language,key:string){return language==='en'||!!messages[key]?.[LOCALES.indexOf(language)]}
export function t(language:Language,key:string):string{return language==='en'?key:messages[key]?.[LOCALES.indexOf(language)]??key}
