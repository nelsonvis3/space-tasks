// The complete desktop app (Electron) with its in-process server, driven like a user would.
import {test,expect,_electron} from 'playwright/test'
import {createRequire} from 'node:module'
import {mkdtempSync,readFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {scannedPdf,extractAndTranslate} from './helpers.mjs'
import {t} from '../src/i18n.ts'
const root=join(import.meta.dirname,'..'),electron=createRequire(import.meta.url)('electron')
const profileDir=()=>mkdtempSync(join(tmpdir(),'space-desktop-test-'))
async function open(profile){
 const app=await _electron.launch({executablePath:electron,args:[root,`--user-data-dir=${profile}`],env:{...process.env,SPACE_DESKTOP_HIDDEN:'1'}})
 const page=await app.firstWindow();const errors=[];page.on('pageerror',error=>errors.push(error.message));return{app,page,errors}
}
const room=(page,name)=>page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name,exact:true}).click()
const saved=page=>expect(page.locator('.account-button')).toHaveAttribute('data-status','saved',{timeout:20000})
async function register(page,username,name){
 await page.locator('.auth-language select').selectOption('en')
 await page.getByRole('button',{name:'New here? Create an account',exact:true}).click()
 await page.getByLabel('Username',{exact:true}).fill(username);await page.getByLabel('Password',{exact:true}).fill(`${username}-password`);await page.getByRole('button',{name:'Create account',exact:true}).click()
 await page.getByLabel('Display name',{exact:true}).fill(name);for(let i=0;i<2;i++)await page.getByRole('button',{name:'Continue',exact:true}).click();await page.getByRole('button',{name:'Enter my space',exact:true}).click()
 await expect(page.getByRole('heading',{name:`Welcome, ${name}`})).toBeVisible()
}
async function signIn(page,username){await page.getByLabel('Username',{exact:true}).fill(username);await page.getByLabel('Password',{exact:true}).fill(`${username}-password`);await page.getByRole('button',{name:'Sign in',exact:true}).click()}
async function signOut(page){await page.getByRole('button',{name:'Your account',exact:true}).click();await page.getByRole('dialog').getByRole('button',{name:'Sign out',exact:true}).click();await expect(page.getByRole('button',{name:'Sign in',exact:true})).toBeVisible()}
async function createTask(page,title){await room(page,'Tasks');await page.getByRole('button',{name:'New task',exact:true}).click();await page.getByRole('dialog').getByLabel('Title',{exact:true}).fill(title);await page.getByRole('dialog').getByRole('button',{name:'Create task',exact:true}).click();await saved(page)}
function song(seconds=2,rate=44100){const samples=seconds*rate,data=Buffer.alloc(44+samples*2);data.write('RIFF',0);data.writeUInt32LE(36+samples*2,4);data.write('WAVEfmt ',8);data.writeUInt32LE(16,16);data.writeUInt16LE(1,20);data.writeUInt16LE(1,22);data.writeUInt32LE(rate,24);data.writeUInt32LE(rate*2,28);data.writeUInt16LE(2,32);data.writeUInt16LE(16,34);data.write('data',36);data.writeUInt32LE(samples*2,40);for(let i=0;i<samples;i++)data.writeInt16LE(Math.round(Math.sin(2*Math.PI*440*i/rate)*8000),44+i*2);return data}

test('separate accounts stay isolated, the session survives a restart and the legal section is in the account panel',async()=>{
 const profile=profileDir();let {app,page,errors}=await open(profile)
 try{
  await register(page,'alice','Alice');await createTask(page,'Alice private task')
  await page.getByRole('button',{name:'Your account',exact:true}).click();const panel=page.getByRole('dialog')
  await panel.getByText('Legal and help',{exact:true}).click();await expect(panel.getByRole('heading',{name:'Privacy policy'})).toBeVisible()
  await expect(panel.getByRole('link',{name:'Report a problem'})).toHaveAttribute('href','https://github.com/nelsonvis3/space-tasks/issues/new')
  await panel.getByRole('button',{name:'Close',exact:true}).click();await signOut(page)
  await register(page,'bob','Bob');await room(page,'Tasks');await expect(page.getByRole('heading',{name:'Alice private task'})).toHaveCount(0)
  await createTask(page,'Bob private task');await signOut(page)
  await signIn(page,'alice');await room(page,'Tasks');await expect(page.getByRole('heading',{name:'Alice private task',exact:true})).toBeVisible();await expect(page.getByRole('heading',{name:'Bob private task'})).toHaveCount(0)
  expect(errors).toEqual([])
 }finally{await app.close()}
 ;({app,page,errors}=await open(profile))
 try{await expect(page.getByRole('heading',{name:'Welcome, Alice'})).toBeVisible();expect(errors).toEqual([])}finally{await app.close()}
})

