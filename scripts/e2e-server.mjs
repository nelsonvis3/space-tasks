import {spawn} from 'node:child_process'
import {mkdtempSync,rmSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
// Tests never open or remove the user's database, library or backups.
const directory=mkdtempSync(join(tmpdir(),'space-e2e-'))
const child=spawn(process.execPath,['server/index.mjs'],{stdio:'inherit',env:{...process.env,NODE_ENV:'test',APP_ORIGIN:'http://127.0.0.1:4179',HOST:'127.0.0.1',PORT:'4179',REGISTRATION_LIMIT:'1000',MIN_FREE_DISK_MB:'0',DATA_DIR:join(directory,'data'),BACKUP_DIR:join(directory,'backups')}})
child.on('exit',code=>{rmSync(directory,{recursive:true,force:true});process.exitCode=code||0})
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>child.kill(signal))
