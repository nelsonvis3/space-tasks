import {test,expect} from './model-fixture.mjs'
import {t} from '../src/i18n.ts'
import {scannedPdf,extractAndTranslate} from './helpers.mjs'
test('a scanned English PDF is recognized locally and translated into the Spanish interface language',async({page},info)=>{
 await page.addInitScript(()=>{for(const[key,value]of Object.entries({'orbit:onboarding:v1':'done','orbit-tasks:language:v1':'es','orbit-tasks:profile:v1':JSON.stringify({name:'OCR Reader',goal:''})}))localStorage.setItem(key,value)})
 await page.goto('/');await page.getByRole('button',{name:t('es','Continue on this device'),exact:true}).click();await page.getByRole('navigation',{name:t('es','Main navigation')}).getByRole('button',{name:t('es','Study and activities'),exact:true}).click();await page.getByRole('button',{name:new RegExp(t('es','My PDF library'))}).click()
 const buffer=await scannedPdf(page);await info.attach('original-scan.pdf',{body:buffer,contentType:'application/pdf'});await page.locator('input[type=file]').setInputFiles({name:'scan-notes.pdf',mimeType:'application/pdf',buffer})
 const {original,text}=await extractAndTranslate(page,{read:t('es','Read'),action:t('es','Extract and translate')});expect(text).toMatch(/estudi|repas|temas|minutos/i);expect(text).toContain('25');expect(text).toContain('3');await expect(page.locator('.translated-text')).toHaveAttribute('lang','es');await info.attach('ocr-translation.json',{body:JSON.stringify({source:'en',target:'es',original,text},null,2),contentType:'application/json'})
})
