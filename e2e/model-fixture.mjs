import {test as base,expect} from 'playwright/test'
import {mkdir} from 'node:fs/promises'
import {resolve,basename} from 'node:path'
/** Dedicated synthetic-test profiles retain downloaded models between runs.
 * They never use the user's browser profile or real SPACE database. */
export const test=base.extend({context:async({playwright,browserName,baseURL,launchOptions},use)=>{
 const directory=resolve('.cache/test-model-profiles',launchOptions?.executablePath?basename(launchOptions.executablePath):browserName);await mkdir(directory,{recursive:true})
 const context=await playwright[browserName].launchPersistentContext(directory,{...launchOptions,headless:true,baseURL})
 try{await context.clearCookies();const cleanup=context.pages()[0]||await context.newPage();await cleanup.goto('/');await cleanup.evaluate(async()=>{localStorage.clear();await new Promise((resolve,reject)=>{const request=indexedDB.deleteDatabase('space-library');request.onsuccess=resolve;request.onerror=()=>reject(request.error);request.onblocked=()=>reject(Error('Test library is still open'))})});await cleanup.goto('about:blank');await use(context)}finally{await context.close()}
}})
export {expect}
