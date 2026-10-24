import {DatabaseSync} from 'node:sqlite'
import {resolve} from 'node:path'
import {createBackup} from './backups.mjs'
const db=new DatabaseSync(resolve(process.env.DATA_DIR||'data','space.sqlite'),{readOnly:true})
try{console.log(`Database backup created: ${await createBackup(db,process.env.BACKUP_DIR||'backups')}`)}finally{db.close()}
