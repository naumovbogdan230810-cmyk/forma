import { useState } from 'react'
import { iso, mondayOf, update, useStore } from '../store'
import { haptic } from '../tg'

function Chart({ points }: { points: { d: string; kg: number }[] }) {
  if (points.length < 2) return <p className="muted small">Добавь вес ещё раз через несколько дней — здесь появится график.</p>
  const W = 320, H = 120, pad = 10
  const vals = points.map((p) => p.kg)
  const min = Math.min(...vals), max = Math.max(...vals)
  const span = max - min || 1
  const xy = points.map((p, i) => [
    pad + (i / (points.length - 1)) * (W - pad * 2),
    pad + (1 - (p.kg - min) / span) * (H - pad * 2),
  ])
  const line = xy.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <path d={`${line} L${W - pad} ${H} L${pad} ${H} Z`} className="chart-area" />
      <path d={line} className="chart-line" />
      {xy.map(([x, y], i) => <circle key={i} cx={x} cy={y} r={i === xy.length - 1 ? 4 : 2.5} className="chart-dot" />)}
    </svg>
  )
}

const fmtDate = (d: string) => `${d.slice(8, 10)}.${d.slice(5, 7)}`

export default function Progress() {
  const s = useStore()
  const p = s.profile!
  const [kg, setKg] = useState('')
  const monday = mondayOf().getTime()
  const week = s.logs.filter((l) => new Date(l.d + 'T00:00').getTime() >= monday).length
  const first = s.weights[0]?.kg
  const cur = s.weights[s.weights.length - 1]?.kg ?? p.weight
  const diff = first !== undefined ? cur - first : 0
  const sets = s.logs.reduce((a, l) => a + Object.values(l.sets).reduce((b, x) => b + x.length, 0), 0)

  const add = () => {
    const v = parseFloat(kg.replace(',', '.'))
    if (!(v >= 30 && v <= 250)) return
    haptic('success')
    update((st) => ({
      ...st,
      weights: [...st.weights.filter((w) => w.d !== iso()), { d: iso(), kg: v }],
      profile: { ...st.profile!, weight: v },
    }))
    setKg('')
  }

  return (
    <>
      <h1 className="title">Прогресс</h1>

      <div className="tiles">
        <div className="tile"><b>{week}<i>/{p.days}</i></b><span>на этой неделе</span></div>
        <div className="tile"><b>{s.logs.length}</b><span>тренировок всего</span></div>
        <div className="tile"><b>{sets}</b><span>подходов</span></div>
      </div>

      <section className="card">
        <div className="card-head">
          <div>
            <span className="tag">Вес</span>
            <h2>{String(cur).replace('.', ',')} кг</h2>
          </div>
          {diff !== 0 && <span className="delta">{diff > 0 ? '+' : '−'}{Math.abs(diff).toFixed(1).replace('.', ',')} кг</span>}
        </div>
        <Chart points={s.weights.slice(-30)} />
        <div className="add">
          <input className="input" inputMode="decimal" placeholder="Вес сегодня, кг" value={kg} onChange={(e) => setKg(e.target.value.replace(/[^\d.,]/g, '').slice(0, 5))} onKeyDown={(e) => e.key === 'Enter' && add()} />
          <button className="btn small" onClick={add}>Записать</button>
        </div>
        <p className="muted small">Взвешивайся утром натощак — так цифры честнее. Норма калорий пересчитается сама.</p>
      </section>

      <section className="card">
        <h3>История</h3>
        {s.logs.length === 0 && <p className="muted small">Здесь появятся тренировки, которые ты завершишь.</p>}
        <div className="list tight">
          {[...s.logs].reverse().slice(0, 20).map((l, i) => (
            <div key={i} className="row static">
              <span className="meal-time">{fmtDate(l.d)}</span>
              <span><b>{l.title}</b><small>{Object.keys(l.sets).length} упражнений · {Object.values(l.sets).reduce((a, x) => a + x.length, 0)} подходов</small></span>
            </div>
          ))}
        </div>
      </section>
    </>
  )
}
