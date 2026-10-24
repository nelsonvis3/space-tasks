import {Component} from 'react'
import type {ReactNode} from 'react'
import {useAccount} from './account/AuthGate'
import {useAppearance} from './account/appearance'
import {t} from './i18n'
function WorkspaceFailure(){const account=useAccount(),{language}=useAppearance(),T=(key:string)=>t(language,key);return <section className="workspace-failure" role="alert"><h1>{T('This view could not open')}</h1><p>{T('Your saved data has not been cleared. Open your account to synchronize or export a backup before reloading.')}</p><div><button className="action-primary" onClick={account.open}>{T('Your account')}</button><button className="action-secondary" onClick={()=>window.location.reload()}>{T('Reload page')}</button></div></section>}
/** A failed lazy chunk must not unmount account sync and recovery controls. */
export class WorkspaceBoundary extends Component<{children:ReactNode},{failed:boolean}>{state={failed:false};static getDerivedStateFromError(){return{failed:true}}render(){return this.state.failed?<WorkspaceFailure/>:this.props.children}}
