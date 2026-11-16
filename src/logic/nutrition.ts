import { DISH, DISHES, PRODUCTS, type Cat, type Dish, type MealType } from '../data/meals'
import type { Profile } from '../store'

export interface Macros { kcal: number; p: number; f: number; c: number }
export interface Targets extends Macros { bmr: number; tdee: number; note?: string }

export function targets(p: Profile): Targets {
  const bmr = 10 * p.weight + 6.25 * p.height - 5 * p.age + (p.sex === 'm' ? 5 : -161)
  const base = p.job === 'sit' ? 1.2 : p.job === 'feet' ? 1.4 : 1.6
  const tdee = bmr * (base + p.days * 0.03)
  const minor = p.age < 18
  let k = 1
  let note: string | undefined
  if (p.goal === 'lose') {
    k = minor ? 0.95 : 0.85
    if (minor) note = 'До 18 лет жёсткий дефицит не нужен: организм растёт. План держит калории почти на уровне расхода и делает ставку на качество еды и тренировки.'
  } else if (p.goal === 'gain') k = 1.12
  else if (p.goal === 'endurance') k = 1.05
  const kcal = Math.round(Math.max(tdee * k, bmr * 1.1) / 10) * 10
  const pk = p.goal === 'lose' ? 2 : p.goal === 'gain' ? 1.8 : 1.6
  const prot = Math.round(Math.min(pk * p.weight, (kcal * 0.35) / 4))
  const fat = Math.round(Math.max(0.9 * p.weight, (kcal * 0.25) / 9))
  const carb = Math.max(0, Math.round((kcal - prot * 4 - fat * 9) / 4))
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), kcal, p: prot, f: fat, c: carb, note }
}

export function dishMacros(dish: Dish, factor = 1): Macros {
  let kcal = 0, p = 0, f = 0, c = 0
  for (const [id, g] of dish.ing) {
    const pr = PRODUCTS[id]
    const m = (g * factor) / 100
    kcal += pr.k * m; p += pr.p * m; f += pr.f * m; c += pr.c * m
  }
  return { kcal, p, f, c }
}

const dishTags = (dish: Dish) => dish.ing.map(([id]) => PRODUCTS[id].tag).filter(Boolean) as string[]
const dishCost = (dish: Dish) => Math.max(...dish.ing.map(([id]) => PRODUCTS[id].cost))

const SLOTS: Record<number, { t: MealType; label: string; share: number }[]> = {
  3: [
    { t: 'b', label: 'Завтрак', share: 0.3 },
    { t: 'm', label: 'Обед', share: 0.4 },
    { t: 'm', label: 'Ужин', share: 0.3 },
  ],
  4: [
    { t: 'b', label: 'Завтрак', share: 0.25 },
    { t: 'm', label: 'Обед', share: 0.35 },
    { t: 's', label: 'Перекус', share: 0.13 },
    { t: 'm', label: 'Ужин', share: 0.27 },
  ],
  5: [
    { t: 'b', label: 'Завтрак', share: 0.24 },
    { t: 's', label: 'Перекус', share: 0.1 },
    { t: 'm', label: 'Обед', share: 0.31 },
    { t: 's', label: 'Перекус', share: 0.1 },
    { t: 'm', label: 'Ужин', share: 0.25 },
  ],
}

const TIMES: Record<Profile['schedule'], Record<number, string[]>> = {
  day: { 3: ['08:00', '13:30', '19:30'], 4: ['08:00', '13:00', '16:30', '19:30'], 5: ['08:00', '11:00', '13:30', '16:30', '19:30'] },
  shift: { 3: ['08:00', '13:30', '19:30'], 4: ['08:00', '13:00', '16:30', '19:30'], 5: ['08:00', '11:00', '13:30', '16:30', '19:30'] },
  study: { 3: ['07:30', '14:00', '19:00'], 4: ['07:30', '13:30', '16:30', '19:30'], 5: ['07:30', '10:30', '13:30', '16:30', '19:30'] },
  night: { 3: ['16:00', '21:00', '03:00'], 4: ['16:00', '20:30', '00:30', '04:30'], 5: ['16:00', '18:30', '21:30', '01:00', '04:30'] },
}

export const SCHEDULE_NOTE: Record<Profile['schedule'], string> = {
  day: 'Последний приём пищи — за 2–3 часа до сна.',
  shift: 'В сменные дни сдвигай время: первый приём в течение часа после подъёма, дальше каждые 3–4 часа.',
  study: 'Перекус бери с собой, чтобы не уходить в голод между парами и уроками.',
  night: 'Время рассчитано на ночную смену: основной приём до работы, на смене — лёгкая еда, после смены не наедайся перед сном.',
}

export interface Meal extends Macros {
  dish: Dish
  factor: number
  label: string
  time: string
  slotKcal: number
}

