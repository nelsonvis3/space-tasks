import {test} from 'node:test'
import assert from 'node:assert/strict'
import {DatabaseSync} from 'node:sqlite'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {scrypt,randomBytes} from 'node:crypto'
import {promisify} from 'node:util'
import {Store} from '../server/store.mjs'
test('existing password hashes migrate after a valid login without changing tasks, identity or sessions',async()=>{
 const directory=mkdtempSync(join(tmpdir(),'space-password-migration-')),path=join(directory,'old.sqlite'),salt=randomBytes(24).toString('hex'),hash=await promisify(scrypt)('legacy-password',salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024}),data={'orbit:tasks:v2':'original private notes'}
 const old=new DatabaseSync(path);old.exec("CREATE TABLE users(id TEXT PRIMARY KEY,username TEXT UNIQUE NOT NULL,salt TEXT NOT NULL,password BLOB NOT NULL);CREATE TABLE documents(user_id TEXT PRIMARY KEY,revision INTEGER NOT NULL DEFAULT 0,data TEXT NOT NULL DEFAULT '{}');");old.prepare('INSERT INTO users VALUES(?,?,?,?)').run('existing-id','legacy-user',salt,hash);old.prepare('INSERT INTO documents VALUES(?,?,?)').run('existing-id',7,JSON.stringify(data));old.close()
 const store=new Store(path)
 try{const session=store.session({id:'existing-id'});assert.equal(store.db.prepare('SELECT scryptN FROM users').get().scryptN,32768);await assert.rejects(store.login('legacy-user','wrong-password'),{status:401});assert.equal(store.db.prepare('SELECT scryptN FROM users').get().scryptN,32768)
  assert.deepEqual(await store.login('legacy-user','legacy-password'),{id:'existing-id',username:'legacy-user'});const current=store.db.prepare('SELECT * FROM users').get();assert.equal(current.scryptN,131072);assert.notEqual(current.salt,salt);assert.notDeepEqual(Buffer.from(current.password),hash);assert.deepEqual(store.document('existing-id'),{revision:7,data});assert.equal(store.authenticate(session.token).id,'existing-id');await store.login('legacy-user','legacy-password');assert.equal(store.db.prepare('SELECT salt FROM users').get().salt,current.salt)
  const fresh=await store.register('new-user','new-password');assert.equal(store.db.prepare('SELECT scryptN FROM users WHERE id=?').get(fresh.id).scryptN,131072)
 }finally{store.close();rmSync(directory,{recursive:true,force:true})}
})
