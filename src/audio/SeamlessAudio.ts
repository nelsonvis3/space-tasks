import {loopChannels} from './loop.ts'
/** stream: a whole song played once through the HTML element (any length, never fully decoded in memory). */
export type AudioTrack={src:string;seamless?:boolean;stream?:boolean}
export type PlaybackState={playing:boolean;loading:boolean;error:'blocked'|'file'|''}
const MAX_BYTES=32*1024*1024,MAX_PCM=64*1024*1024
/** One transport, one AudioContext, at most one audible source. The single HTML
 * element is a compatibility fallback for streams whose CORS blocks decoding.
 */
export class SeamlessAudio{
 private context:AudioContext|null=null
 private gain:GainNode|null=null
 private source:AudioBufferSourceNode|null=null
 private buffer:AudioBuffer|null=null
 private cache=new Map<string,AudioBuffer>()
 private track:AudioTrack|null=null
 private active:'buffer'|'element'|null=null
 private offset=0
 private startedAt=0
 private volume=.28
 private generation=0
 private controller:AbortController|null=null
 private disposed=false
 private state:PlaybackState={playing:false,loading:false,error:''}
 private element:HTMLAudioElement
 private notify:(state:PlaybackState)=>void
 private makeContext:()=>AudioContext
 /** Called when a streamed song finishes, so a playlist can move on. */
 onEnded:(()=>void)|null=null
 constructor(element:HTMLAudioElement,notify:(state:PlaybackState)=>void,makeContext=()=>new AudioContext({latencyHint:'playback'})){
  this.element=element;this.notify=notify;this.makeContext=makeContext
  element.loop=true
  element.addEventListener('playing',this.elementPlaying)
  element.addEventListener('pause',this.elementPaused)
  element.addEventListener('error',this.elementError)
  element.addEventListener('ended',this.elementEnded)
 }
 private update(next:Partial<PlaybackState>){this.state={...this.state,...next};if(!this.disposed)this.notify(this.state)}
 private elementPlaying=()=>{if(this.active==='element')this.update({playing:true,loading:false,error:''})}
 private elementPaused=()=>{if(this.active==='element')this.update({playing:false,loading:false})}
 private elementError=()=>{if(this.active==='element')this.update({playing:false,loading:false,error:'file'})}
 private elementEnded=()=>{if(this.active==='element'&&this.track?.stream){this.update({playing:false,loading:false});this.onEnded?.()}}
 select(track:AudioTrack){if(this.track?.src===track.src)return;this.pause();this.offset=0;this.buffer=null;this.track=track;this.element.loop=!track.stream;this.element.removeAttribute('src');this.element.load();this.update({error:''})}
 setVolume(value:number){this.volume=Math.max(0,Math.min(1,value/100));this.element.volume=this.volume;if(this.context&&this.gain){const now=this.context.currentTime;this.gain.gain.cancelScheduledValues(now);this.gain.gain.setTargetAtTime(this.volume,now,.015)}}
 private stopSource(){if(!this.source)return;const source=this.source;this.source=null;try{source.stop()}catch{/* Already stopped. */}source.disconnect()}
 pause(){this.generation++;this.controller?.abort();this.controller=null;if(this.active==='buffer'&&this.context&&this.buffer)this.offset=(this.offset+this.context.currentTime-this.startedAt)%this.buffer.duration;this.stopSource();this.active=null;this.element.pause();this.update({playing:false,loading:false})}
 private async unlock(){if(!this.context||this.context.state==='closed'){this.context=this.makeContext();this.gain=this.context.createGain();this.gain.gain.value=this.volume;this.gain.connect(this.context.destination)}
  const context=this.context;if(context.state==='running')return context
  // Do not wait forever for an autoplay-blocked context. The HTML fallback also
  // respects browser policy and can report that an explicit Play tap is needed.
  let timer:ReturnType<typeof setTimeout>|undefined
  try{await Promise.race([context.resume(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>reject(new DOMException('Playback requires a gesture','NotAllowedError')),2500)})])}finally{clearTimeout(timer)}
  return context
 }
 private async decode(context:AudioContext,track:AudioTrack,signal:AbortSignal){
  const cached=this.cache.get(track.src);if(cached){this.cache.delete(track.src);this.cache.set(track.src,cached);return cached}
  const response=await fetch(track.src,{signal,mode:'cors'});if(!response.ok||Number(response.headers.get('content-length'))>MAX_BYTES)throw new Error('Audio download unavailable')
  const reader=response.body?.getReader();if(!reader)throw new Error('Audio download unavailable');const parts:Uint8Array[]=[];let bytes=0
  for(;;){const next=await reader.read();if(next.done)break;bytes+=next.value.byteLength;if(bytes>MAX_BYTES){await reader.cancel();throw new Error('Audio download too large')}parts.push(next.value)}
  const data=new Uint8Array(bytes);let position=0;for(const part of parts){data.set(part,position);position+=part.length}
  let decoded=await context.decodeAudioData(data.buffer)
  if(decoded.length*decoded.numberOfChannels*4>MAX_PCM)throw new Error('Audio stream too large to buffer')
  if(!track.seamless){const channels=loopChannels(Array.from({length:decoded.numberOfChannels},(_,i)=>decoded.getChannelData(i)),decoded.sampleRate),prepared=context.createBuffer(channels.length,channels[0].length,decoded.sampleRate);channels.forEach((c,i)=>prepared.getChannelData(i).set(c));decoded=prepared}
  if(signal.aborted)throw new DOMException('Cancelled','AbortError')
  this.cache.set(track.src,decoded)
  let memory=0;for(const buffer of this.cache.values())memory+=buffer.length*buffer.numberOfChannels*4
  while(this.cache.size>1&&(this.cache.size>2||memory>36*1024*1024)){const key=this.cache.keys().next().value!,old=this.cache.get(key)!;memory-=old.length*old.numberOfChannels*4;this.cache.delete(key)}
  return decoded
 }
 async play(){
  const track=this.track;if(!track||this.disposed)return
  const request=++this.generation;this.controller?.abort();const controller=new AbortController();this.controller=controller;this.update({loading:true,error:''})
  const timeout=setTimeout(()=>controller.abort(),30000)
  try{
   // Songs skip buffering and use the same element path as the CORS fallback below.
   if(track.stream)throw new Error('Streamed track')
   const context=await this.unlock();if(request!==this.generation)return
   const buffer=this.buffer||await this.decode(context,track,controller.signal);if(request!==this.generation||this.disposed)return
   this.stopSource();this.active=null;this.element.pause();this.element.removeAttribute('src');this.element.load();this.buffer=buffer
   const source=context.createBufferSource();source.buffer=buffer;source.loop=true;source.loopStart=0;source.loopEnd=buffer.duration;source.connect(this.gain!);this.source=source
   this.startedAt=context.currentTime;this.offset%=buffer.duration;this.active='buffer'
   this.gain!.gain.cancelScheduledValues(context.currentTime);this.gain!.gain.setValueAtTime(0,context.currentTime);this.gain!.gain.linearRampToValueAtTime(this.volume,context.currentTime+.025)
   source.start(0,this.offset);this.update({playing:true,loading:false,error:''})
  }catch(cause){
   if(request!==this.generation||this.disposed)return
   this.stopSource();this.active='element';const current=this.element.getAttribute('src');if(current!==track.src){this.element.src=track.src;this.element.load()}
   try{await this.element.play();if(request!==this.generation)return;this.update({playing:true,loading:false,error:''})}
   catch(fallback){if(request!==this.generation||this.disposed)return;const blocked=[cause,fallback].some(e=>e instanceof DOMException&&e.name==='NotAllowedError');this.update({playing:false,loading:false,error:blocked?'blocked':'file'})}
  }finally{clearTimeout(timeout);if(this.controller===controller)this.controller=null}
 }
 dispose(){this.pause();this.disposed=true;this.element.removeEventListener('playing',this.elementPlaying);this.element.removeEventListener('pause',this.elementPaused);this.element.removeEventListener('error',this.elementError);this.element.removeEventListener('ended',this.elementEnded);this.element.removeAttribute('src');this.element.load();this.cache.clear();this.buffer=null;void this.context?.close().catch(()=>{});this.context=null}
}
