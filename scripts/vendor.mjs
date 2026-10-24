// Copies the browser runtimes from their npm tarballs into public/vendor, verified against pinned
// sha512 integrity, so the app never executes code fetched from a CDN while it runs.
// They are not npm dependencies because @huggingface/transformers would install sharp and onnxruntime-node.
import {createHash} from 'node:crypto'
import {cpSync,existsSync,mkdirSync,mkdtempSync,readFileSync,rmSync,writeFileSync} from 'node:fs'
import {spawnSync} from 'node:child_process'
import {dirname,join,resolve} from 'node:path'
import {tmpdir} from 'node:os'
export const VENDOR_PACKAGES=[
 {name:'pdfjs-dist',version:'5.4.149',integrity:'sha512-Xe8/1FMJEQPUVSti25AlDpwpUm2QAVmNOpFP0SIahaPIOKBKICaefbzogLdwey3XGGoaP4Lb9wqiw2e9Jqp0LA==',files:['build/pdf.min.mjs','build/pdf.worker.min.mjs','cmaps','standard_fonts','wasm','LICENSE']},
 {name:'tesseract.js',version:'6.0.1',integrity:'sha512-/sPvMvrCtgxnNRCjbTYbr7BRu0yfWDsMZQ2a/T5aN/L1t8wUQN6tTWv6p6FwzpoEBA0jrN2UD2SX4QQFRdoDbA==',files:['dist/tesseract.min.js','dist/worker.min.js','LICENSE.md']},
 {name:'tesseract.js-core',version:'6.0.0',integrity:'sha512-1Qncm/9oKM7xgrQXZXNB+NRh19qiXGhxlrR8EwFbK5SaUbPZnS5OMtP/ghtqfd23hsr1ZvZbZjeuAGcMxd/ooA==',files:['tesseract-core-lstm.wasm.js','tesseract-core-simd-lstm.wasm.js','LICENSE']},
 {name:'@huggingface/transformers',version:'3.8.1',integrity:'sha512-tsTk4zVjImqdqjS8/AOZg2yNLd1z9S5v+7oUPpXaasDRwEDhB+xnglK1k5cad26lL5/ZIaeREgWWy0bs9y9pPA==',files:['dist/transformers.min.js','dist/ort-wasm-simd-threaded.jsep.mjs','dist/ort-wasm-simd-threaded.jsep.wasm','LICENSE']},
 {name:'@mlc-ai/web-llm',version:'0.2.85',integrity:'sha512-CwUiSAvDCYnmAZlpPMkurPHDfBLq6fvdRB3vRgoA894hRG/V/BSeY9bmMm6iIIU5VpjJxfb/dLPpJX2at0L9rw==',files:['lib/index.js','LICENSE']},
]
const root=resolve(import.meta.dirname,'..'),cache=join(root,'.cache/vendor'),out=join(root,'public/vendor')
const integrityOf=bytes=>'sha512-'+createHash('sha512').update(bytes).digest('base64')
async function tarball({name,version,integrity}){
 const file=join(cache,`${name.replace('/','__')}-${version}.tgz`)
 if(existsSync(file)&&integrityOf(readFileSync(file))===integrity)return file
 const url=`https://registry.npmjs.org/${name}/-/${name.split('/').pop()}-${version}.tgz`,response=await fetch(url)
 if(!response.ok)throw new Error(`Could not download ${name}@${version} (HTTP ${response.status}).`)
 const bytes=Buffer.from(await response.arrayBuffer())
 if(integrityOf(bytes)!==integrity)throw new Error(`${name}@${version} does not match its pinned integrity. Nothing was installed.`)
 mkdirSync(cache,{recursive:true});writeFileSync(file,bytes);return file
}
export async function vendor(){
 for(const pkg of VENDOR_PACKAGES){
  const target=join(out,`${pkg.name}@${pkg.version}`),stamp=join(cache,`${pkg.name.replace('/','__')}-${pkg.version}.installed`)
  if(existsSync(stamp)&&readFileSync(stamp,'utf8')===pkg.integrity&&pkg.files.every(file=>existsSync(join(target,file))))continue
  const file=await tarball(pkg),scratch=mkdtempSync(join(tmpdir(),'space-vendor-'))
  try{
   const tar=spawnSync('tar',['-xzf',file,'-C',scratch],{stdio:'inherit'});if(tar.status!==0)throw new Error(`Could not extract ${pkg.name}@${pkg.version}.`)
   rmSync(target,{recursive:true,force:true})
   for(const name of pkg.files){const from=join(scratch,'package',name);if(!existsSync(from))throw new Error(`${pkg.name}@${pkg.version} has no ${name}.`);mkdirSync(dirname(join(target,name)),{recursive:true});cpSync(from,join(target,name),{recursive:true})}
   writeFileSync(stamp,pkg.integrity)
  }finally{rmSync(scratch,{recursive:true,force:true})}
  console.log(`Vendored ${pkg.name}@${pkg.version} (integrity verified).`)
 }
}
if(import.meta.main)await vendor()
