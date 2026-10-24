import {test,expect} from 'playwright/test'
import {workspace,room,noOverflow} from './helpers.mjs'
test('touch navigation, narrow screens and all dock edges keep tasks usable',async({page},info)=>{
 const errors=[];page.on('pageerror',error=>errors.push(error.message))
 await workspace(page)
 await page.setViewportSize({width:320,height:740})
 await room(page,'Tasks')
 await page.getByRole('button',{name:'New task',exact:true}).tap()
 const title='A long task '+ 'planificación'.repeat(6)
 await page.getByLabel('Title',{exact:true}).fill(title)
 await page.getByRole('button',{name:'Create task',exact:true}).tap()
 await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible()
 await page.getByLabel(`Status: ${title}`,{exact:true}).selectOption('in-progress')
 await noOverflow(page)
 // Native form controls must not trigger iOS's small-input focus zoom.
 expect(await page.getByLabel(`Status: ${title}`,{exact:true}).evaluate(node=>parseFloat(getComputedStyle(node).fontSize))).toBeGreaterThanOrEqual(16)
 for(const position of ['top','left','right','bottom']){
  await page.getByRole('navigation',{name:'Main navigation'}).getByRole('button',{name:'Dock settings',exact:true}).tap()
  const dialog=page.getByRole('dialog')
  await dialog.getByLabel('Position',{exact:true}).selectOption(position)
  await dialog.getByLabel('Icon size',{exact:true}).focus();await page.keyboard.press('End')
  await dialog.getByRole('button',{name:'Done',exact:true}).tap()
  await room(page,'Calendar');await noOverflow(page)
  if(position!=='bottom')expect(await page.locator('.dock-region:not(.dock-preview)').evaluate(node=>node.getBoundingClientRect().top)).toBeGreaterThanOrEqual(await page.locator('.space-topbar').evaluate(node=>node.getBoundingClientRect().bottom))
  await room(page,'Tasks');await expect(page.getByRole('heading',{name:title,exact:true})).toBeVisible()
 }
 await page.getByRole('button',{name:'Create workspace',exact:true}).tap()
 await page.getByLabel('Workspace name',{exact:true}).fill('Mobile workspace')
 await page.getByRole('dialog').getByRole('button',{name:'Create workspace',exact:true}).tap()
 await expect(page.getByRole('combobox',{name:'Workspaces',exact:true})).toContainText('Mobile workspace')
 await page.screenshot({path:info.outputPath('mobile-workspace.png'),fullPage:true})
 expect(errors).toEqual([])
})
