import {test} from 'node:test'
import assert from 'node:assert/strict'
import {mkdtemp,mkdir,writeFile,symlink,rm} from 'node:fs/promises'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {assertNoBooks} from '../scripts/check-distribution.mjs'

test('distribution rejects book originals, derived text, compressed copies and links to local files',async()=>{
 const root=await mkdtemp(join(tmpdir(),'space-distribution-'))
 try{
  for(const relative of ['pdfs/book.pdf','reading/page.json','.local-books/catalog.json','assets/Book.PDF','assets/book.pdf.br','assets/book.pdf.gz','assets/bundled-123.json.gz']){
   const directory=join(root,'output');await mkdir(join(directory,relative,'..'),{recursive:true});await writeFile(join(directory,relative),'personal content')
   await assert.rejects(assertNoBooks(directory),/excluded from distribution/)
   await rm(directory,{recursive:true})
  }
  const output=join(root,'output');await mkdir(output);await writeFile(join(root,'personal.txt'),'personal content');await symlink(join(root,'personal.txt'),join(output,'innocent.txt'))
  await assert.rejects(assertNoBooks(output),/excluded from distribution/)
 }finally{await rm(root,{recursive:true,force:true})}
})

test('distribution keeps ordinary application assets and legal notices',async()=>{
 const root=await mkdtemp(join(tmpdir(),'space-distribution-'))
 try{
  await mkdir(join(root,'assets'));await mkdir(join(root,'licenses'))
  await writeFile(join(root,'assets','reader.js'),'export const reader=true')
  await writeFile(join(root,'licenses','npm-inventory.json'),'[]')
  await writeFile(join(root,'licenses','GPL-3.0.txt'),'license')
  await assert.doesNotReject(assertNoBooks(root))
 }finally{await rm(root,{recursive:true,force:true})}
})
