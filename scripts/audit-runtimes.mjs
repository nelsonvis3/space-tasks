import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises'
import {resolve} from 'node:path'
import {spawnSync} from 'node:child_process'
import {existsSync} from 'node:fs'
import {VENDOR_PACKAGES} from './vendor.mjs'
const root=resolve(import.meta.dirname,'..'),directory=resolve(root,'.cache/runtime-audit'),cache=resolve(root,'.cache/npm')
const dependencies=Object.fromEntries(VENDOR_PACKAGES.map(pkg=>[pkg.name,pkg.version]))
await mkdir(directory,{recursive:true});await writeFile(resolve(directory,'package.json'),JSON.stringify({private:true,dependencies},null,2)+'\n')
const install=spawnSync('npm',['install','--package-lock-only','--ignore-scripts','--no-fund','--audit=false','--prefix',directory,'--cache',cache],{cwd:root,stdio:'inherit'})
if(install.status!==0)process.exit(install.status||1)
const audit=spawnSync('npm',['audit','--json','--prefix',directory,'--cache',cache],{cwd:root,encoding:'utf8',maxBuffer:8*1024*1024})
let report;try{report=JSON.parse(audit.stdout)}catch{console.error('Runtime audit did not produce a report.');process.exit(2)}
await writeFile(resolve(directory,'report.json'),JSON.stringify(report,null,2)+'\n')
if(report.error||!report.metadata){console.error('Runtime audit failed; no vulnerability conclusion is available.');process.exit(2)}
// These are native libvips/libheif/librsvg issues. The app loads only the
// prebuilt browser bundle; neither the server nor installed app uses sharp.
// Keep the original findings in report.json; reject every unreviewed advisory.
const nodeOnly=new Set(['GHSA-f88m-g3jw-g9cj','GHSA-rgj7-g3m4-5g8c','GHSA-wq5f-xc86-pv6w'])
const pkg=JSON.parse(await readFile(resolve(root,'package.json'),'utf8')),worker=await readFile(resolve(root,'src/translation/translation.worker.ts'),'utf8')
const server=await Promise.all((await readdir(resolve(root,'server'))).filter(name=>name.endsWith('.mjs')).map(name=>readFile(resolve(root,'server',name),'utf8')))
const browserOnly=!existsSync(resolve(root,'node_modules/sharp'))&&![pkg.dependencies,pkg.devDependencies,pkg.optionalDependencies].some(deps=>deps?.sharp||deps?.['@huggingface/transformers'])&&worker.includes('/vendor/@huggingface/transformers@3.8.1/dist/transformers.min.js')&&!server.some(text=>/sharp|@huggingface\/transformers|libvips/.test(text))
const unresolved=[],scoped=[]
for(const[name,finding]of Object.entries(report.vulnerabilities||{})){
 const known=browserOnly&&((name==='sharp'&&finding.via.every(v=>typeof v==='object'&&nodeOnly.has(v.url.split('/').at(-1))))||(name==='@huggingface/transformers'&&finding.via.every(v=>v==='sharp')))
 if(known)scoped.push(name);else unresolved.push(name)
}
console.log(`Runtime npm graph: ${report.metadata.vulnerabilities.total} findings. Native-only scope exceptions: ${scoped.join(', ')||'none'}. Unreviewed: ${unresolved.join(', ')||'none'}.`)
console.log('Full report: .cache/runtime-audit/report.json. This does not audit model weights or certify absence of vulnerabilities.')
if(unresolved.length)process.exitCode=1
