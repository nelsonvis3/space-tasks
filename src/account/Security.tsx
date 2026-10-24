import {useState} from 'react'
import type {FormEvent} from 'react'
import {api} from './api'
import {t} from '../i18n'
import type {Language} from '../i18n'
/** Password change, signing out other devices and permanent account deletion. */
export function Security({language,onDeleted}:{language:Language;onDeleted:()=>void}){
 const T=(key:string)=>t(language,key),[busy,setBusy]=useState(false),[error,setError]=useState(''),[done,setDone]=useState('')
 const [current,setCurrent]=useState(''),[next,setNext]=useState(''),[repeat,setRepeat]=useState(''),[deletePassword,setDeletePassword]=useState(''),[understood,setUnderstood]=useState(false)
 async function run(work:()=>Promise<unknown>,message:string){if(busy)return;setBusy(true);setError('');setDone('');try{await work();setDone(message)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 function changePassword(event:FormEvent){event.preventDefault();if(next!==repeat){setDone('');setError('The new passwords do not match.');return}void run(async()=>{await api('/api/auth/password',{method:'POST',body:JSON.stringify({current,next})});setCurrent('');setNext('');setRepeat('')},'Password changed. Other devices were signed out.')}
 function deleteAccount(event:FormEvent){event.preventDefault();void run(async()=>{await api('/api/account',{method:'DELETE',body:JSON.stringify({password:deletePassword})});onDeleted()},'')}
 return <details className="security-panel"><summary>{T('Security')}</summary>
  <form onSubmit={changePassword}><h3>{T('Change password')}</h3>
   <label>{T('Current password')}<input type="password" autoComplete="current-password" required value={current} onChange={e=>setCurrent(e.target.value)}/></label>
   <label>{T('New password')}<input type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={next} onChange={e=>setNext(e.target.value)}/></label>
   <label>{T('Repeat new password')}<input type="password" autoComplete="new-password" required minLength={8} maxLength={128} value={repeat} onChange={e=>setRepeat(e.target.value)}/></label>
   <button className="action-secondary" disabled={busy}>{T('Change password')}</button>
  </form>
  <button type="button" className="action-secondary" disabled={busy} onClick={()=>void run(()=>api('/api/auth/sessions/close-others',{method:'POST'}),'Other devices were signed out.')}>{T('Sign out other devices')}</button>
  <form className="security-delete" onSubmit={deleteAccount}><h3>{T('Delete account')}</h3>
   <p>{T('This permanently deletes your account, tasks, settings and PDF files from the server. Copies in server backups are removed within five weeks.')}</p>
   <label>{T('Password')}<input type="password" autoComplete="current-password" required value={deletePassword} onChange={e=>setDeletePassword(e.target.value)}/></label>
   <label className="security-confirm"><input type="checkbox" checked={understood} onChange={e=>setUnderstood(e.target.checked)}/>{T('I understand this cannot be undone')}</label>
   <button className="action-danger" disabled={busy||!understood||!deletePassword}>{T('Delete account permanently')}</button>
  </form>
  {done&&<p role="status">{T(done)}</p>}{error&&<p className="assistant-error" role="alert">{T(error)}</p>}
 </details>
}
