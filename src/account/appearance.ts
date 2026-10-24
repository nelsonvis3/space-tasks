import {useEffect,useState} from 'react'
import {normalizePalette,resolvedPalette} from '../productivity/palette.ts'
import type {Palette} from '../productivity/palette.ts'
import {LANGUAGES} from '../i18n.ts'
import type {Language} from '../i18n.ts'
export type Appearance={palette:Palette;theme:'dark'|'light';language:Language}
const KEY='space:appearance:v1',EVENT='space-appearance-change'
export function readAppearance():Appearance{let value:Partial<Appearance>={};try{value=JSON.parse(localStorage.getItem(KEY)||'null')||{palette:JSON.parse(localStorage.getItem('orbit:palette:v1')||'null'),theme:localStorage.getItem('orbit:theme:v1'),language:localStorage.getItem('orbit-tasks:language:v1')}}catch{/* Defaults only when no saved appearance can be read. */}return{palette:normalizePalette(value.palette),theme:value.theme==='light'?'light':'dark',language:LANGUAGES.some(l=>l.code===value.language)?value.language!:'es'}}
export function saveAppearance(value:Appearance){const saved={...value,background:resolvedPalette(value.palette,value.theme).background};const serialized=JSON.stringify(saved);if(localStorage.getItem(KEY)!==serialized){localStorage.setItem(KEY,serialized);window.dispatchEvent(new Event(EVENT))}window.document.documentElement.style.setProperty('--boot-bg',saved.background);window.document.documentElement.style.colorScheme=value.theme}
export function useAppearance(){const[appearance,setAppearance]=useState(readAppearance);useEffect(()=>{const change=()=>setAppearance(readAppearance());window.addEventListener(EVENT,change);window.addEventListener('storage',change);return()=>{window.removeEventListener(EVENT,change);window.removeEventListener('storage',change)}},[]);return appearance}
