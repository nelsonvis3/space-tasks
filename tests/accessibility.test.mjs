import {test} from 'node:test'
import assert from 'node:assert/strict'
import {PALETTES,DEFAULT_PALETTE,paletteVariables,contrast} from '../src/productivity/palette.ts'
test('secondary text has normal-text contrast on every built-in palette and interactive surface',()=>{
 for(const preset of Object.keys(PALETTES))for(const theme of ['light','dark']){
  const vars=paletteVariables({...DEFAULT_PALETTE,preset},theme)
  for(const text of ['--faint','--muted'])for(const surface of ['--bg','--card','--card-soft','--card-hover'])assert.ok(contrast(vars[text],vars[surface])>=4.5,`${preset}/${theme}: ${text} on ${surface}`)
 }
})