test('built-in loops and the user’s own songs play, and the songs are still there after a restart',async()=>{
 const profile=profileDir();let {app,page,errors}=await open(profile)
 try{
  await register(page,'listener','Listener');await room(page,'Music');const card=page.locator('.music-card')
  await card.getByRole('button',{name:'Play music',exact:true}).click();await expect(page.locator('.music-equalizer--playing')).toBeVisible()
  await card.getByLabel('Choose lo-fi music track').selectOption({label:'🌇 Sunset walk'});await expect(card.locator('.now-playing')).toContainText('Sunset walk');await expect(page.locator('.music-equalizer--playing')).toBeVisible()
  await card.locator('input[type=file]').setInputFiles({name:'my-song.wav',mimeType:'audio/wav',buffer:song()});await expect(card.locator('.music-library li')).toContainText('my-song')
  await card.getByLabel('Choose lo-fi music track').selectOption({label:'🎵 my-song'});await expect(card.locator('.now-playing')).toContainText('my-song');await expect(page.locator('.music-equalizer--playing')).toBeVisible()
  await card.getByRole('button',{name:'Pause music',exact:true}).click();await saved(page);expect(errors).toEqual([])
 }finally{await app.close()}
 ;({app,page,errors}=await open(profile))
 try{await room(page,'Music');await expect(page.locator('.music-card .music-library li')).toContainText('my-song');expect(errors).toEqual([])}finally{await app.close()}
})

test('the PDF library stores files in the local server and reads them',async()=>{
 const {app,page,errors}=await open(profileDir())
 try{
  await register(page,'reader','Reader');await room(page,'Study and activities');await page.getByRole('button',{name:/My PDF library/}).click()
  await page.locator('input[type=file]').setInputFiles(join(root,'e2e/fixtures/notes.pdf'));const book=page.locator('.library-books article').filter({hasText:'notes.pdf'})
  await book.getByRole('button',{name:'Read',exact:true}).click();await expect(page.locator('.book-text')).toContainText('Study for 25 minutes.',{timeout:60000})
  await page.getByRole('button',{name:'Back to library',exact:true}).click()
  const large=Buffer.concat([readFileSync(join(root,'e2e/fixtures/notes.pdf')),Buffer.alloc(8*1024*1024,32)])
  await page.locator('input[type=file]').setInputFiles({name:'large.pdf',mimeType:'application/pdf',buffer:large});await expect(page.locator('.library-books article').filter({hasText:'large.pdf'})).toBeVisible({timeout:30000})
  expect((await page.evaluate(()=>fetch('/api/books').then(r=>r.json()))).find(book=>book.name==='large.pdf').size).toBe(large.length)
  expect(errors).toEqual([])
 }finally{await app.close()}
})

test('OCR and translation run on the desktop with real models',async()=>{
 test.skip(process.env.SPACE_MODEL_TEST!=='1','Downloads models: run with SPACE_MODEL_TEST=1')
 const {app,page}=await open(profileDir())
 try{
  // Desktop accounts are local, so OCR runs in a normal account with the interface switched to Spanish.
  await register(page,'scanner','Scanner');await page.locator('.language-picker select').selectOption('es')
  await page.getByRole('navigation',{name:t('es','Main navigation')}).getByRole('button',{name:t('es','Study and activities'),exact:true}).click();await page.getByRole('button',{name:new RegExp(t('es','My PDF library'))}).click()
  await page.locator('input[type=file]').setInputFiles({name:'scan-notes.pdf',mimeType:'application/pdf',buffer:await scannedPdf(page)})
  const {text}=await extractAndTranslate(page,{read:t('es','Read'),action:t('es','Extract and translate')})
  expect(text).toMatch(/estudi|repas|temas|minutos/i);expect(text).toContain('25');expect(text).toContain('3')
 }finally{await app.close()}
})

test('the assistant finds WebGPU in the desktop app',async()=>{
 const {app,page}=await open(profileDir())
 try{
  const gpu=await page.evaluate(async()=>{if(!navigator.gpu)return'no navigator.gpu';const adapter=await navigator.gpu.requestAdapter();return adapter?'adapter':'no adapter'})
  test.info().annotations.push({type:'webgpu',description:gpu})
  expect(gpu).toBe('adapter')
 }finally{await app.close()}
})

test('the on-device assistant downloads its model and answers',async()=>{
 test.skip(process.env.SPACE_AI_TEST!=='1','Downloads the assistant model (hundreds of MB): run with SPACE_AI_TEST=1')
 test.setTimeout(1200000)
 const {app,page,errors}=await open(profileDir())
 try{
  await register(page,'thinker','Thinker');await room(page,'Assistant')
  await page.getByRole('button',{name:'Enable local assistant',exact:true}).click()
  await page.getByLabel('Ask the AI assistant').fill('Give me one short tip to start studying.')
  // Send stays disabled until the model has downloaded and loaded.
  await expect(page.getByRole('button',{name:'Send',exact:true})).toBeEnabled({timeout:900000});await page.getByRole('button',{name:'Send',exact:true}).click()
  const log=page.getByLabel('AI chat messages')
  // The answer streams in; it is complete when the cancel control goes away.
  const cancel=page.getByRole('button',{name:'Cancel response',exact:true});await expect(cancel).toBeVisible({timeout:60000});await expect(cancel).toHaveCount(0,{timeout:300000});await expect(page.getByRole('button',{name:'Send',exact:true})).toBeVisible()
  const answer=(await log.innerText()).split('Give me one short tip to start studying.').pop().trim()
  test.info().annotations.push({type:'answer',description:answer.slice(0,300)})
  expect(answer.length).toBeGreaterThan(20);expect(errors).toEqual([])
 }finally{await app.close()}
})
