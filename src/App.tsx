import { useState } from 'react'
import Food from './screens/Food'
import Me from './screens/Me'
import Onboarding from './screens/Onboarding'
import Plan from './screens/Plan'
import Progress from './screens/Progress'
import Session from './screens/Session'
import Today from './screens/Today'
import { useStore } from './store'
import { haptic } from './tg'
import { Icon } from './ui'

type Tab = 'today' | 'plan' | 'food' | 'progress' | 'me'
const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'today', icon: 'home', label: 'Сегодня' },
  { id: 'plan', icon: 'dumbbell', label: 'Тренировки' },
  { id: 'food', icon: 'food', label: 'Питание' },
  { id: 'progress', icon: 'chart', label: 'Прогресс' },
  { id: 'me', icon: 'user', label: 'Профиль' },
]

export default function App() {
  const s = useStore()
  const [tab, setTab] = useState<Tab>('today')
  const [session, setSession] = useState<number | null>(null)
  const [retake, setRetake] = useState(false)

  if (!s.profile || !s.program) return <Onboarding />
  if (retake) return <Onboarding initial={s.profile} onDone={() => setRetake(false)} />
  if (session !== null) return <Session dayIdx={session} onClose={() => setSession(null)} />

  return (
    <div className="app">
      <main className="screen" key={tab}>
        {tab === 'today' && <Today onStart={setSession} goFood={() => setTab('food')} />}
        {tab === 'plan' && <Plan onStart={setSession} />}
        {tab === 'food' && <Food />}
        {tab === 'progress' && <Progress />}
        {tab === 'me' && <Me onRetake={() => setRetake(true)} />}
      </main>
      <nav className="tabs">
        {TABS.map((t) => (
          <button key={t.id} className={t.id === tab ? 'on' : ''} onClick={() => { haptic(); setTab(t.id); window.scrollTo(0, 0) }}>
            <Icon n={t.icon} />
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
