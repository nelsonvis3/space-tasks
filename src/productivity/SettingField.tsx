import {useId} from 'react'
import type {ReactNode} from 'react'

/** Reset actions must be outside the label so they cannot steal its control. */
export function SettingField({label,reset,output,className='',children}:{label:string;reset:ReactNode;output?:ReactNode;className?:string;children:(id:string)=>ReactNode}){
 const id=useId()
 return <div className={`setting-field ${className}`}><div className="setting-label"><label htmlFor={id}>{label}</label>{output!==undefined&&<output htmlFor={id}>{output}</output>}{reset}</div>{children(id)}</div>
}
