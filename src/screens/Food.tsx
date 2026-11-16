import { useMemo, useState } from 'react'
import { amount, buildMenu, dishMacros, dishPool, SCHEDULE_NOTE, shoppingList, sum, targets } from '../logic/nutrition'
import { PRODUCTS } from '../data/meals'
import { update, useStore, weekdayIdx, WEEKDAYS } from '../store'
import { haptic } from '../tg'
import { Icon, Seg, Sheet } from '../ui'

export default function Food() {
  const s = useStore()
  const p = s.profile!
  const [day, setDay] = useState(weekdayIdx())
  const [open, setOpen] = useState<number | null>(null)
  const [swap, setSwap] = useState<number | null>(null)
  const [cart, setCart] = useState(false)

  const tg = useMemo(() => targets(p), [p])
  const menu = useMemo(() => buildMenu(p, s.menuSeed, s.mealSwaps), [p, s.menuSeed, s.mealSwaps])
  const meals = menu[day]
  const total = sum(meals)

  const doSwap = (slot: number, id: string) => {
    haptic()
    update((st) => ({ ...st, mealSwaps: { ...st.mealSwaps, [`${st.menuSeed}:${day}:${slot}`]: id } }))
    setSwap(null)
  }

  const swapOptions = swap === null ? [] : dishPool(p, meals[swap].dish.t).filter((d) => !meals.some((m) => m.dish.id === d.id))

  return (
    <>
      <h1 className="title">Питание</h1>

      <section className="card macro">
        <div><b>{tg.kcal}</b><span>ккал</span></div>
        <div><b>{tg.p}</b><span>белки, г</span></div>
        <div><b>{tg.f}</b><span>жиры, г</span></div>
        <div><b>{tg.c}</b><span>углеводы, г</span></div>
      </section>
      {tg.note && <p className="note">{tg.note}</p>}

      <Seg value={day} onChange={(v) => { setDay(v); setOpen(null) }} options={WEEKDAYS.map((l, v) => ({ v, l }))} />

      {meals.map((m, i) => (
        <section key={i} className="card meal-card">
          <button className="meal-head" onClick={() => setOpen(open === i ? null : i)}>
            <span className="meal-time">{m.time}</span>
            <span>
              <span className="tag">{m.label}</span>
              <b>{m.dish.name}</b>
              <small>{Math.round(m.kcal)} ккал · Б {Math.round(m.p)} · Ж {Math.round(m.f)} · У {Math.round(m.c)}</small>
            </span>
          </button>
          {open === i && (
            <div className="meal-body">
              <ul className="ing">
                {m.dish.ing.map(([id, g]) => (
                  <li key={id}><span>{PRODUCTS[id].name}</span><b>{amount(id, g * m.factor)}</b></li>
                ))}
              </ul>
              <button className="chip" onClick={() => setSwap(i)}><Icon n="swap" size={15} /> Заменить блюдо</button>
            </div>
          )}
        </section>
      ))}

      <p className="muted small center">
        Итого за день: {Math.round(total.kcal)} ккал · Б {Math.round(total.p)} · Ж {Math.round(total.f)} · У {Math.round(total.c)}
      </p>
      <p className="note">{SCHEDULE_NOTE[p.schedule]}</p>

      <div className="two">
        <button className="btn ghost" onClick={() => setCart(true)}><Icon n="cart" size={18} /> Список покупок</button>
        <button className="btn ghost" onClick={() => { haptic('medium'); update((st) => ({ ...st, menuSeed: st.menuSeed + 1, mealSwaps: {} })); setOpen(null) }}>
          <Icon n="refresh" size={18} /> Новое меню
        </button>
      </div>
      <p className="muted small center">Вес круп и мяса указан в сыром виде. План не заменяет консультацию врача.</p>

      {swap !== null && (
        <Sheet title="Заменить блюдо" onClose={() => setSwap(null)}>
          <div className="list">
            {swapOptions.map((d) => {
              const k = dishMacros(d)
              const f = meals[swap].slotKcal / k.kcal
              return (
                <button key={d.id} className="row" onClick={() => doSwap(swap, d.id)}>
                  <span><b>{d.name}</b><small>Б {Math.round(k.p * f)} · Ж {Math.round(k.f * f)} · У {Math.round(k.c * f)}{d.easy ? ' · быстро' : ''}</small></span>
                  <Icon n="chev" size={18} />
                </button>
              )
            })}
          </div>
        </Sheet>
      )}

      {cart && (
        <Sheet title="Покупки на неделю" onClose={() => setCart(false)}>
          {shoppingList(menu).map((c) => (
            <div key={c.cat} className="cart-cat">
              <span className="tag">{c.cat}</span>
              <ul className="ing">
                {c.items.map((it) => <li key={it.name}><span>{it.name}</span><b>{it.amount}</b></li>)}
              </ul>
            </div>
          ))}
        </Sheet>
      )}
    </>
  )
}
