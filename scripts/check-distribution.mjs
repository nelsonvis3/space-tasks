import {readdir,readFile} from 'node:fs/promises'
import {resolve,join} from 'node:path'
import {fileURLToPath} from 'node:url'

// Fail before publishing if a personal book or its derived text reappears.
export async function assertNoBooks(directory){
 for(const entry of await readdir(directory,{withFileTypes:true})){
  const path=join(directory,entry.name)
  if(entry.isSymbolicLink()||/^(?:pdfs|reading|\.local-books)$/i.test(entry.name)||/\.pdf(?:\.(?:br|gz))?$/i.test(entry.name)||/^bundled-.*\.json(?:\.(?:br|gz))?$/i.test(entry.name))throw Error('Personal book content is excluded from distribution: '+path)
  if(entry.isDirectory())await assertNoBooks(path)
 }
}

if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const directory=process.argv[2]
 if(!['public','dist'].includes(directory))throw Error('Choose public or dist for the distribution check.')
 const catalog=JSON.parse(await readFile(new URL('../src/productivity/bundledBooks.json',import.meta.url),'utf8'))
 if(!Array.isArray(catalog)||catalog.length)throw Error('The distributable application must not contain a bundled book catalog.')
 await assertNoBooks(resolve(directory))
 console.log(`Distribution checked: ${directory} contains no supplied books or derived reading files; bundled catalog is empty.`)
}
