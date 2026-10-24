import {test} from 'node:test'
import assert from 'node:assert/strict'
import {uiKeys} from '../scripts/i18n-keys.mjs'
import {hasTranslation,t,LANGUAGES} from '../src/i18n.ts'
import {messages} from '../src/locales/messages.ts'
test('every UI string, dynamic control label and API error has all seven interface languages',()=>{for(const key of uiKeys().keys){for(const {code}of LANGUAGES){assert.ok(hasTranslation(code,key),`${code}: ${key}`);assert.ok(t(code,key).trim())}assert.equal(messages[key].length,6)}assert.equal(t('es','Restore default'),'Restaurar valor original');assert.equal(t('ja','Text reading'),'テキストで読む');assert.ok(LANGUAGES.every(l=>!('flag'in l)))})
test('only brand and original book titles are literal JSX text',()=>{const allowed=new Set(['SPACE','College Success — OpenStax']);for(const item of uiKeys().hardcoded)assert.ok(allowed.has(item.text),`${item.file}: ${item.text}`)})
