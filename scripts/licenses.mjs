import {readFile,readdir,mkdir,writeFile,copyFile} from 'node:fs/promises'
import {resolve} from 'node:path'
const root=resolve(import.meta.dirname,'..'),lock=JSON.parse(await readFile(resolve(root,'package-lock.json'),'utf8')),output=resolve(root,'public/licenses')
await mkdir(output,{recursive:true})
await copyFile(resolve(root,'LICENSE'),resolve(output,'GPL-3.0.txt'))
for(const name of ['dmsans','spacegrotesk'])await copyFile(resolve(root,`public/fonts/${name}-OFL.txt`),resolve(output,`${name}-OFL.txt`))
const records=[],missing=[]
for(const[path,pkg]of Object.entries(lock.packages)){
 if(!path)continue
 const name=path.split('node_modules/').at(-1),license=pkg.license||'UNKNOWN',texts=[]
 if(license==='UNKNOWN')missing.push(`${name}@${pkg.version}`)
 let files,installed=true;try{files=await readdir(resolve(root,path))}catch(error){if(error.code!=='ENOENT')throw error;files=[];installed=false}
 for(const file of files.filter(name=>/^(?:license|licence|copying|notice)(?:\..*)?$/i.test(name))){
  const target=`${name.replaceAll('/','__')}@${pkg.version}-${file.replaceAll('/','_')}`
  await copyFile(resolve(root,path,file),resolve(output,target));texts.push(target)
 }
 // Native binding packages omit LICENSE; the same upstream release supplies it.
 if(name==='rolldown'||name.startsWith('@rolldown/binding-')){
  if(pkg.version!=='1.2.15'||lock.packages['node_modules/rolldown']?.version!==pkg.version||license!=='MIT')throw Error('Review upstream Rolldown notices for '+pkg.version)
  if(!texts.length){
   const target='rolldown@1.2.15-LICENSE'
   await copyFile(resolve(root,'node_modules/rolldown/LICENSE'),resolve(output,target))
   texts.push(target)
  }
  const upstream='rolldown@1.2.15-THIRD-PARTY-LICENSE'
  await readFile(resolve(output,upstream))
  texts.push(upstream)
 }
 if(installed&&!texts.length)missing.push(`${name}@${pkg.version} (installed without a license text)`)
 records.push({name,version:pkg.version,license,installed,development:!!pkg.dev,optional:!!pkg.optional,notices:texts})
}
records.sort((a,b)=>a.name.localeCompare(b.name))
const inventory=['SPACE: GPL-3.0-only for original program code. See GPL-3.0.txt and LICENSING.md.','Third-party files retain their own licenses and copyright notices.','The SPACE Tasks logo files are © 2023 Nelson Sivisstum, all rights reserved: redistribute them unmodified with SPACE Tasks; forks must use their own logo. Books are excluded. See LICENSING.md.','',...records.flatMap(p=>[`${p.name}@${p.version}: ${p.license}${p.development?' (development)':''}${p.optional?' (optional)':''}`,p.notices.length?'  Notices: '+p.notices.join(', '):'  Not installed here; obtain upstream notices before distributing this optional platform binary.']),'','External runtimes, fonts, models and audio:',await readFile(resolve(root,'THIRD_PARTY_NOTICES.md'),'utf8')].join('\n')
await writeFile(resolve(output,'THIRD_PARTY_NOTICES.txt'),inventory+'\n')
await writeFile(resolve(output,'npm-inventory.json'),JSON.stringify(records,null,2)+'\n')
if(missing.length)throw Error('Review missing dependency licenses: '+missing.join(', '))
console.log(`License inventory: ${records.length} dependency entries, original notices preserved.`)
