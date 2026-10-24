import {expect} from 'playwright/test'
import {randomUUID} from 'node:crypto'
export const origin='http://127.0.0.1:4179'
export async function workspace(page,data={}){
 const response=await page.request.post('/api/auth/register',{headers:{origin},data:{username:`qa-${randomUUID().slice(0,12)}`,password:'test-only-long-password'}})
 expect(response.ok()).toBeTruthy()
 const session=await response.json()
 const saved=await page.request.put('/api/document',{headers:{origin,'x-csrf-token':session.csrf},data:{revision:0,data:{'orbit:onboarding:v1':'done','orbit-tasks:language:v1':'en','orbit-tasks:profile:v1':JSON.stringify({name:'QA Reader',goal:'Focus'}),'orbit:tasks:v2':'[]',...data}}})
 expect(saved.ok()).toBeTruthy()
 await page.goto('/')
 await expect(page.getByRole('heading',{name:'Welcome, QA Reader'})).toBeVisible()
 return session
}
export async function room(page,name){await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name,exact:true}).click()}
export async function noOverflow(page){const viewport=page.viewportSize().width;expect(await page.evaluate(()=>document.documentElement.scrollWidth)).toBeLessThanOrEqual(viewport)}
/** An original image-only PDF: canvas pixels become a PDF image XObject, so only real OCR can read it. */
export async function scannedPdf(page){
 const bytes=await page.evaluate(()=>{
  const canvas=document.createElement('canvas');canvas.width=800;canvas.height=220;const context=canvas.getContext('2d');context.fillStyle='white';context.fillRect(0,0,800,220);context.fillStyle='black';context.font='30px sans-serif';context.fillText('Study for 25 minutes.',35,80);context.fillText('Review 3 topics before taking a break.',35,145)
  const rgba=context.getImageData(0,0,800,220).data,rgb=new Uint8Array(800*220*3);for(let i=0,j=0;i<rgba.length;i+=4){rgb[j++]=rgba[i];rgb[j++]=rgba[i+1];rgb[j++]=rgba[i+2]}
  const encode=text=>new TextEncoder().encode(text),content='q 800 0 0 220 0 0 cm /Im0 Do Q',objects=[encode('<< /Type /Catalog /Pages 2 0 R >>'),encode('<< /Type /Pages /Kids [3 0 R] /Count 1 >>'),encode('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 800 220] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>'),encode(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`)],parts=[encode('%PDF-1.4\n')],offsets=[0];let size=parts[0].length
  function append(bytes){parts.push(bytes);size+=bytes.length}
  for(let i=0;i<5;i++){offsets.push(size);append(encode(`${i+1} 0 obj\n`));if(i<4)append(objects[i]);else{append(encode(`<< /Type /XObject /Subtype /Image /Width 800 /Height 220 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Length ${rgb.length} >>\nstream\n`));append(rgb);append(encode('\nendstream'))}append(encode('\nendobj\n'))}
  const xref=size;append(encode('xref\n0 6\n0000000000 65535 f \n'+offsets.slice(1).map(offset=>String(offset).padStart(10,'0')+' 00000 n \n').join('')+`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`));const pdf=new Uint8Array(size);let position=0;for(const part of parts){pdf.set(part,position);position+=part.length}return Array.from(pdf)
 })
 return Buffer.from(bytes)
}
/** Opens the scanned PDF, runs OCR and translation into the interface language and returns both texts. */
export async function extractAndTranslate(page,{read,action}){
 await page.locator('.library-books article').filter({hasText:'scan-notes.pdf'}).getByRole('button',{name:read,exact:true}).click();await page.locator('.translation-source select').selectOption('en');await page.locator('.reader-tools summary').click();await page.locator('.reader-tools').getByRole('button',{name:new RegExp('^'+action)}).click()
 await Promise.race([expect(page.locator('.translated-text')).toBeVisible({timeout:600000}),page.locator('.assistant-error[role=alert]').first().waitFor({state:'visible',timeout:600000}).then(async()=>{throw Error(await page.locator('.assistant-error[role=alert]').first().innerText())})]);await expect(page.locator('.reader-translation .translation-progress')).toHaveCount(0,{timeout:600000});await expect(page.locator('.reader-translation [role=alert]')).toHaveCount(0)
 return{original:await page.locator('.book-text').textContent(),text:await page.locator('.translated-text').innerText()}
}
