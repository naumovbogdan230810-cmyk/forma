import { useState } from 'react'
import { buildProgram } from '../logic/workout'
import { iso, update, type Profile } from '../store'
import { haptic, tgName } from '../tg'
import { Icon } from '../ui'

type Opt = { v: string | number; l: string; d?: string }
type Step = {
  key: string
  kind: 'text' | 'nums' | 'one' | 'multi'
  title: string
  sub?: string
  opts?: Opt[]
  grid?: boolean
  show?: (d: Record<string, any>) => boolean
}

const STEPS: Step[] = [
  { key: 'name', kind: 'text', title: 'Как тебя зовут?', sub: 'Только имя. Без почты, паролей и регистрации.' },
  { key: 'sex', kind: 'one', title: 'Твой пол', sub: 'Нужен для расчёта калорий', opts: [{ v: 'm', l: 'Мужской' }, { v: 'f', l: 'Женский' }] },
  { key: 'body', kind: 'nums', title: 'Возраст, рост и вес', sub: 'По ним считается норма калорий' },
  {
    key: 'goal', kind: 'one', title: 'Какая цель?', opts: [
      { v: 'lose', l: 'Похудеть', d: 'Убрать жир, сохранить мышцы' },
      { v: 'gain', l: 'Набрать массу', d: 'Больше мышц и силы' },
      { v: 'keep', l: 'Быть в форме', d: 'Тонус и самочувствие' },
      { v: 'endurance', l: 'Выносливость', d: 'Дольше, быстрее, легче' },
    ],
  },
  {
    key: 'job', kind: 'one', title: 'Чем занят днём?', opts: [
      { v: 'sit', l: 'В основном сижу', d: 'Офис, учёба, за рулём' },
      { v: 'feet', l: 'На ногах', d: 'Продавец, курьер, официант' },
      { v: 'hard', l: 'Физический труд', d: 'Стройка, склад, производство' },
    ],
  },
  {
    key: 'schedule', kind: 'one', title: 'Какой график?', sub: 'Под него подстроится время еды', opts: [
      { v: 'day', l: 'Обычный дневной', d: 'Работа днём, сон ночью' },
      { v: 'study', l: 'Учёба', d: 'Школа, колледж, вуз' },
      { v: 'shift', l: 'Сменный', d: '2/2, сутки через трое' },
      { v: 'night', l: 'Ночные смены', d: 'Работаю ночью, сплю днём' },
    ],
  },
  { key: 'meals', kind: 'one', grid: true, title: 'Сколько раз в день удобно есть?', opts: [{ v: 3, l: '3' }, { v: 4, l: '4' }, { v: 5, l: '5' }] },
  {
    key: 'exclude', kind: 'multi', title: 'Что не ешь?', sub: 'Можно ничего не выбирать', opts: [
      { v: 'meat', l: 'Мясо' }, { v: 'fish', l: 'Рыбу' }, { v: 'milk', l: 'Молочное' }, { v: 'eggs', l: 'Яйца' }, { v: 'gluten', l: 'Глютен' },
    ],
  },
  {
    key: 'budget', kind: 'one', title: 'Бюджет на еду', opts: [
      { v: 1, l: 'Экономный', d: 'Крупы, курица, яйца, простые овощи' },
      { v: 2, l: 'Средний', d: 'Плюс рыба, йогурт, орехи' },
      { v: 3, l: 'Без ограничений', d: 'Любые продукты' },
    ],
  },
  {
    key: 'cook', kind: 'one', title: 'Как с готовкой?', opts: [
      { v: 'yes', l: 'Готовлю сам', d: 'Могу потратить 30–40 минут' },
      { v: 'little', l: 'Минимум готовки', d: 'Только блюда на 10–20 минут' },
    ],
  },
  {
    key: 'level', kind: 'one', title: 'Опыт тренировок', opts: [
      { v: 1, l: 'Новичок', d: 'Меньше полугода или давно не занимался' },
      { v: 2, l: 'Средний', d: 'Занимаюсь от полугода' },
      { v: 3, l: 'Опытный', d: 'Больше двух лет регулярно' },
    ],
  },
  {
    key: 'place', kind: 'one', title: 'Где будешь тренироваться?', sub: 'Режим можно переключить в любой момент', opts: [
      { v: 'home', l: 'Дома', d: 'Свой вес и то, что есть под рукой' },
      { v: 'gym', l: 'В зале', d: 'Штанги, гантели, тренажёры' },
    ],
  },
  {
    key: 'equip', kind: 'multi', title: 'Что есть дома?', sub: 'Если ничего — программа будет со своим весом', show: (d) => d.place === 'home', opts: [
      { v: 'db', l: 'Гантели' }, { v: 'bar', l: 'Турник' }, { v: 'band', l: 'Резинки' },
    ],
  },
  { key: 'days', kind: 'one', grid: true, title: 'Сколько дней в неделю?', opts: [2, 3, 4, 5, 6].map((v) => ({ v, l: String(v) })) },
  { key: 'minutes', kind: 'one', grid: true, title: 'Сколько минут на тренировку?', opts: [30, 45, 60, 90].map((v) => ({ v, l: String(v) })) },
  {
    key: 'injuries', kind: 'multi', title: 'Есть проблемные зоны?', sub: 'Уберём упражнения, которые их нагружают', opts: [
      { v: 'knees', l: 'Колени' }, { v: 'back', l: 'Спина' }, { v: 'shoulders', l: 'Плечи' },
    ],
  },
]

