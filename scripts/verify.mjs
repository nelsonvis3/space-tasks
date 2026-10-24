import {spawnSync} from 'node:child_process'
const release=process.argv.includes('--release')
const commands=[['run','typecheck'],['test'],['run','test:i18n'],['run','build'],['run','test:e2e:list']]
if(release)commands.unshift(['run','doctor','--','--browsers'])
if(release)commands.push(['audit','--audit-level=high'],['run','audit:runtimes'],['run','test:e2e'],['run','test:translation:real'],['run','test:ocr:real'])
for(const args of commands){const result=spawnSync('npm',args,{stdio:'inherit'});if(result.error){console.error(result.error.message);process.exit(1)}if(result.status!==0)process.exit(result.status||1)}