function rng(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function dishPool(p: Profile, t: MealType): Dish[] {
  const ok = (d: Dish) => d.t === t && !dishTags(d).some((tag) => p.exclude.includes(tag))
  const all = DISHES.filter(ok)
  const cheap = all.filter((d) => dishCost(d) <= p.budget)
  const easy = (list: Dish[]) => (p.cook === 'little' ? list.filter((d) => d.easy) : list)
  const variants = [easy(cheap), cheap, easy(all), all]
  return variants.find((v) => v.length >= 5) ?? variants.find((v) => v.length >= 3) ?? all
}

function fit(dish: Dish, slotKcal: number) {
  const base = dishMacros(dish).kcal
  const factor = Math.round(Math.min(2.2, Math.max(0.5, slotKcal / base)) * 20) / 20
  return factor
}

function toMeal(dish: Dish, slotKcal: number, label: string, time: string): Meal {
  const factor = fit(dish, slotKcal)
  return { dish, factor, label, time, slotKcal, ...dishMacros(dish, factor) }
}

export function buildMenu(p: Profile, seed: number, swaps: Record<string, string> = {}): Meal[][] {
  const tg = targets(p)
  const slots = SLOTS[p.meals]
  const times = TIMES[p.schedule][p.meals]
  const pools: Record<MealType, Dish[]> = { b: dishPool(p, 'b'), m: dishPool(p, 'm'), s: dishPool(p, 's') }
  const used: Record<string, number> = {}
  const week: Meal[][] = []

  for (let day = 0; day < 7; day++) {
    const rnd = rng(seed * 1000 + day * 17 + 3)
    let best: Dish[] | null = null
    let bestScore = Infinity
    for (let attempt = 0; attempt < 120; attempt++) {
      const pick: Dish[] = []
      let valid = true
      for (const s of slots) {
        const list = pools[s.t].filter((d) => !pick.includes(d))
        if (!list.length) { valid = false; break }
        pick.push(list[Math.floor(rnd() * list.length)])
      }
      if (!valid) continue
      let prot = 0, fat = 0, rep = 0, odd = 0
      pick.forEach((dish, i) => {
        const f = fit(dish, tg.kcal * slots[i].share)
        const m = dishMacros(dish, f)
        prot += m.p; fat += m.f
        rep += used[dish.id] ?? 0
        // слишком большие или маленькие порции выглядят странно
        odd += Math.max(0, f - 1.5) + Math.max(0, 0.75 - f)
      })
      const score = Math.abs(prot - tg.p) / tg.p + 0.5 * (Math.abs(fat - tg.f) / tg.f) + rep * 0.12 + odd * 0.5
      if (score < bestScore) { bestScore = score; best = pick }
    }
    const pick = best ?? slots.map((s) => pools[s.t][0])
    week.push(
      pick.map((dish, i) => {
        const swap = swaps[`${seed}:${day}:${i}`]
        const final = swap && DISH[swap] ? DISH[swap] : dish
        used[final.id] = (used[final.id] ?? 0) + 1
        return toMeal(final, tg.kcal * slots[i].share, slots[i].label, times[i])
      }),
    )
  }
  return week
}

export const sum = (meals: Macros[]): Macros =>
  meals.reduce((a, m) => ({ kcal: a.kcal + m.kcal, p: a.p + m.p, f: a.f + m.f, c: a.c + m.c }), { kcal: 0, p: 0, f: 0, c: 0 })

export function amount(id: string, grams: number): string {
  const pr = PRODUCTS[id]
  if (pr.piece) return `${Math.max(1, Math.round(grams / pr.piece))} шт`
  if (grams < 20) return `${Math.max(5, Math.round(grams))} г`
  const g = Math.round(grams / 5) * 5
  return g >= 1000 ? `${(g / 1000).toFixed(1).replace('.', ',')} кг` : `${g} г`
}

export function shoppingList(week: Meal[][]): { cat: Cat; items: { name: string; amount: string }[] }[] {
  const total: Record<string, number> = {}
  for (const day of week)
    for (const meal of day)
      for (const [id, g] of meal.dish.ing) total[id] = (total[id] ?? 0) + g * meal.factor
  const cats: Cat[] = ['Мясо и рыба', 'Молочное и яйца', 'Крупы и хлеб', 'Овощи и фрукты', 'Прочее']
  return cats
    .map((cat) => ({
      cat,
      items: Object.entries(total)
        .filter(([id]) => PRODUCTS[id].cat === cat)
        .sort((a, b) => PRODUCTS[a[0]].name.localeCompare(PRODUCTS[b[0]].name, 'ru'))
        .map(([id, g]) => ({ name: PRODUCTS[id].name, amount: amount(id, Math.ceil(g / 50) * 50) })),
    }))
    .filter((c) => c.items.length)
}
