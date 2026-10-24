import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Camera, Save, Settings2, Trash2, UserRound, X } from 'lucide-react'
import { t } from './i18n'
import type { Language } from './i18n'
import { useAccount } from './account/AuthGate'
export type UserProfile = { name: string; goal: string; photo?: string }
export function initials(name:string){return name.trim().split(/\s+/).slice(0,2).map(s=>s[0]?.toUpperCase()||'').join('')||'ME'}
// Photos are re-encoded by a canvas, so only small raster data URLs are ever stored or synchronized.
export function validPhoto(value:unknown):value is string{return typeof value==='string'&&value.length<200000&&/^data:image\/(webp|jpeg|png);base64,[A-Za-z0-9+/]+=*$/.test(value)}
export function Avatar({profile}:{profile:UserProfile}){return profile.photo?<img src={profile.photo} alt=""/>:<>{initials(profile.name)}</>}
async function squarePhoto(file:File){
 if(!file.type.startsWith('image/')||file.size>15*1024*1024)throw new Error('Choose an image smaller than 15 MB.')
 const bitmap=await createImageBitmap(file).catch(()=>{throw new Error('Choose an image smaller than 15 MB.')}),side=Math.min(bitmap.width,bitmap.height),canvas=document.createElement('canvas'),size=256
 canvas.width=canvas.height=size;const context=canvas.getContext('2d');if(!context)throw new Error('Choose an image smaller than 15 MB.')
 context.imageSmoothingQuality='high';context.drawImage(bitmap,(bitmap.width-side)/2,(bitmap.height-side)/2,side,side,0,0,size,size);bitmap.close()
 const webp=canvas.toDataURL('image/webp',.88);return webp.startsWith('data:image/webp')?webp:canvas.toDataURL('image/jpeg',.88)
}
/** One panel for the profile and the account: opened from the avatar in the top bar. */
export function ProfileModal({language,profile,onSave,onClose,onCustomize}:{language:Language;profile:UserProfile;onSave:(user:UserProfile)=>void;onClose:()=>void;onCustomize:()=>void}){
  const {panel}=useAccount(),T=(key:string)=>t(language,key),picker=useRef<HTMLInputElement>(null)
  const [name,setName]=useState(profile.name),[goal,setGoal]=useState(profile.goal),[photo,setPhoto]=useState(profile.photo),[photoError,setPhotoError]=useState('')
  const draft:UserProfile={name,goal,...(photo?{photo}:{})}
  function submit(event:FormEvent){event.preventDefault();onSave({name:name.trim().slice(0,48)||T('Explorer'),goal:goal.trim().slice(0,110),...(photo?{photo}:{})})}
  async function choose(file?:File){if(!file)return;setPhotoError('');try{setPhoto(await squarePhoto(file))}catch(e){setPhotoError((e as Error).message)}finally{if(picker.current)picker.current.value=''}}
  return <div className="modal-overlay" onMouseDown={event=>{if(event.target===event.currentTarget)onClose()}}><div className="modal profile-modal account-panel" role="dialog" aria-modal="true" aria-labelledby="profile-title">
    <div className="modal-heading"><div><div className="eyebrow"><UserRound size={14}/>{T('PROFILE')}</div><h2 id="profile-title">{T('Your account')}</h2></div><button className="icon-button" onClick={onClose} aria-label={T('Close')}><X size={21}/></button></div>
    <div className="profile-preview"><div className="avatar avatar--profile"><Avatar profile={draft}/></div><div><strong>{name||T('Explorer')}</strong><small>{goal||T('Your goal')}</small>
      <div className="profile-photo-actions"><button type="button" className="text-link" onClick={()=>picker.current?.click()}><Camera size={14}/>{T('Change photo')}</button>{photo&&<button type="button" className="text-link" onClick={()=>setPhoto(undefined)}><Trash2 size={14}/>{T('Remove photo')}</button>}</div>
      <input ref={picker} hidden type="file" accept="image/png,image/jpeg,image/webp,image/gif,image/avif" onChange={event=>void choose(event.target.files?.[0])}/>
    </div></div>
    {photoError&&<p className="assistant-error" role="alert">{T(photoError)}</p>}
    <form onSubmit={submit}><label htmlFor="display-name">{T('Display name')}</label><input id="display-name" maxLength={48} required value={name} onChange={event=>setName(event.target.value)} placeholder={T('Explorer')}/><label htmlFor="user-goal">{T('Your goal')}</label><input id="user-goal" maxLength={110} value={goal} onChange={event=>setGoal(event.target.value)} placeholder={T('Learn to code')}/><small className="profile-note">{T('Your profile follows your workspace settings.')}</small><div className="modal-actions"><button type="button" className="secondary-button" onClick={onCustomize}><Settings2 size={16}/>{T('Customize your space')}</button><button type="submit" className="primary-button"><Save size={16}/>{T('Save profile')}</button></div></form>
    <div className="account-section">{panel}</div>
  </div></div>
}
