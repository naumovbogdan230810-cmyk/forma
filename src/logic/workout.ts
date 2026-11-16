import { EX, EXERCISES, type Eq, type Ex, type Pattern } from '../data/exercises'
import type { Day, Item, Profile, Program } from '../store'

const COMPOUND: Pattern[] = ['push_h', 'push_v', 'pull_v', 'pull_h', 'squat', 'hinge', 'lunge']

/** Чем заменить движение, если под инвентарь ничего не нашлось */
const FALLBACK: Partial<Record<Pattern, Pattern[]>> = {
  chest_fly: ['push_h'],
  push_v: ['delts', 'push_h'],
  delts: ['push_v'],
  pull_v: ['pull_h'],
  pull_h: ['pull_v'],
  biceps: ['pull_v', 'pull_h'],
  triceps: ['push_h'],
  lunge: ['squat'],
  calf: ['squat'],
}

const TEMPLATES: Record<string, { title: string; slots: Pattern[] }> = {
  fbA: { title: 'Всё тело · A', slots: ['squat', 'push_h', 'pull_h', 'hinge', 'push_v', 'core', 'biceps'] },
  fbB: { title: 'Всё тело · B', slots: ['hinge', 'pull_v', 'push_v', 'lunge', 'push_h', 'core', 'triceps'] },
  fbC: { title: 'Всё тело · C', slots: ['lunge', 'push_h', 'pull_h', 'squat', 'delts', 'core', 'calf'] },
  upper: { title: 'Верх тела', slots: ['push_h', 'pull_v', 'push_v', 'pull_h', 'biceps', 'triceps', 'delts'] },
  lower: { title: 'Низ тела', slots: ['squat', 'hinge', 'lunge', 'calf', 'core', 'core', 'hinge'] },
  push: { title: 'Грудь, плечи, трицепс', slots: ['push_h', 'push_v', 'chest_fly', 'delts', 'triceps', 'core', 'push_h'] },
  pull: { title: 'Спина и бицепс', slots: ['pull_v', 'pull_h', 'pull_h', 'delts', 'biceps', 'core', 'biceps'] },
  legs: { title: 'Ноги', slots: ['squat', 'hinge', 'lunge', 'calf', 'core', 'hinge', 'squat'] },
}

const SPLITS: Record<number, string[]> = {
  2: ['fbA', 'fbB'],
  3: ['fbA', 'fbB', 'fbC'],
  4: ['upper', 'lower', 'upper', 'lower'],
  5: ['push', 'pull', 'legs', 'upper', 'lower'],
  6: ['push', 'pull', 'legs', 'push', 'pull', 'legs'],
}

/** В какие дни недели (0 = Пн) стоят тренировки */
export const WEEK_MAP: Record<number, number[]> = {
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
}

function available(p: Profile): Set<Eq> {
  if (p.place === 'gym') return new Set<Eq>(['body', 'db', 'bar', 'band', 'gym'])
  return new Set<Eq>(['body', ...(p.equip as Eq[])])
}

function pool(p: Profile, pattern: Pattern, strictLevel = true): Ex[] {
  const eq = available(p)
  const base = EXERCISES.filter(
    (x) => x.p === pattern && eq.has(x.eq) && !(x.avoid ?? []).some((a) => p.injuries.includes(a)),
  )
  const byLevel = base.filter((x) => x.lvl <= p.level)
  const list = strictLevel && byLevel.length ? byLevel : base.filter((x) => x.lvl <= p.level + 1)
  const score = (x: Ex) => {
    // в зале приоритет у штанг и тренажёров, дома — у любого инвентаря
    const gear = x.eq === 'body' ? 0 : p.place !== 'gym' || x.eq === 'gym' ? 2 : x.eq === 'db' ? 1.5 : 1
    return gear * 2 - Math.abs(x.lvl - p.level)
  }
  // для пресса и кардио инвентарь не даёт преимущества
  if (pattern === 'core' || pattern === 'cardio') return list
  return [...list].sort((a, b) => score(b) - score(a))
}

function poolWithFallback(p: Profile, pattern: Pattern): Ex[] {
  const chain = [pattern, ...(FALLBACK[pattern] ?? [])]
  for (const pt of chain) {
    const list = pool(p, pt)
    if (list.length) return list
  }
  for (const pt of chain) {
    const list = pool(p, pt, false)
    if (list.length) return list
  }
  return []
}

