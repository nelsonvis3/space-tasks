import {appStorage,scopedStorage,FLUSH_EVENT,activeAccount} from '../account/storage'
import {createContext,useContext,useEffect,useMemo,useRef,useState} from 'react'
import type {ReactNode} from 'react'
import {TRACKS as catalog} from './tracks'
import type {Track} from './tracks'
import {SeamlessAudio} from './SeamlessAudio'
import type {PlaybackState} from './SeamlessAudio'
import {acceptsSong,addSong,listSongs,removeSong} from './userMusic'
export const TRACKS=catalog
export type PlayerTrack=Track&{stream?:boolean;songId?:string}
export type SongItem={id:string;name:string;src:string}
const KEY='orbit:audio:v1'
type Preferences={track:number;volume:number;resume:boolean;wanted:boolean;song:string}
function readPreferences():Preferences{try{const p=JSON.parse(appStorage.getItem(KEY)||'{}');return{track:Number.isInteger(p.track)&&p.track>=0&&p.track<TRACKS.length?p.track:0,volume:typeof p.volume==='number'&&Number.isFinite(p.volume)?Math.max(0,Math.min(100,p.volume)):28,resume:p.resume===true,wanted:p.wanted===true,song:typeof p.song==='string'?p.song:''}}catch{return{track:0,volume:28,resume:false,wanted:false,song:''}}}
type AudioState=Preferences&PlaybackState&{storageError:boolean;tracks:PlayerTrack[];songs:SongItem[];musicError:''|'invalid'|'storage';addSongs:(files:FileList|null)=>Promise<void>;deleteSong:(id:string)=>Promise<void>;toggle:()=>void;chooseTrack:(track:number)=>void;setVolume:(volume:number)=>void;setResume:(resume:boolean)=>void}
const AudioContext=createContext<AudioState|null>(null)
export function AudioProvider({children}:{children:ReactNode}){
 const [storage]=useState(()=>scopedStorage()),[storageError,setStorageError]=useState(false)
 const [preferences,setPreferences]=useState(readPreferences),[state,setState]=useState<PlaybackState>({playing:false,loading:false,error:''})
 // Songs are kept per account (or guest) on this device; their object URLs live as long as the provider.
 const [owner]=useState(()=>activeAccount()||'guest'),[songs,setSongs]=useState<SongItem[]>([]),[songsLoaded,setSongsLoaded]=useState(false),[musicError,setMusicError]=useState<''|'invalid'|'storage'>(''),urls=useRef<string[]>([])
 const element=useRef<HTMLAudioElement>(null),transport=useRef<SeamlessAudio|null>(null),intent=useRef(preferences.resume&&preferences.wanted)
 useEffect(()=>{const player=new SeamlessAudio(element.current!,setState);transport.current=player;return()=>{player.dispose();transport.current=null}},[])
 useEffect(()=>{let alive=true;listSongs(owner).then(list=>{if(!alive)return;const items=list.map(song=>({id:song.id,name:song.name,src:URL.createObjectURL(song.file)}));urls.current.push(...items.map(item=>item.src));setSongs(items)}).catch(()=>{if(alive)setMusicError('storage')}).finally(()=>{if(alive)setSongsLoaded(true)});return()=>{alive=false;for(const url of urls.current)URL.revokeObjectURL(url);urls.current=[]}},[owner])
 const tracks=useMemo<PlayerTrack[]>(()=>[...TRACKS,...songs.map(song=>({name:song.name,src:song.src,emoji:'🎵',bpm:null,credit:'',source:'',stream:true,songId:song.id}))],[songs])
 const songIndex=preferences.song?tracks.findIndex(track=>track.songId===preferences.song):-1,current=songIndex>=0?songIndex:preferences.track
 const latest=useRef(preferences);latest.current=preferences
 const playlist=useRef({songs,song:''});playlist.current={songs,song:songIndex>=0?preferences.song:''}
 // When a song ends, the next one in the user's list plays; a single song repeats.
 useEffect(()=>{const player=transport.current;if(!player)return;player.onEnded=()=>{const{songs,song}=playlist.current,index=songs.findIndex(item=>item.id===song);if(index<0)return;const next=songs[(index+1)%songs.length];intent.current=true;if(next.id===song)void player.play();else setPreferences(p=>({...p,song:next.id,wanted:true}))};return()=>{player.onEnded=null}},[])
 useEffect(()=>{const flush=(event?:Event)=>{const value=JSON.stringify(latest.current);if(event instanceof CustomEvent&&event.detail?.data)event.detail.data[KEY]=value;try{storage.setItem(KEY,value);setStorageError(false)}catch{if(event instanceof CustomEvent&&event.detail)event.detail.failed=true;setStorageError(true)}};window.addEventListener(FLUSH_EVENT,flush);window.addEventListener('pagehide',flush);return()=>{window.removeEventListener(FLUSH_EVENT,flush);window.removeEventListener('pagehide',flush)}},[storage])
 useEffect(()=>{try{storage.setItem(KEY,JSON.stringify(preferences));setStorageError(false)}catch{setStorageError(true)}},[preferences,storage])
 useEffect(()=>{transport.current?.setVolume(preferences.volume)},[preferences.volume])
 // A remembered song is selected only after the device library loads, so a built-in loop does not start first.
 const waitingForSong=!!preferences.song&&!songsLoaded,selected=tracks[current]
 useEffect(()=>{if(waitingForSong)return;transport.current?.select(selected);if(intent.current)void transport.current?.play()},[selected.src,waitingForSong])
 function toggle(){const wanted=!(state.playing||state.loading);intent.current=wanted;if(wanted)void transport.current?.play();else transport.current?.pause();setPreferences(p=>({...p,wanted}))}
 function chooseTrack(index:number){if(!Number.isInteger(index)||index<0||index>=tracks.length)return;intent.current=state.playing||state.loading;const song=tracks[index].songId;setPreferences(p=>song?{...p,song}:{...p,track:index,song:''})}
 async function addSongs(files:FileList|null){if(!files?.length)return;setMusicError('');for(const file of Array.from(files)){if(!acceptsSong(file)){setMusicError('invalid');continue}try{const song=await addSong(owner,file),src=URL.createObjectURL(song.file);urls.current.push(src);setSongs(list=>[...list,{id:song.id,name:song.name,src}])}catch{setMusicError('storage')}}}
 async function deleteSong(id:string){try{await removeSong(owner,id)}catch{setMusicError('storage');return}const gone=songs.find(song=>song.id===id);setSongs(list=>list.filter(song=>song.id!==id));if(latest.current.song===id)setPreferences(p=>({...p,song:''}));if(gone)setTimeout(()=>URL.revokeObjectURL(gone.src),0)}
 return <AudioContext value={{...preferences,track:current,...state,storageError,tracks,songs,musicError,addSongs,deleteSong,toggle,chooseTrack,setVolume:volume=>setPreferences(p=>({...p,volume:Math.max(0,Math.min(100,volume))})),setResume:resume=>setPreferences(p=>({...p,resume}))}}><audio data-orbit-audio ref={element} loop preload="none"/>{children}</AudioContext>
}
export function useAudio(){const context=useContext(AudioContext);if(!context)throw new Error('Audio controls require AudioProvider');return context}
