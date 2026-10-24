import {mkdir,open,rename,unlink,access,copyFile,writeFile} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {execFileSync} from 'node:child_process'
import {createReadStream} from 'node:fs'
import {resolve} from 'node:path'
import {NODE_VERSION} from '../server/runtime.mjs'
const sums={x64:'6c172a9ab6718f7b801fb5a7bd486af2ee5e32758086a04b84fcce2aa77095e6',arm64:'dbabf7a1cbf947e6059ffad2c27b80041db97dea1e553b62afdee7f13fca336e'}
if(process.platform!=='linux'||!sums[process.arch]||!process.report.getReport().header.glibcVersionRuntime)throw new Error('Automatic local installation supports Linux glibc x64/arm64. Install Node 24.22.1 or newer 24.x through your system tools on other platforms.')
const root=resolve(import.meta.dirname,'..'),folder=resolve(root,'.cache/node'),name=`node-v${NODE_VERSION}-linux-${process.arch}`,archive=resolve(folder,name+'.tar.xz'),temporary=archive+'.partial',executable=resolve(folder,name,'bin/node')
await mkdir(folder,{recursive:true,mode:0o700})
let installed=false;try{await access(executable);installed=execFileSync(executable,['--version'],{encoding:'utf8'}).trim()===`v${NODE_VERSION}`}catch{/* Download a verified runtime when no working copy exists. */}
if(!installed){
 const origin=`https://nodejs.org/dist/v${NODE_VERSION}/`,index=process.argv.indexOf('--archive'),provided=index>=0?process.argv[index+1]:null
 if(index>=0&&!provided)throw new Error('--archive requires a local archive path')
 const response=provided?null:await fetch(origin+name+'.tar.xz',{signal:AbortSignal.timeout(120000)})
 if(response&&(!response.ok||!response.body))throw new Error(`Node download failed: HTTP ${response.status}`)
 const body=provided?createReadStream(resolve(provided)):response.body
 await unlink(temporary).catch(error=>{if(error.code!=='ENOENT')throw error})
 const file=await open(temporary,'wx',0o600),hash=createHash('sha256');let size=0
 try{for await(const chunk of body){size+=chunk.length;if(size>100*1024*1024)throw new Error('Runtime archive exceeds the download budget');hash.update(chunk);await file.writeFile(chunk)}if(hash.digest('hex')!==sums[process.arch])throw new Error('Node SHA-256 verification failed; archive will not be executed')}catch(error){await file.close();await unlink(temporary).catch(()=>{});throw error}
 await file.close();await rename(temporary,archive)
 execFileSync('tar',['--extract','--xz','--file',archive,'--directory',folder,'--no-same-owner','--no-same-permissions'],{stdio:'inherit'})
 if(execFileSync(executable,['--version'],{encoding:'utf8'}).trim()!==`v${NODE_VERSION}`)throw new Error('The extracted Node version did not match')
 await writeFile(resolve(folder,'verification.json'),JSON.stringify({version:NODE_VERSION,platform:process.platform,arch:process.arch,archive:name+'.tar.xz',sha256:sums[process.arch],source:origin},null,2)+'\n')
}
await mkdir(resolve(root,'public/licenses'),{recursive:true})
await copyFile(resolve(folder,name,'LICENSE'),resolve(root,`public/licenses/Node-${NODE_VERSION}-LICENSE.txt`))
console.log(`Node ${NODE_VERSION} verified locally. No system installation was changed. Use: npm run runtime -- run dev`)