const fmtDur = (s: number) => (s >= 120 ? `${Math.round(s / 60)} мин` : `${s} сек`)

function dose(ex: Ex, p: Profile): Pick<Item, 'sets' | 'reps' | 'rest'> {
  if (ex.dur) {
    if (ex.one) return { sets: 1, reps: fmtDur(ex.dur), rest: 0 }
    const d = p.level === 1 ? ex.dur : Math.round(ex.dur * 1.25 / 5) * 5
    return { sets: 3, reps: fmtDur(d), rest: 45 }
  }
  const comp = COMPOUND.includes(ex.p)
  const body = ex.eq === 'body' || ex.eq === 'bar'
  switch (p.goal) {
    case 'gain':
      return comp
        ? { sets: p.level === 1 ? 3 : 4, reps: body ? '8–15' : '8–10', rest: 90 }
        : { sets: 3, reps: '10–12', rest: 60 }
    case 'lose':
      return { sets: 3, reps: '12–15', rest: comp ? 60 : 45 }
    case 'endurance':
      return { sets: 3, reps: '15–20', rest: 40 }
    default:
      return comp ? { sets: 3, reps: body ? '10–15' : '10–12', rest: 75 } : { sets: 3, reps: '12–15', rest: 60 }
  }
}

export function makeItem(ex: Ex, pattern: Pattern, p: Profile): Item {
  return { ex: ex.id, p: pattern, ...dose(ex, p) }
}

export function buildProgram(p: Profile): Program {
  const split = SPLITS[p.days] ?? SPLITS[3]
  const count = p.minutes <= 30 ? 4 : p.minutes <= 45 ? 5 : p.minutes <= 60 ? 6 : 7
  const cardio = p.goal === 'lose' || p.goal === 'endurance'
  const usedAll = new Set<string>()

  const days: Day[] = split.map((key) => {
    const t = TEMPLATES[key]
    const slots: Pattern[] = t.slots.slice(0, cardio ? count - 1 : count)
    if (cardio) slots.push('cardio')
    const usedDay = new Set<string>()
    const items: Item[] = []
    for (const slot of slots) {
      const list = poolWithFallback(p, slot)
      const pick =
        list.find((x) => !usedAll.has(x.id) && !usedDay.has(x.id)) ?? list.find((x) => !usedDay.has(x.id))
      if (!pick) continue
      usedAll.add(pick.id)
      usedDay.add(pick.id)
      items.push(makeItem(pick, slot, p))
    }
    // под скромный инвентарь часть слотов не закрывается — добираем до нужного объёма
    for (const slot of ['delts', 'core', ...t.slots, 'core'] as Pattern[]) {
      if (items.length >= slots.length) break
      const pick = poolWithFallback(p, slot).find((x) => !usedDay.has(x.id))
      if (!pick) continue
      usedDay.add(pick.id)
      const item = makeItem(pick, slot, p)
      // кардио должно остаться последним
      if (items[items.length - 1]?.p === 'cardio') items.splice(items.length - 1, 0, item)
      else items.push(item)
    }
    return { title: t.title, items }
  })
  return { place: p.place, days }
}

/** Варианты замены для упражнения в программе */
export function alternatives(p: Profile, item: Item, day: Day): Ex[] {
  const inDay = new Set(day.items.map((i) => i.ex))
  const chain = [item.p, EX[item.ex].p, ...(FALLBACK[item.p] ?? [])]
  const seen = new Set<string>()
  const out: Ex[] = []
  for (const pt of chain) {
    for (const x of pool(p, pt, false)) {
      if (seen.has(x.id) || inDay.has(x.id)) continue
      seen.add(x.id)
      out.push(x)
    }
  }
  return out
}

export const usesWeight = (ex: Ex) => ex.eq === 'db' || ex.eq === 'gym'

export function estMinutes(day: Day): number {
  let sec = 240 // разминка
  for (const it of day.items) {
    const ex = EX[it.ex]
    const work = ex?.dur ? (ex.one ? ex.dur : ex.dur * 1.25) : 45
    sec += it.sets * (work + it.rest) + 60
  }
  return Math.round(sec / 60 / 5) * 5
}
