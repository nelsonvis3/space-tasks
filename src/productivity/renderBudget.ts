/** Bound canvas memory and dimensions even for hostile page boxes/aspect ratios. */
export function boundedPageScale(width:number,height:number,preferred:number){
 if(!Number.isFinite(width)||!Number.isFinite(height)||width<=0||height<=0||!Number.isFinite(preferred)||preferred<=0)throw new RangeError('Invalid page dimensions')
 const scale=Math.min(preferred,Math.sqrt(3_950_000/width/height),8190/width,8190/height)
 if(!Number.isFinite(scale)||scale<=0)throw new RangeError('Invalid page dimensions')
 return scale
}
