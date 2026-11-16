import { useState } from 'react'
import { EX, type Ex } from '../data/exercises'
import { buildProgram, estMinutes, WEEK_MAP } from '../logic/workout'
import { update, useStore, WEEKDAYS_FULL, type Place } from '../store'
import { haptic } from '../tg'
import { Seg, Sheet, Technique, Thumb } from '../ui'

const GEAR = [{ v: 'db', l: 'Гантели' }, { v: 'bar', l: 'Турник' }, { v: 'band', l: 'Резинки' }]

export default function Plan({ onStart }: { onStart: (day: number) => void }) {
  const s = useStore()
  const p = s.profile!
  const program = s.program!
  const [tech, setTech] = useState<Ex | null>(null)
  const map = WEEK_MAP[p.days] ?? WEEK_MAP[3]

  const rebuild = (patch: Partial<typeof p>) =>
    update((st) => {
      const profile = { ...st.profile!, ...patch }
      return { ...st, profile, program: buildProgram(profile) }
    })

  const toggleGear = (v: string) => {
    haptic()
    rebuild({ equip: p.equip.includes(v) ? p.equip.filter((x) => x !== v) : [...p.equip, v] })
  }

  return (
    <>
      <h1 className="title">Тренировки</h1>
      <Seg<Place> value={p.place} onChange={(place) => rebuild({ place })} options={[{ v: 'home', l: 'Дома' }, { v: 'gym', l: 'В зале' }]} />
      {p.place === 'home' && (
        <div className="chips">
          {GEAR.map((g) => (
            <button key={g.v} className={p.equip.includes(g.v) ? 'chip on' : 'chip'} onClick={() => toggleGear(g.v)}>{g.l}</button>
          ))}
        </div>
      )}
      <p className="muted small">
        {p.place === 'home' ? 'Программа под дом: отметь, что есть под рукой.' : 'Программа под зал: штанги, гантели и тренажёры.'} При переключении план пересобирается.
      </p>

      {program.days.map((day, i) => (
        <section key={i} className="card">
          <div className="card-head">
            <div>
              <span className="tag">{WEEKDAYS_FULL[map[i]]} · ~{estMinutes(day)} мин</span>
              <h3>{day.title}</h3>
            </div>
            <button className="btn small" onClick={() => { haptic('medium'); onStart(i) }}>Начать</button>
          </div>
          <div className="list tight">
            {day.items.map((it) => {
              const ex = EX[it.ex]
              return (
                <div key={it.ex} className="row static">
                  <Thumb ex={ex} onClick={() => setTech(ex)} />
                  <span><b>{ex.name}</b><small>{it.sets} × {it.reps}</small></span>
                </div>
              )
            })}
          </div>
        </section>
      ))}
      {tech && <Sheet title={tech.name} onClose={() => setTech(null)}><Technique ex={tech} /></Sheet>}
    </>
  )
}
