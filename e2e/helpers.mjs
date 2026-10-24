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
