import type {Language} from '../i18n'
import {appStorage} from '../account/storage.ts'
const KEY='orbit:pdf:source:v1'
export type SourceChoice=Language|'auto'
const choices=['auto','en','es','pt','fr','de','it','ja']
export function readSourceChoice(book:string):SourceChoice{try{const value=JSON.parse(appStorage.getItem(KEY)||'{}')?.[book];return choices.includes(value)?value:'auto'}catch{return'auto'}}
export function saveSourceChoice(book:string,choice:SourceChoice){try{const raw=JSON.parse(appStorage.getItem(KEY)||'{}'),data=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};delete data[book];data[book]=choice;appStorage.setItem(KEY,JSON.stringify(Object.fromEntries(Object.entries(data).slice(-100))))}catch{/* Reading remains available if optional preferences cannot be saved. */}}
