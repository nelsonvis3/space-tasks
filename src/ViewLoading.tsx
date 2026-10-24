import {LoaderCircle} from 'lucide-react'
import {t} from './i18n'
import type {Language} from './i18n'
export function ViewLoading({language}:{language:Language}){return <div className="view-loading" role="status"><LoaderCircle size={23} aria-hidden="true"/><span>{t(language,'Loading…')}</span></div>}
