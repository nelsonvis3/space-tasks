import {defineConfig} from 'playwright/test'
// The desktop app (Electron) after `npm run build`. Models and OCR run only with SPACE_MODEL_TEST=1.
const models=process.env.SPACE_MODEL_TEST==='1'
export default defineConfig({
 testDir:'./e2e',testMatch:'desktop.spec.mjs',fullyParallel:false,workers:1,retries:0,timeout:models?900000:180000,
 expect:{timeout:15000},use:{actionTimeout:20000},outputDir:'test-results/desktop',
 reporter:[['list'],['html',{open:'never',outputFolder:'playwright-report/desktop'}]],
})
