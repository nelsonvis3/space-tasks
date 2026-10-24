/** Prepare unknown recordings for repetition without a silent tail or a hard join.
 * Known periodic masters bypass this transform to preserve their exact beat length.
 */
export function loopChannels(channels:Float32Array[],sampleRate:number):Float32Array[]{
 if(!channels.length||!channels[0].length||!Number.isFinite(sampleRate)||sampleRate<=0)throw new Error('Invalid audio buffer')
 const length=channels[0].length
 if(channels.some(c=>c.length!==length))throw new Error('Mismatched audio channels')
 let peak=0;for(const c of channels)for(let i=0;i<length;i++)peak=Math.max(peak,Math.abs(c[i]))
 if(peak<.00001)return channels.map(c=>c.slice())
 const threshold=peak*.001,margin=Math.round(sampleRate*.012)
 let start=length,end=0
 for(const c of channels){let a=0,b=length-1;while(a<length&&Math.abs(c[a])<threshold)a++;while(b>a&&Math.abs(c[b])<threshold)b--;start=Math.min(start,a);end=Math.max(end,b+1)}
 start=Math.max(0,start-margin);end=Math.min(length,end+margin)
 const span=end-start,fade=Math.min(Math.round(sampleRate*1.2),Math.floor(span/8))
 if(fade<2)return channels.map(c=>c.slice(start,end))
 const result=channels.map(c=>{const out=new Float32Array(span-fade),middle=span-2*fade;out.set(c.subarray(start+fade,end-fade));for(let i=0;i<fade;i++){const mix=i/(fade-1)*Math.PI/2;out[middle+i]=c[end-fade+i]*Math.cos(mix)+c[start+i]*Math.sin(mix)}return out})
 let max=0;for(const c of result)for(let i=0;i<c.length;i++)max=Math.max(max,Math.abs(c[i]));if(max>.97)for(const c of result)for(let i=0;i<c.length;i++)c[i]*=.97/max
 return result
}
