import {asset} from '../paths'
export type Track={name:string;src:string;emoji:string;bpm:number|null;credit:string;source:string;seamless?:boolean}
export const TRACKS:Track[]=[
 {name:'Midnight drift',src:asset('/audio/midnight-lofi.flac'),emoji:'🌙',bpm:82,credit:'Orbit original',source:'',seamless:true},
 {name:'Rainy window',src:asset('/audio/rainy-lofi.flac'),emoji:'🌧️',bpm:76,credit:'Orbit original',source:'',seamless:true},
 {name:'Coffee break',src:asset('/audio/coffee-lofi.flac'),emoji:'☕',bpm:90,credit:'Orbit original',source:'',seamless:true},
 {name:'Chill lofi inspired',src:asset('/audio/cc0/chill-lofi-inspired.mp3'),emoji:'🎹',bpm:null,credit:'OMF-Games · CC0',source:'https://opengameart.org/content/chill-lofi-inspired'},
 {name:'Lofi again',src:asset('/audio/cc0/lofi-again.ogg'),emoji:'🌌',bpm:null,credit:'OMF-Games · CC0',source:'https://opengameart.org/content/lofi-again'},
 {name:'Lofi Hip Hop Loop',src:asset('/audio/cc0/lofi-hip-hop-loop.ogg'),emoji:'🌿',bpm:null,credit:'OMF-Games · CC0',source:'https://opengameart.org/content/lofi-hip-hop-loop'},
 {name:'Heavenly Loop',src:asset('/audio/cc0/heavenly-loop.ogg'),emoji:'☁️',bpm:null,credit:'isaiah658 · CC0',source:'https://opengameart.org/content/heavenly-loop'},
]
