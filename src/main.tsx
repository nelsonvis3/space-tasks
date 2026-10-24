import React from 'react'
import ReactDOM from 'react-dom/client'
import {lazy,Suspense} from 'react'
import {ViewLoading} from './ViewLoading'
import {WorkspaceBoundary} from './WorkspaceBoundary'
import {readAppearance} from './account/appearance'
const App=lazy(()=>import('./App'))
import {AuthGate} from './account/AuthGate'
import { AudioProvider } from './audio/AudioProvider'
import './fonts.css'
import './styles.css'
import './mobile.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthGate><WorkspaceBoundary><AudioProvider><Suspense fallback={<ViewLoading language={readAppearance().language}/>}><App /></Suspense></AudioProvider></WorkspaceBoundary></AuthGate>
  </React.StrictMode>,
)
