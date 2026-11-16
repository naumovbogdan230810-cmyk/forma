import { useMemo } from 'react'
import { buildMenu, sum, targets } from '../logic/nutrition'
import { estMinutes, WEEK_MAP } from '../logic/workout'
import { iso, mondayOf, update, useStore, weekdayIdx, WEEKDAYS, WEEKDAYS_FULL } from '../store'
import { haptic } from '../tg'
import { Bar, Icon, Ring } from '../ui'

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря']

export default function Today({ onStart, goFood }: { onStart: (day: number) => void; goFood: () => void }) {
  const s = useStore()
  const p = s.profile!
  const program = s.program!
  const now = new Date()
  const today = iso(now)
  const wd = weekdayIdx(now)
  const map = WEEK_MAP[p.days] ?? WEEK_MAP[3]
  const monday = mondayOf(now).getTime()

  const doneDays = new Set(
    s.logs.filter((l) => new Date(l.d + 'T00:00').getTime() >= monday).map((l) => weekdayIdx(new Date(l.d + 'T00:00'))),
  )
  const pos = map.indexOf(wd)
  const doneToday = s.logs.some((l) => l.d === today)
  // ближайшая тренировка, если сегодня отдых
  const nextWd = map.find((d) => d > wd) ?? map[0]
  const nextPos = map.indexOf(nextWd)
  const dayIdx = Math.min(pos >= 0 ? pos : nextPos, program.days.length - 1)
  const day = program.days[dayIdx]

  const tg = useMemo(() => targets(p), [p])
  const menu = useMemo(() => buildMenu(p, s.menuSeed, s.mealSwaps), [p, s.menuSeed, s.mealSwaps])
  const meals = menu[wd]
  const eaten = s.eaten[today] ?? []
  const got = sum(meals.filter((_, i) => eaten.includes(i)))

  const toggleMeal = (i: number) => {
    haptic()
    update((st) => {
      const cur = st.eaten[today] ?? []
      return { ...st, eaten: { ...st.eaten, [today]: cur.includes(i) ? cur.filter((x) => x !== i) : [...cur, i] } }
    })
  }

  return (
    <>
      <header className="hello">
        <span className="muted">{WEEKDAYS_FULL[wd]}, {now.getDate()} {MONTHS[now.getMonth()]}</span>
        <h1>Привет, {p.name}</h1>
      </header>

      <div className="week">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={['wk', map.includes(i) ? 'plan' : '', doneDays.has(i) ? 'ok' : '', i === wd ? 'now' : ''].join(' ')}>
            <span>{d}</span>
            <i>{doneDays.has(i) ? <Icon n="check" size={14} /> : null}</i>
          </div>
        ))}
      </div>

      <section className="card hero">
        {doneToday ? (
          <>
            <span className="tag">Сегодня</span>
            <h2>Тренировка сделана</h2>
            <p className="muted">Отличная работа. Восстановление — тоже часть плана: поешь и выспись.</p>
          </>
        ) : pos >= 0 ? (
          <>
            <span className="tag">Тренировка на сегодня</span>
            <h2>{day.title}</h2>
            <p className="muted">{day.items.length} упражнений · ~{estMinutes(day)} мин · {program.place === 'home' ? 'дома' : 'в зале'}</p>
            <button className="btn" onClick={() => { haptic('medium'); onStart(dayIdx) }}>Начать тренировку</button>
          </>
        ) : (
          <>
            <span className="tag">Сегодня</span>
            <h2>День отдыха</h2>
            <p className="muted">Следующая тренировка: {WEEKDAYS_FULL[nextWd].toLowerCase()} — {day.title}.</p>
            <button className="btn ghost" onClick={() => { haptic('medium'); onStart(dayIdx) }}>Потренироваться сегодня</button>
          </>
        )}
      </section>

      <section className="card">
        <div className="card-head">
          <h3>Питание</h3>
          <button className="link" onClick={goFood}>Всё меню</button>
        </div>
        <div className="kcal">
          <Ring value={got.kcal} max={tg.kcal}>
            <b>{Math.round(got.kcal)}</b>
            <span>из {tg.kcal} ккал</span>
          </Ring>
          <div className="bars">
            <Bar label="Белки" value={got.p} max={tg.p} />
            <Bar label="Жиры" value={got.f} max={tg.f} />
            <Bar label="Углеводы" value={got.c} max={tg.c} />
          </div>
        </div>
        <div className="list tight">
          {meals.map((m, i) => {
            const on = eaten.includes(i)
            return (
              <button key={i} className={on ? 'row meal on' : 'row meal'} onClick={() => toggleMeal(i)}>
                <span className="meal-time">{m.time}</span>
                <span><b>{m.dish.name}</b><small>{m.label} · {Math.round(m.kcal)} ккал</small></span>
                <span className="box">{on && <Icon n="check" size={15} />}</span>
              </button>
            )
          })}
        </div>
      </section>
    </>
  )
}
