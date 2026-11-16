import { useState } from 'react'
import { targets } from '../logic/nutrition'
import { resetAll, useStore } from '../store'
import { haptic } from '../tg'

const GOAL = { lose: 'Похудеть', gain: 'Набрать массу', keep: 'Быть в форме', endurance: 'Выносливость' }
const JOB = { sit: 'Сидячая', feet: 'На ногах', hard: 'Физический труд' }
const SCHED = { day: 'Дневной', study: 'Учёба', shift: 'Сменный', night: 'Ночные смены' }
const LEVEL = ['', 'Новичок', 'Средний', 'Опытный']

export default function Me({ onRetake }: { onRetake: () => void }) {
  const s = useStore()
  const p = s.profile!
  const tg = targets(p)
  const [sure, setSure] = useState(false)

  const rows: [string, string][] = [
    ['Цель', GOAL[p.goal]],
    ['Параметры', `${p.age} лет · ${p.height} см · ${String(p.weight).replace('.', ',')} кг`],
    ['Работа', JOB[p.job]],
    ['График', SCHED[p.schedule]],
    ['Уровень', LEVEL[p.level]],
    ['Тренировки', `${p.days} в неделю по ${p.minutes} мин · ${p.place === 'home' ? 'дома' : 'в зале'}`],
    ['Питание', `${p.meals} приёма в день · ${tg.kcal} ккал`],
    ['Расход в день', `${tg.tdee} ккал`],
  ]

  return (
    <>
      <header className="me">
        <div className="avatar">{p.name.slice(0, 1).toUpperCase()}</div>
        <h1>{p.name}</h1>
      </header>

      <section className="card">
        <ul className="ing kv">
          {rows.map(([k, v]) => <li key={k}><span>{k}</span><b>{v}</b></li>)}
        </ul>
      </section>

      <button className="btn ghost" onClick={() => { haptic(); onRetake() }}>Пройти тест заново</button>
      <p className="muted small center">План пересоберётся, история тренировок и вес сохранятся.</p>

      <button
        className={sure ? 'btn danger' : 'btn text'}
        onClick={() => { if (sure) { resetAll() } else { haptic('medium'); setSure(true); setTimeout(() => setSure(false), 4000) } }}
      >
        {sure ? 'Нажми ещё раз — всё удалится' : 'Сбросить все данные'}
      </button>
      <p className="muted small center">Данные хранятся только на этом устройстве.</p>
    </>
  )
}