const NUMS = [
  { key: 'age', label: 'Возраст', unit: 'лет', min: 12, max: 90 },
  { key: 'height', label: 'Рост', unit: 'см', min: 120, max: 230 },
  { key: 'weight', label: 'Вес', unit: 'кг', min: 30, max: 250 },
]

export default function Onboarding({ initial, onDone }: { initial?: Profile | null; onDone?: () => void }) {
  const [d, setD] = useState<Record<string, any>>(() =>
    initial
      ? { ...initial, age: String(initial.age), height: String(initial.height), weight: String(initial.weight) }
      : { name: tgName, exclude: [], equip: [], injuries: [], age: '', height: '', weight: '' },
  )
  const [i, setI] = useState(0)
  const steps = STEPS.filter((s) => !s.show || s.show(d))
  const step = steps[Math.min(i, steps.length - 1)]
  const last = i >= steps.length - 1

  const numOk = (k: (typeof NUMS)[number]) => {
    const v = parseFloat(String(d[k.key]).replace(',', '.'))
    return v >= k.min && v <= k.max
  }
  const valid =
    step.kind === 'text' ? String(d.name ?? '').trim().length > 0
    : step.kind === 'nums' ? NUMS.every(numOk)
    : step.kind === 'one' ? d[step.key] !== undefined
    : true

  const finish = () => {
    const num = (k: string) => parseFloat(String(d[k]).replace(',', '.'))
    const profile: Profile = {
      name: String(d.name).trim(), sex: d.sex, age: Math.round(num('age')), height: Math.round(num('height')), weight: num('weight'),
      goal: d.goal, job: d.job, schedule: d.schedule, meals: d.meals, exclude: d.exclude, budget: d.budget, cook: d.cook,
      level: d.level, place: d.place, equip: d.place === 'home' ? d.equip : (d.equip ?? []), days: d.days, minutes: d.minutes, injuries: d.injuries,
    }
    haptic('success')
    update((s) => ({
      ...s,
      profile,
      program: buildProgram(profile),
      startedAt: s.startedAt || iso(),
      weights: s.weights.length ? s.weights : [{ d: iso(), kg: profile.weight }],
      mealSwaps: {},
    }))
    onDone?.()
  }

  const next = () => { if (!valid) return; haptic(); last ? finish() : setI(i + 1) }
  const pickOne = (v: string | number) => {
    haptic()
    setD({ ...d, [step.key]: v })
    if (!last) setTimeout(() => setI((x) => x + 1), 160)
  }
  const toggle = (v: string | number) => {
    haptic()
    const cur: (string | number)[] = d[step.key] ?? []
    setD({ ...d, [step.key]: cur.includes(v) ? cur.filter((x) => x !== v) : [...cur, v] })
  }

  return (
    <div className="onb">
      <div className="onb-top">
        <button className="icon-btn" onClick={() => (i > 0 ? setI(i - 1) : onDone?.())} style={{ visibility: i > 0 || onDone ? 'visible' : 'hidden' }} aria-label="Назад">
          <Icon n="back" />
        </button>
        <div className="progress"><div style={{ width: `${((i + 1) / steps.length) * 100}%` }} /></div>
        <span className="onb-count">{i + 1}/{steps.length}</span>
      </div>

      <div className="onb-body" key={step.key}>
        <h1>{step.title}</h1>
        {step.sub && <p className="muted">{step.sub}</p>}

        {step.kind === 'text' && (
          <input
            className="input big" autoFocus placeholder="Имя" maxLength={24} value={d.name ?? ''}
            onChange={(e) => setD({ ...d, name: e.target.value })}
            onKeyDown={(e) => e.key === 'Enter' && next()}
          />
        )}

        {step.kind === 'nums' && (
          <div className="nums">
            {NUMS.map((k) => (
              <label key={k.key} className="num">
                <span>{k.label}</span>
                <div>
                  <input
                    className="input" inputMode="decimal" placeholder="—" value={d[k.key] ?? ''}
                    onChange={(e) => setD({ ...d, [k.key]: e.target.value.replace(/[^\d.,]/g, '').slice(0, 5) })}
                  />
                  <i>{k.unit}</i>
                </div>
              </label>
            ))}
          </div>
        )}

        {(step.kind === 'one' || step.kind === 'multi') && (
          <div className={step.grid ? 'opts grid' : 'opts'}>
            {step.opts!.map((o) => {
              const on = step.kind === 'one' ? d[step.key] === o.v : (d[step.key] ?? []).includes(o.v)
              return (
                <button key={String(o.v)} className={on ? 'opt on' : 'opt'} onClick={() => (step.kind === 'one' ? pickOne(o.v) : toggle(o.v))}>
                  <span>
                    <b>{o.l}</b>
                    {o.d && <small>{o.d}</small>}
                  </span>
                  {!step.grid && <span className="opt-mark">{on && <Icon n="check" size={16} />}</span>}
                </button>
              )
            })}
          </div>
        )}
      </div>

      <div className="onb-foot">
        <button className="btn" disabled={!valid} onClick={next}>{last ? 'Собрать мой план' : 'Дальше'}</button>
      </div>
    </div>
  )
}
