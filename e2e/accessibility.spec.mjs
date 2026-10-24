import {test,expect} from 'playwright/test'
import AxeBuilder from '@axe-core/playwright'
import {workspace,room,noOverflow} from './helpers.mjs'
async function accessible(page,info,label){
 const result=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa','wcag22aa']).analyze()
 if(result.violations.length)await info.attach(`${label}-accessibility.json`,{body:JSON.stringify(result.violations,null,2),contentType:'application/json'})
 expect(result.violations.map(v=>({id:v.id,impact:v.impact,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})),label).toEqual([])
 await noOverflow(page)
}
test('main rooms and customization have accessible controls in light and dark themes',async({page},info)=>{
 test.setTimeout(180000)
 await page.goto('/');await accessible(page,info,'sign-in')
 await workspace(page)
 for(const name of ['Productivity room','Tasks','Calendar','Statistics room','Study and activities','Assistant','Music']){await room(page,name);await accessible(page,info,name)}
 await page.getByRole('button',{name:'Color palette',exact:true}).click();await accessible(page,info,'palette');await page.getByRole('dialog').getByRole('button',{name:'Done',exact:true}).click()
 await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Dock settings',exact:true}).click();await accessible(page,info,'dock');expect(await page.locator('main').evaluate(node=>node.inert)).toBeTruthy();await page.getByRole('dialog').getByRole('button',{name:'Done',exact:true}).click();expect(await page.locator('main').evaluate(node=>node.inert)).toBeFalsy()
 await expect(page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Dock settings',exact:true})).toBeFocused()
 await page.getByRole('button',{name:'Your account',exact:true}).click();await accessible(page,info,'account');await page.getByRole('dialog').getByRole('button',{name:'Close',exact:true}).click();await expect(page.getByRole('button',{name:'Your account',exact:true})).toBeFocused()
 await page.getByRole('button',{name:'Light mode',exact:true}).click();await room(page,'Productivity room');await accessible(page,info,'light-overview')
 await page.screenshot({path:info.outputPath('light-overview.png'),fullPage:true})
})
