import type { ReactNode } from 'react'
import videos from './data/videos.json'
import type { Ex } from './data/exercises'
import { haptic, openLink } from './tg'

export const VIDEOS = videos as Record<string, { v: string; t?: string; ch?: string }>

const PATHS: Record<string, string> = {
  home: 'M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z',
  dumbbell: 'M6.5 6.5v11M17.5 6.5v11M3 9v6M21 9v6M6.5 12h11',
  food: 'M7 3v8a2 2 0 0 0 2 2v8M5 3v5M9 3v5M17 3c-1.7 1.5-2.5 3.6-2.5 6.5 0 1.9 1 3 2.5 3.5v8',
  chart: 'M4 20V10M10 20V4M16 20v-7M21 20H3',
  user: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  swap: 'M7 7h13l-3-3M17 17H4l3 3',
  check: 'M5 12.5l4.5 4.5L19 7.5',
  x: 'M6 6l12 12M18 6 6 18',
  back: 'M15 5l-7 7 7 7',
  chev: 'M9 6l6 6-6 6',
  clock: 'M12 7v5l3 2M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z',
  cart: 'M3 4h2l2.5 11h10L20 7H6.5M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2zM17 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  refresh: 'M20 11a8 8 0 1 0-2.3 6.3M20 4v7h-7',
}

export function Icon({ n, size = 22 }: { n: string; size?: number }) {
  if (n === 'play')
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M8 5v14l11-7z" />
      </svg>
    )
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={PATHS[n]} />
    </svg>
  )
}

export function Sheet({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="sheet-wrap" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-grip" />
        <div className="sheet-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Закрыть"><Icon n="x" size={20} /></button>
        </div>
        <div className="sheet-body">{children}</div>
      </div>
    </div>
  )
}

export function Seg<T extends string | number>({ value, options, onChange }: {
  value: T
  options: { v: T; l: string }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button key={String(o.v)} className={o.v === value ? 'on' : ''} onClick={() => { haptic(); onChange(o.v) }}>
          {o.l}
        </button>
      ))}
    </div>
  )
}

export function Thumb({ ex, onClick }: { ex: Ex; onClick?: () => void }) {
  const v = VIDEOS[ex.id]?.v
  return (
    <button className="thumb" onClick={onClick} aria-label={`Техника: ${ex.name}`}>
      {v && <img src={`https://i.ytimg.com/vi/${v}/mqdefault.jpg`} alt="" loading="lazy" />}
      <span className="thumb-play"><Icon n="play" size={16} /></span>
    </button>
  )
}

export function Technique({ ex }: { ex: Ex }) {
  const v = VIDEOS[ex.id]?.v
  const search = `https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + ' техника выполнения')}`
  return (
    <>
      {v ? (
        <div className="video">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${v}?rel=0&playsinline=1&modestbranding=1`}
            title={ex.name}
            referrerPolicy="strict-origin-when-cross-origin"
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
      ) : null}
      <ol className="cues">
        {ex.cues.map((c, i) => <li key={i}>{c}</li>)}
      </ol>
      <button className="btn ghost" onClick={() => openLink(v ? `https://youtu.be/${v}` : search)}>
        {v ? 'Открыть в YouTube' : 'Найти видео на YouTube'}
      </button>
    </>
  )
}

export function Ring({ value, max, children }: { value: number; max: number; children: ReactNode }) {
  const r = 52
  const c = 2 * Math.PI * r
  const k = Math.min(1, max ? value / max : 0)
  return (
    <div className="ring">
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} className="ring-bg" />
        <circle cx="60" cy="60" r={r} className="ring-fg" strokeDasharray={c} strokeDashoffset={c * (1 - k)} />
      </svg>
      <div className="ring-in">{children}</div>
    </div>
  )
}

export function Bar({ label, value, max, unit = 'г' }: { label: string; value: number; max: number; unit?: string }) {
  return (
    <div className="bar">
      <div className="bar-top"><span>{label}</span><b>{Math.round(value)}<i> / {Math.round(max)} {unit}</i></b></div>
      <div className="bar-track"><div style={{ width: `${Math.min(100, max ? (value / max) * 100 : 0)}%` }} /></div>
    </div>
  )
}
