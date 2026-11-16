import { useSyncExternalStore } from 'react'
import type { Pattern } from './data/exercises'

export type Goal = 'lose' | 'gain' | 'keep' | 'endurance'
export type Place = 'home' | 'gym'

export interface Profile {
  name: string
  sex: 'm' | 'f'
  age: number
  height: number
  weight: number
  goal: Goal
  job: 'sit' | 'feet' | 'hard'
  schedule: 'day' | 'shift' | 'night' | 'study'
  meals: 3 | 4 | 5
  exclude: string[]
  budget: 1 | 2 | 3
  cook: 'yes' | 'little'
  level: 1 | 2 | 3
  place: Place
  equip: string[]
  days: number
  minutes: number
  injuries: string[]
}

export interface Item { ex: string; p: Pattern; sets: number; reps: string; rest: number }
export interface Day { title: string; items: Item[] }
export interface Program { place: Place; days: Day[] }
export interface Log { d: string; day: number; title: string; sets: Record<string, { w: number; r: number }[]> }

export interface State {
  profile: Profile | null
  program: Program | null
  startedAt: string
  logs: Log[]
  weights: { d: string; kg: number }[]
  menuSeed: number
  mealSwaps: Record<string, string>
  eaten: Record<string, number[]>
}

const KEY = 'forma.v1'
const EMPTY: State = {
  profile: null, program: null, startedAt: '', logs: [], weights: [],
  menuSeed: 1, mealSwaps: {}, eaten: {},
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...EMPTY, ...JSON.parse(raw) }
  } catch { /* хранилище недоступно — работаем в памяти */ }
  return EMPTY
}

let state = load()
const subs = new Set<() => void>()

export function update(fn: (s: State) => State) {
  state = fn(state)
  try { localStorage.setItem(KEY, JSON.stringify(state)) } catch { /* ignore */ }
  subs.forEach((f) => f())
}

export function resetAll() {
  update(() => EMPTY)
}

export function useStore(): State {
  return useSyncExternalStore(
    (cb) => { subs.add(cb); return () => { subs.delete(cb) } },
    () => state,
  )
}

export const iso = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** 0 = понедельник */
export const weekdayIdx = (d = new Date()) => (d.getDay() + 6) % 7
export const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
export const WEEKDAYS_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']

export function mondayOf(d = new Date()) {
  const m = new Date(d)
  m.setHours(0, 0, 0, 0)
  m.setDate(m.getDate() - weekdayIdx(m))
  return m
}
