import {defineConfig,devices} from 'playwright/test'
const model=process.env.SPACE_MODEL_TEST==='1',ocr=process.env.SPACE_OCR_TEST==='1'
const includeWebkit=process.env.SPACE_TEST_WEBKIT==='1'
const suite=(model?'translation':ocr?'ocr':'core')+(process.env.SPACE_BRAVE_PATH?'-brave':'')
export default defineConfig({
 testDir:'./e2e',testMatch:model?'translation.spec.mjs':ocr?'ocr.spec.mjs':['productivity.spec.mjs','accessibility.spec.mjs','mobile.spec.mjs'],
 fullyParallel:false,workers:1,retries:0,timeout:model||ocr?900000:90000,
 expect:{timeout:10000},outputDir:`test-results/${suite}`,
 reporter:[['list'],['html',{open:'never',outputFolder:`playwright-report/${suite}`}],['json',{outputFile:`playwright-report/${suite}/results.json`}]],
 use:{baseURL:'http://127.0.0.1:4179',trace:'retain-on-failure',screenshot:'only-on-failure'},
 projects:model?[{name:'chromium',use:{...devices['Desktop Chrome'],...(process.env.SPACE_BRAVE_PATH?{launchOptions:{executablePath:process.env.SPACE_BRAVE_PATH}}:{})}}]:[
  {name:process.env.SPACE_BRAVE_PATH?'brave':'chromium',testMatch:ocr?'ocr.spec.mjs':['productivity.spec.mjs','accessibility.spec.mjs'],use:{...devices['Desktop Chrome'],...(process.env.SPACE_BRAVE_PATH?{launchOptions:{executablePath:process.env.SPACE_BRAVE_PATH}}:{})}},
  {name:'firefox',testMatch:ocr?'ocr.spec.mjs':['productivity.spec.mjs','accessibility.spec.mjs'],use:{...devices['Desktop Firefox']}},
  ...includeWebkit?[{name:'webkit',testMatch:ocr?'ocr.spec.mjs':['productivity.spec.mjs','accessibility.spec.mjs'],use:{...devices['Desktop Safari']}}]:[],
  ...ocr?[]:[
   {name:'small-window',testMatch:['mobile.spec.mjs','accessibility.spec.mjs'],use:{browserName:'chromium',viewport:{width:390,height:844},hasTouch:true,isMobile:true,...(process.env.SPACE_BRAVE_PATH?{launchOptions:{executablePath:process.env.SPACE_BRAVE_PATH}}:{})}},
  ],
 ],
 webServer:{command:'node scripts/e2e-server.mjs',url:'http://127.0.0.1:4179',reuseExistingServer:false,timeout:30000,gracefulShutdown:{signal:'SIGTERM',timeout:5000}},
})
