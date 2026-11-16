import { useEffect, useMemo, useRef, useState } from 'react'
import { EX, EQ_LABEL, PATTERN_LABEL, type Ex } from '../data/exercises'
import { alternatives, makeItem, usesWeight } from '../logic/workout'
import { iso, update, useStore, type Item } from '../store'
import { haptic } from '../tg'
import { Icon, Sheet, Technique, Thumb } from '../ui'

type SetRow = { w: string; r: string; done: boolean }

export default function Session({ dayIdx, onClose }: { dayIdx: number; onClose: () => void }) {
  const s = useStore()
  const profile = s.profile!
  const day = s.program!.days[dayIdx]
  const started = useRef(Date.now())
  const [data, setData] = useState<Record<string, SetRow[]>>({})
  const [tech, setTech] = useState<Ex | null>(null)
  const [swap, setSwap] = useState<number | null>(null)
  const [rest, setRest] = useState<{ left: number; total: number } | null>(null)
  const [done, setDone] = useState<{ sets: number; min: number } | null>(null)

  /** последние результаты по упражнению — чтобы подставить вес */
  const last = useMemo(() => {
    const m: Record<string, { w: number; r: number }[]> = {}
    for (const log of s.logs) for (const [id, sets] of Object.entries(log.sets)) m[id] = sets
    return m
  }, [s.logs])

  const rows = (it: Item): SetRow[] =>
    data[it.ex] ??
    Array.from({ length: it.sets }, (_, i) => {
      const prev = last[it.ex]?.[i] ?? last[it.ex]?.[last[it.ex].length - 1]
      return { w: prev?.w ? String(prev.w) : '', r: '', done: false }
    })

  const setRow = (it: Item, i: number, patch: Partial<SetRow>) => {
    const cur = rows(it).map((r, k) => (k === i ? { ...r, ...patch } : r))
    setData({ ...data, [it.ex]: cur })
  }

  useEffect(() => {
    if (!rest) return
    if (rest.left <= 0) { haptic('success'); setRest(null); return }
    const t = setTimeout(() => setRest({ ...rest, left: rest.left - 1 }), 1000)
    return () => clearTimeout(t)
  }, [rest])

  const total = day.items.reduce((a, it) => a + it.sets, 0)
  const doneCount = day.items.reduce((a, it) => a + rows(it).filter((r) => r.done).length, 0)

  const check = (it: Item, i: number) => {
    const r = rows(it)[i]
    haptic(r.done ? 'light' : 'medium')
    setRow(it, i, { done: !r.done })
    if (!r.done && it.rest > 0) setRest({ left: it.rest, total: it.rest })
  }

  const finish = () => {
    const sets: Record<string, { w: number; r: number }[]> = {}
    for (const it of day.items) {
      const fallback = parseInt(it.reps.split('–').pop() ?? '0') || 0
      const list = rows(it)
        .filter((r) => r.done)
        .map((r) => ({ w: parseFloat(r.w.replace(',', '.')) || 0, r: parseInt(r.r) || fallback }))
      if (list.length) sets[it.ex] = list
    }
    update((st) => ({ ...st, logs: [...st.logs, { d: iso(), day: dayIdx, title: day.title, sets }] }))
    haptic('success')
    setRest(null)
    setDone({ sets: doneCount, min: Math.max(1, Math.round((Date.now() - started.current) / 60000)) })
  }

  const replace = (idx: number, ex: Ex) => {
    haptic()
    update((st) => {
      const program = structuredClone(st.program!)
      const old = program.days[dayIdx].items[idx]
      program.days[dayIdx].items[idx] = makeItem(ex, old.p, profile)
      return { ...st, program }
    })
    setSwap(null)
  }

  if (done)
    return (
      <div className="done">
        <div className="done-mark"><Icon n="check" size={44} /></div>
        <h1>Тренировка сделана</h1>
        <p className="muted">{day.title}</p>
        <div className="tiles">
          <div className="tile"><b>{done.sets}</b><span>подходов</span></div>
          <div className="tile"><b>{done.min}</b><span>минут</span></div>
        </div>
        <button className="btn" onClick={onClose}>Готово</button>
      </div>
    )

  return (
    <div className="session">
      <header className="session-head">
        <button className="icon-btn" onClick={onClose} aria-label="Назад"><Icon n="back" /></button>
        <div>
          <h2>{day.title}</h2>
          <span className="muted">{doneCount} из {total} подходов</span>
        </div>
      </header>
      <div className="progress thin"><div style={{ width: `${total ? (doneCount / total) * 100 : 0}%` }} /></div>

      <div className="session-list">
        {day.items.map((it, idx) => {
          const ex = EX[it.ex]
          const weight = usesWeight(ex)
          const list = rows(it)
          const allDone = list.every((r) => r.done)
          return (
            <section key={it.ex} className={allDone ? 'card ex done-ex' : 'card ex'}>
              <div className="ex-top">
                <Thumb ex={ex} onClick={() => setTech(ex)} />
                <div className="ex-info">
                  <span className="tag">{PATTERN_LABEL[ex.p]} · {EQ_LABEL[ex.eq]}</span>
                  <h3>{ex.name}</h3>
                  <span className="muted">
                    {it.sets} × {it.reps}{it.rest ? ` · отдых ${it.rest} сек` : ''}
                  </span>
                </div>
              </div>
              <div className="ex-actions">
                <button className="chip" onClick={() => setTech(ex)}><Icon n="play" size={14} /> Техника</button>
                <button className="chip" onClick={() => setSwap(idx)}><Icon n="swap" size={15} /> Заменить</button>
              </div>
              <div className="sets">
                {list.map((r, i) => (
                  <div key={i} className={r.done ? 'set on' : 'set'}>
                    <span className="set-n">{i + 1}</span>
                    {weight && (
                      <label className="set-in">
                        <input inputMode="decimal" placeholder="0" value={r.w} onChange={(e) => setRow(it, i, { w: e.target.value.replace(/[^\d.,]/g, '').slice(0, 5) })} />
                        <i>кг</i>
                      </label>
                    )}
                    {ex.dur ? (
                      <span className="set-time">{it.reps}</span>
                    ) : (
                      <label className="set-in">
                        <input inputMode="numeric" placeholder={it.reps.split('–').pop()} value={r.r} onChange={(e) => setRow(it, i, { r: e.target.value.replace(/\D/g, '').slice(0, 3) })} />
                        <i>повт</i>
                      </label>
                    )}
                    <button className="set-check" onClick={() => check(it, i)} aria-label="Подход выполнен"><Icon n="check" size={18} /></button>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
        <p className="hint">Сделал все подходы с запасом — в следующий раз добавь вес или 1–2 повтора.</p>
      </div>

      <div className="session-foot">
        {rest && (
          <div className="rest">
            <div className="rest-fill" style={{ width: `${(rest.left / rest.total) * 100}%` }} />
            <span><Icon n="clock" size={16} /> Отдых {Math.floor(rest.left / 60)}:{String(rest.left % 60).padStart(2, '0')}</span>
            <button onClick={() => setRest(null)}>Пропустить</button>
          </div>
        )}
        <button className="btn" disabled={doneCount === 0} onClick={finish}>Завершить тренировку</button>
      </div>

      {tech && <Sheet title={tech.name} onClose={() => setTech(null)}><Technique ex={tech} /></Sheet>}
      {swap !== null && (
        <Sheet title="Заменить упражнение" onClose={() => setSwap(null)}>
          <div className="list">
            {alternatives(profile, day.items[swap], day).map((ex) => (
              <button key={ex.id} className="row" onClick={() => replace(swap, ex)}>
                <span><b>{ex.name}</b><small>{PATTERN_LABEL[ex.p]} · {EQ_LABEL[ex.eq]}</small></span>
                <Icon n="chev" size={18} />
              </button>
            ))}
            {alternatives(profile, day.items[swap], day).length === 0 && <p className="muted">Под твой инвентарь других вариантов нет.</p>}
          </div>
        </Sheet>
      )}
    </div>
  )
}
