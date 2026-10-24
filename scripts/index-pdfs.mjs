// Optional personal conversion tool. Never writes to public/ or the application catalog.
import {readdir,stat,readFile,writeFile,mkdir} from 'node:fs/promises'
import {createHash} from 'node:crypto'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
const directory='.local-books',run=promisify(execFile),catalog=[]
await mkdir(`${directory}/pdfs`,{recursive:true,mode:0o700})
const files=await readdir(`${directory}/pdfs`)
await mkdir(`${directory}/reading`,{recursive:true,mode:0o700})
for(const file of files.filter(name=>name.toLowerCase().endsWith('.pdf')).sort()){
 const path=`${directory}/pdfs/${file}`,info=await stat(path),id=`bundled-${createHash('sha256').update(file).digest('hex').slice(0,16)}`,hash=createHash('sha256').update(await readFile(path)).digest('hex'),entry={id,name:file,size:info.size,addedAt:0,url:`/pdfs/${encodeURIComponent(file)}`,bundled:true}
 let converted=false
 try{const existing=JSON.parse(await readFile(`${directory}/reading/${id}.json`,'utf8'));converted=existing.sourceHash===hash&&Array.isArray(existing.pages)&&existing.pages.length>0}catch{/* First conversion. */}
 if(!converted){try{
 // Use physical PDF page boundaries for navigation, then reflow text in the reader.
 const result=await run('pdftotext',['-enc','UTF-8',path,'-'],{maxBuffer:24*1024*1024});const pages=result.stdout.split('\f');if(!pages.at(-1)?.trim())pages.pop();if(pages.some(p=>p.trim())){await writeFile(`${directory}/reading/${id}.json`,JSON.stringify({sourceHash:hash,title:file.replace(/\.pdf$/i,''),pages}));converted=true}
 }catch{console.warn(`No preconverted text for ${file}; browser extraction remains available.`)}}
 if(converted)entry.textUrl=`/reading/${id}.json`;catalog.push(entry)
}
await writeFile(`${directory}/catalog.json`,JSON.stringify(catalog,null,2)+'\n')
console.log(`Indexed ${catalog.length} private local PDFs; excluded from application and distribution (${catalog.filter(b=>b.textUrl).length} with real extracted text).`)
