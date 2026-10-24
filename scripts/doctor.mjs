import {createServer} from 'node:net'
import {lookup} from 'node:dns/promises'
import {mkdir,writeFile,unlink} from 'node:fs/promises'
import {existsSync} from 'node:fs'
import {resolve} from 'node:path'
import {chromium,firefox,webkit} from 'playwright'
import {requireRuntime} from '../server/runtime.mjs'

const results=[]
async function check(name,run){try{const detail=await run();results.push({name,ok:true,detail})}catch(error){results.push({name,ok:false,code:error.code||error.cause?.code||error.name,detail:error.message})}}
await check('Runtime Node',async()=>{requireRuntime();return process.version})
await check('Servidor TCP local',()=>new Promise((resolve,reject)=>{const server=createServer();server.once('error',reject);server.listen(0,'127.0.0.1',()=>server.close(error=>error?reject(error):resolve('Conexiones locales permitidas')))}))
await check('DNS de npm',async()=>{await lookup('registry.npmjs.org');return'Nombre resuelto'})
await check('HTTPS de npm',async()=>{const response=await fetch('https://registry.npmjs.org/',{method:'HEAD',signal:AbortSignal.timeout(10000)});if(!response.ok)throw Error(`HTTP ${response.status}`);return`HTTP ${response.status}`})
await check('Caché npm dentro del proyecto',async()=>{const directory=resolve('.cache/npm');await mkdir(directory,{recursive:true});const file=resolve(directory,`.space-doctor-${process.pid}`);await writeFile(file,'',{flag:'wx'});await unlink(file);return directory})
for(const[name,browser]of Object.entries({chromium,firefox,webkit})){const installed=existsSync(name==='chromium'&&process.env.SPACE_BRAVE_PATH?process.env.SPACE_BRAVE_PATH:browser.executablePath());results.push({name:`Navegador ${name}`,ok:installed,detail:installed?'Ejecutable instalado':'Falta instalar: npm run test:browsers:install',optional:!process.argv.includes('--browsers')||(name==='webkit'&&process.env.SPACE_TEST_WEBKIT!=='1')})}
for(const result of results)console.log(`${result.ok?'OK':result.optional?'PENDIENTE':'ERROR'} · ${result.name}: ${result.code?result.code+' · ':''}${result.detail}`)
if(results.some(result=>!result.ok&&!result.optional)){
 console.error('Revisá docs/testing-environment.md. EPERM en TCP y EAI_AGAIN en DNS requieren corregir los permisos de la sesión; este diagnóstico no modifica el firewall ni el DNS.')
 process.exitCode=2
}
