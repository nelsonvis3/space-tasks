import { Headphones, Music2, Pause, Play, Plus, Trash2, Volume2, VolumeX } from 'lucide-react'
import { t } from './i18n'
import type { Language } from './i18n'

import { useAudio } from './audio/AudioProvider'

export function MusicPlayer({ language, compact = false }: { language: Language; compact?: boolean }) {
  const {track, tracks, songs, musicError, addSongs, deleteSong, playing, loading, volume, error, storageError, toggle, chooseTrack, setVolume, resume, setResume} = useAudio()
  const current = tracks[track], title = (item: typeof current) => item.songId ? item.name : t(language, item.name)
  // Built-in loops first, then the user's own songs (their names are never translated).
  const options = (emoji: boolean) => <>
    {tracks.map((item,i)=>item.songId?null:<option key={item.src} value={i}>{emoji?`${item.emoji} `:''}{title(item)}</option>)}
    {songs.length>0&&<optgroup label={t(language,'Your music')}>{tracks.map((item,i)=>item.songId?<option key={item.src} value={i}>{emoji?`${item.emoji} `:''}{item.name}</option>:null)}</optgroup>}
  </>
  if (compact) return <div className="compact-player" aria-label={t(language,'LO-FI RADIO')}>
    <span aria-hidden="true">{current.emoji}</span>
    <select aria-label={t(language,'Choose lo-fi music track')} value={track} onChange={e=>chooseTrack(Number(e.target.value))}>{options(false)}</select>
    <button type="button" onClick={toggle} aria-label={t(language,playing||loading?'Pause music':'Play music')}>{playing||loading?<Pause size={16}/>:<Play size={16}/>}</button>
    <label><Volume2 size={14}/><input type="range" aria-label={t(language,'Volume')} min="0" max="100" value={volume} onChange={e=>setVolume(Number(e.target.value))}/></label>
    {storageError&&<span role="status" title={t(language,'Changes could not be saved. Check your browser storage.')}>!</span>}
    {error && <span role="status" title={t(language,error==='blocked'?'Tap Play to enable audio.':'Music file unavailable.')}>!</span>}
  </div>
  return <section className="music-card" aria-label={t(language,'Lo-fi music player')}>
    <div className="small-card-heading"><div className="eyebrow eyebrow--muted"><Headphones size={12}/> {t(language, 'LO-FI RADIO')}</div><span className="small-icon small-icon--mint"><Music2 size={18}/></span></div>
    <h2>{t(language, 'Lo-fi lounge')}</h2>
    <p>{t(language, 'Calm beats and ambient music')}</p>
    <div className="music-visual" aria-hidden="true"><div className="music-disc"><span>◎</span></div><div className={`music-equalizer ${playing ? 'music-equalizer--playing' : ''}`}>{Array.from({length: 17},(_,i)=><i key={i} style={{animationDelay:`${(i%7)*-.17}s`}}/>)}</div><span className="music-emoji">{current.emoji}</span></div>
    <div className="now-playing"><span>{title(current)}</span><small>{current.bpm?`${current.bpm} BPM · `:''}{current.credit}</small></div>
    <div className="music-controls">
      <select value={track} onChange={event=>chooseTrack(Number(event.target.value))} aria-label={t(language,'Choose lo-fi music track')}>{options(true)}</select>
      <button type="button" className="music-toggle" onClick={toggle} aria-label={t(language,playing||loading?'Pause music':'Play music')}>{playing||loading?<Pause size={18} fill="currentColor"/>:<Play size={18} fill="currentColor"/>}</button>
    </div>
    <label className="music-volume">{volume === 0 ? <VolumeX size={15}/> : <Volume2 size={15}/>}<span>{t(language,'Volume')}</span><input type="range" min="0" max="100" value={volume} onChange={event=>setVolume(Number(event.target.value))} aria-label={t(language,'Volume')}/><b>{volume}%</b></label>
    {current.source&&<p className="music-credit"><a href={current.source} target="_blank" rel="noreferrer">{current.credit} · {t(language,'Source and license')}</a></p>}
    <div className="music-library">
      <div className="music-library-head"><strong>{t(language,'Your music')}</strong><label className="music-add"><Plus size={14}/><span>{t(language,'Add music files')}</span><input type="file" accept="audio/*,.mp3,.m4a,.aac,.ogg,.oga,.opus,.wav,.flac,.weba" multiple onChange={event=>{void addSongs(event.target.files);event.target.value=''}}/></label></div>
      <small>{t(language,'Saved only on this device. Add music you own or are allowed to use.')}</small>
      {songs.length>0&&<ul>{songs.map(song=><li key={song.id}><span>{song.name}</span><button type="button" onClick={()=>void deleteSong(song.id)} aria-label={`${t(language,'Remove from your music')}: ${song.name}`} title={t(language,'Remove from your music')}><Trash2 size={14}/></button></li>)}</ul>}
      {musicError&&<p className="music-error" role="status">{t(language,musicError==='invalid'?'Choose an audio file smaller than 100 MB.':'Changes could not be saved. Check your browser storage.')}</p>}
    </div>
    <label className="music-resume"><input type="checkbox" checked={resume} onChange={e=>setResume(e.target.checked)}/>{t(language,'Resume music on next visit')}</label>
    {loading&&<p role="status" className="music-credit">{t(language,'Loading audio…')}</p>}
    {storageError&&<p className="music-error" role="status">{t(language,'Changes could not be saved. Check your browser storage.')}</p>}
    {error && <p className="music-error" role="status">{t(language,error==='blocked'?'Tap Play to enable audio.':'Music file unavailable.')}</p>}
  </section>
}
