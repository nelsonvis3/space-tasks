import {hasTranslation,LANGUAGES} from '../src/i18n.ts'
import {writeFileSync} from 'node:fs'
import {uiKeys} from './i18n-keys.mjs'
const{keys,hardcoded}=uiKeys();writeFileSync('/tmp/orbit-i18n-keys.json',JSON.stringify(keys,null,2));const missing=LANGUAGES.flatMap(({code})=>keys.filter(k=>!hasTranslation(code,k)).map(key=>`${code}: ${key}`));console.log(JSON.stringify({keys:keys.length,hardcoded,missing},null,2));if(missing.length)process.exitCode=1
