import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { targets } from '../logic/nutrition'
import { buildProgram, WEEK_MAP } from '../logic/workout'
import { iso, update, WEEKDAYS, type Profile, type Program } from '../store'
import { haptic, tgName } from '../tg'
import { Icon, Seg } from '../ui'

type Required = 'sex' | 'goal' | 'job' | 'schedule' | 'cook' | 'level' | 'place'
/** Черновик анкеты: обязательные ответы появляются по ходу теста */
type Draft = Omit<Profile, Required> & Partial<Pick<Profile, Required>>

const BLANK: Draft = {
  name: tgName, age: 25, height: 175, weight: 70,
  meals: 4, exclude: [], budget: 2, equip: [], days: 3, minutes: 45, injuries: [],
}

const GOALS: { v: Profile['goal']; l: string; d: string; ic: string }[] = [
  { v: 'lose', l: 'Похудеть', d: 'Убрать жир, сохранить мышцы', ic: 'flame' },
  { v: 'gain', l: 'Набрать массу', d: 'Больше мышц и силы', ic: 'dumbbell' },
  { v: 'keep', l: 'Быть в форме', d: 'Тонус и самочувствие', ic: 'heart' },
  { v: 'endurance', l: 'Выносливость', d: 'Дольше, быстрее, легче', ic: 'bolt' },
]
const JOBS: { v: Profile['job']; l: string; d: string }[] = [
  { v: 'sit', l: 'В основном сижу', d: 'Офис, учёба, за рулём' },
  { v: 'feet', l: 'На ногах', d: 'Продавец, курьер, официант' },
  { v: 'hard', l: 'Физический труд', d: 'Стройка, склад, производство' },
]
const SCHEDULES: { v: Profile['schedule']; l: string; d: string }[] = [
  { v: 'day', l: 'Дневной', d: 'Работа днём, сон ночью' },
  { v: 'study', l: 'Учёба', d: 'Школа, колледж, вуз' },
  { v: 'shift', l: 'Сменный', d: '2/2, сутки через трое' },
  { v: 'night', l: 'Ночные смены', d: 'Работаю ночью' },
]
const LEVELS = [
  { v: 1, l: 'Новичок', d: 'Меньше полугода или давно не занимался' },
  { v: 2, l: 'Средний', d: 'Занимаюсь от полугода' },
  { v: 3, l: 'Опытный', d: 'Больше двух лет регулярно' },
]
const BUDGETS = [
  { v: 1, l: 'Экономно', d: 'Крупы, курица, яйца, простые овощи' },
  { v: 2, l: 'Средне', d: 'Плюс рыба, йогурт, орехи' },
  { v: 3, l: 'Любой', d: 'Любые продукты' },
]
const COOK = [
  { v: 'yes', l: 'Готовлю сам', d: 'Блюда на 30–40 минут — нормально' },
  { v: 'little', l: 'Минимум готовки', d: 'Только блюда на 10–20 минут' },
]
const EXCLUDE = [['meat', 'Мясо'], ['fish', 'Рыбу'], ['milk', 'Молочное'], ['eggs', 'Яйца'], ['gluten', 'Глютен']]
const EQUIP = [['db', 'Гантели'], ['bar', 'Турник'], ['band', 'Резинки']]
const INJURIES = [['knees', 'Колени'], ['back', 'Спина'], ['shoulders', 'Плечи']]

const SPLIT_NOTE: Record<number, string> = {
  2: 'Всё тело на каждой тренировке',
  3: 'Всё тело на каждой тренировке',
  4: 'Чередуем верх и низ',
  5: 'Сплит по группам мышц, плюс верх и низ',
  6: 'Толкай, тяни, ноги — два круга за неделю',
}
const MIN_NOTE: Record<number, string> = {
  30: '4 упражнения за тренировку', 45: '5 упражнений за тренировку',
  60: '6 упражнений за тренировку', 90: '7 упражнений за тренировку',
}
const MEALS_NOTE: Record<number, string> = { 3: 'Завтрак, обед и ужин', 4: 'Три приёма и перекус', 5: 'Три приёма и два перекуса' }

const HEAD: { title: string; sub?: string }[] = [
  { title: '' },
  { title: 'Расскажи о себе', sub: 'По этим цифрам считается норма калорий' },
  { title: 'Какая цель?', sub: 'От неё зависят и нагрузка, и питание' },
  { title: 'Как проходит день?', sub: 'Подстрою калории и время еды' },
  { title: 'Где тренируешься?', sub: 'Режим потом можно переключить в один тап' },
  { title: 'Сколько времени есть?' },
  { title: 'Что с едой?' },
]
const LAST = HEAD.length - 1

const plural = (n: number, f: [string, string, string]) => {
  const a = n % 10, b = n % 100
  return a === 1 && b !== 11 ? f[0] : a >= 2 && a <= 4 && (b < 12 || b > 14) ? f[1] : f[2]
}
const fmt = (n: number) => n.toLocaleString('ru-RU')

function Q({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <div className="q">
      <span className="q-label">{label}</span>
      {children}
      {hint && <p className="q-hint">{hint}</p>}
    </div>
  )
}

function Dial({ label, unit, value, min, max, step = 1, onChange }: {
  label: string; unit: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void
}) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v / step) * step)))
  const k = ((Math.min(max, Math.max(min, value)) - min) / (max - min)) * 100
  return (
    <div className="dial">
      <div className="dial-top">
        <span>{label}</span>
        <div className="dial-val">
          <button className="dial-btn" onClick={() => { haptic(); set(value - step) }} aria-label={`${label}: меньше`}>−</button>
          <b>{String(value).replace('.', ',')}<i>{unit}</i></b>
          <button className="dial-btn" onClick={() => { haptic(); set(value + step) }} aria-label={`${label}: больше`}>+</button>
        </div>
      </div>
      <input
        className="range" type="range" min={min} max={max} step={step} value={value} aria-label={label}
        onChange={(e) => set(Number(e.target.value))} style={{ '--k': `${k}%` } as CSSProperties}
      />
    </div>
  )
}

function Chips({ items, value, onToggle }: { items: string[][]; value: string[]; onToggle: (v: string) => void }) {
  return (
    <div className="chips">
      {items.map(([v, l]) => (
        <button key={v} className={value.includes(v) ? 'chip on' : 'chip'} onClick={() => onToggle(v)}>{l}</button>
      ))}
    </div>
  )
}

const BUILD_LINES = ['Калории и БЖУ', 'Упражнения под тебя', 'Меню на неделю']

function Build({ profile, onOpen }: { profile: Profile; onOpen: (program: Program) => void }) {
  const program = useMemo(() => buildProgram(profile), [profile])
  const kcal = useMemo(() => targets(profile).kcal, [profile])
  const [n, setN] = useState(0)
  const ready = n >= BUILD_LINES.length
  useEffect(() => {
    if (ready) { haptic('success'); return }
    const t = setTimeout(() => setN(n + 1), 700)
    return () => clearTimeout(t)
  }, [n, ready])
  const exCount = new Set(program.days.flatMap((day) => day.items.map((it) => it.ex))).size

  return (
    <div className="build">
      <div className="onb-head">
        <h1>{ready ? `Готово, ${profile.name}` : 'Собираю твой план'}</h1>
        <p className="muted">{ready ? 'Всё подобрано под твои ответы — можно начинать.' : 'Пара секунд.'}</p>
      </div>
      <ul className="build-list">
        {BUILD_LINES.map((l, idx) => (
          <li key={l} className={idx < n ? 'on' : idx === n ? 'run' : ''}>
            <span className="build-dot">{idx < n && <Icon n="check" size={15} />}</span>
            {l}
          </li>
        ))}
      </ul>
      {ready && (
        <div className="build-out">
          <div className="tiles">
            <div className="tile"><b>{fmt(kcal)}</b><span>ккал в день</span></div>
            <div className="tile"><b>{profile.days}</b><span>{plural(profile.days, ['тренировка', 'тренировки', 'тренировок'])} в неделю</span></div>
            <div className="tile"><b>{exCount}</b><span>{plural(exCount, ['упражнение', 'упражнения', 'упражнений'])} с видео</span></div>
          </div>
          <p className="note">Тренировки {profile.place === 'home' ? 'дома' : 'в зале'}, примерно по {profile.minutes} минут. Меню на 7 дней и список покупок уже внутри.</p>
          <button className="btn" onClick={() => onOpen(program)}>Открыть план</button>
        </div>
      )}
    </div>
  )
}

export default function Onboarding({ initial, onDone }: { initial?: Profile | null; onDone?: () => void }) {
  const [d, setD] = useState<Draft>(() => (initial ? { ...initial } : BLANK))
  const [i, setI] = useState(0) // 0 — приветствие, дальше экраны с вопросами
  const [built, setBuilt] = useState<Profile | null>(null)
  const [bodyTouched, setBodyTouched] = useState(!!initial)
  const set = (patch: Partial<Draft>) => setD((x) => ({ ...x, ...patch }))

  useEffect(() => { window.scrollTo(0, 0) }, [i, built])

  if (built)
    return (
      <Build
        profile={built}
        onOpen={(program) => {
          update((s) => ({
            ...s,
            profile: built,
            program,
            startedAt: s.startedAt || iso(),
            weights: s.weights.length ? s.weights : [{ d: iso(), kg: built.weight }],
            mealSwaps: {},
          }))
          onDone?.()
        }}
      />
    )

  const name = d.name.trim()
  const valid = [
    name.length > 0,
    !!d.sex,
    !!d.goal,
    !!d.job && !!d.schedule,
    !!d.place && !!d.level,
    true,
    !!d.cook,
  ][i]

  const next = () => {
    if (!valid) return
    haptic()
    if (i < LAST) setI(i + 1)
    else setBuilt({ ...d, name } as Profile)
  }
  const back = () => (i > 0 ? setI(i - 1) : onDone?.())
  const toggle = (key: 'exclude' | 'equip' | 'injuries') => (v: string) => {
    haptic()
    set({ [key]: d[key].includes(v) ? d[key].filter((x) => x !== v) : [...d[key], v] } as Partial<Draft>)
  }
  const body = (patch: Partial<Draft>) => { setBodyTouched(true); set(patch) }
  const pickSex = (sex: Profile['sex']) => {
    haptic()
    // пока человек сам не трогал рост и вес — подставляем типичные для пола
    set(bodyTouched ? { sex } : { sex, height: sex === 'm' ? 178 : 165, weight: sex === 'm' ? 75 : 60 })
  }

  if (i === 0)
    return (
      <div className="onb">
        {onDone && (
          <div className="onb-top">
            <button className="icon-btn" onClick={back} aria-label="Назад"><Icon n="back" /></button>
          </div>
        )}
        <div className="wl">
          <div className="wl-mark">Ф</div>
          <div className="onb-head">
            <h1>{initial ? 'Обновим план' : name ? `Привет, ${name}.` : 'Привет.'}<br />{initial ? 'под новые вводные' : 'Соберу план под тебя'}</h1>
            <p className="muted">
              {initial
                ? 'Прошлые ответы уже подставлены — поменяй только то, что изменилось.'
                : 'Шесть коротких экранов, около минуты. Без почты, паролей и регистрации.'}
            </p>
          </div>
          <ul className="wl-list">
            <li>
              <span className="wl-ic"><Icon n="dumbbell" /></span>
              <span><b>Тренировки</b><small>Дома или в зале, любое упражнение можно заменить</small></span>
            </li>
            <li>
              <span className="wl-ic"><Icon n="food" /></span>
              <span><b>Питание</b><small>Меню на неделю с граммовками и списком покупок</small></span>
            </li>
            <li>
              <span className="wl-ic"><Icon n="play" size={20} /></span>
              <span><b>Техника</b><small>Видео к каждому упражнению</small></span>
            </li>
          </ul>
        </div>
        <div className="onb-foot">
          <label className="wl-name">
            <span className="q-label">Как тебя зовут?</span>
            <input
              className="input" placeholder="Имя" maxLength={24} value={d.name} enterKeyHint="go"
              onChange={(e) => set({ name: e.target.value })}
              onKeyDown={(e) => e.key === 'Enter' && next()}
            />
          </label>
          <button className="btn" disabled={!valid} onClick={next}>{initial ? 'Продолжить' : 'Поехали'}</button>
        </div>
      </div>
    )

  const head = HEAD[i]
  return (
    <div className="onb">
      <div className="onb-top">
        <button className="icon-btn" onClick={back} aria-label="Назад"><Icon n="back" /></button>
        <div className="steps" aria-label={`Шаг ${i} из ${LAST}`}>
          {HEAD.slice(1).map((_, idx) => <i key={idx} className={idx < i ? 'on' : ''} />)}
        </div>
        <span className="onb-count">{i}/{LAST}</span>
      </div>

      <div className="onb-body" key={i}>
        <div className="onb-head">
          <h1>{head.title}</h1>
          {head.sub && <p className="muted">{head.sub}</p>}
        </div>

        {i === 1 && (
          <>
            <div className="picks">
              {([['m', 'Мужчина'], ['f', 'Женщина']] as const).map(([v, l]) => (
                <button key={v} className={d.sex === v ? 'pick slim on' : 'pick slim'} onClick={() => pickSex(v)}><b>{l}</b></button>
              ))}
            </div>
            <div className="dials">
              <Dial label="Возраст" unit="лет" min={12} max={80} value={d.age} onChange={(age) => body({ age })} />
              <Dial label="Рост" unit="см" min={140} max={215} value={d.height} onChange={(height) => body({ height })} />
              <Dial label="Вес" unit="кг" min={35} max={180} step={0.5} value={d.weight} onChange={(weight) => body({ weight })} />
            </div>
          </>
        )}

        {i === 2 && (
          <div className="picks">
            {GOALS.map((o) => (
              <button
                key={o.v} className={d.goal === o.v ? 'pick on' : 'pick'}
                onClick={() => { haptic(); set({ goal: o.v }); setTimeout(() => setI((x) => (x === 2 ? 3 : x)), 220) }}
              >
                <span className="pick-ic"><Icon n={o.ic} /></span>
                <span><b>{o.l}</b><small>{o.d}</small></span>
              </button>
            ))}
          </div>
        )}

        {i === 3 && (
          <>
            <Q label="Чем занят днём">
              <div className="opts">
                {JOBS.map((o) => (
                  <button key={o.v} className={d.job === o.v ? 'opt on' : 'opt'} onClick={() => { haptic(); set({ job: o.v }) }}>
                    <span><b>{o.l}</b><small>{o.d}</small></span>
                    <span className="opt-mark">{d.job === o.v && <Icon n="check" size={16} />}</span>
                  </button>
                ))}
              </div>
            </Q>
            <Q label="График">
              <div className="picks">
                {SCHEDULES.map((o) => (
                  <button key={o.v} className={d.schedule === o.v ? 'pick slim on' : 'pick slim'} onClick={() => { haptic(); set({ schedule: o.v }) }}>
                    <span><b>{o.l}</b><small>{o.d}</small></span>
                  </button>
                ))}
              </div>
            </Q>
          </>
        )}

        {i === 4 && (
          <>
            <div className="picks">
              {([['home', 'Дома', 'Свой вес и то, что под рукой', 'home'], ['gym', 'В зале', 'Штанги, гантели, тренажёры', 'dumbbell']] as const).map(([v, l, t, ic]) => (
                <button key={v} className={d.place === v ? 'pick on' : 'pick'} onClick={() => { haptic(); set({ place: v }) }}>
                  <span className="pick-ic"><Icon n={ic} /></span>
                  <span><b>{l}</b><small>{t}</small></span>
                </button>
              ))}
            </div>
            {d.place === 'home' && (
              <Q label="Что есть дома" hint={d.equip.length ? undefined : 'Ничего — тоже вариант: соберу программу со своим весом'}>
                <Chips items={EQUIP} value={d.equip} onToggle={toggle('equip')} />
              </Q>
            )}
            <Q label="Опыт" hint={LEVELS.find((o) => o.v === d.level)?.d}>
              <Seg value={d.level ?? 0} options={LEVELS} onChange={(v) => set({ level: v as Profile['level'] })} />
            </Q>
            <Q label="Что беречь" hint={d.injuries.length ? 'Уберу упражнения, которые нагружают эти зоны' : 'Если ничего не беспокоит — пропусти'}>
              <Chips items={INJURIES} value={d.injuries} onToggle={toggle('injuries')} />
            </Q>
          </>
        )}

        {i === 5 && (
          <>
            <Q label="Тренировок в неделю" hint={SPLIT_NOTE[d.days]}>
              <Seg value={d.days} options={[2, 3, 4, 5, 6].map((v) => ({ v, l: String(v) }))} onChange={(days) => set({ days })} />
              <div className="wkp" aria-hidden>
                {WEEKDAYS.map((w, idx) => <span key={w} className={WEEK_MAP[d.days].includes(idx) ? 'on' : ''}>{w}</span>)}
              </div>
            </Q>
            <Q label="Минут на тренировку" hint={MIN_NOTE[d.minutes]}>
              <Seg value={d.minutes} options={[30, 45, 60, 90].map((v) => ({ v, l: String(v) }))} onChange={(minutes) => set({ minutes })} />
            </Q>
          </>
        )}

        {i === 6 && (
          <>
            <Q label="Приёмов пищи в день" hint={MEALS_NOTE[d.meals]}>
              <Seg value={d.meals} options={[3, 4, 5].map((v) => ({ v, l: String(v) }))} onChange={(v) => set({ meals: v as Profile['meals'] })} />
            </Q>
            <Q label="Что не ешь" hint={d.exclude.length ? undefined : 'Ем всё — ничего не выбирай'}>
              <Chips items={EXCLUDE} value={d.exclude} onToggle={toggle('exclude')} />
            </Q>
            <Q label="Бюджет на еду" hint={BUDGETS.find((o) => o.v === d.budget)?.d}>
              <Seg value={d.budget} options={BUDGETS} onChange={(v) => set({ budget: v as Profile['budget'] })} />
            </Q>
            <Q label="Готовка" hint={COOK.find((o) => o.v === d.cook)?.d}>
              <Seg value={d.cook ?? ''} options={COOK} onChange={(v) => set({ cook: v as Profile['cook'] })} />
            </Q>
            <p className="note">Твоя норма — около <b>{fmt(targets(d as Profile).kcal)} ккал</b> в день. Меню соберу под неё.</p>
          </>
        )}
      </div>

      <div className="onb-foot">
        <button className="btn" disabled={!valid} onClick={next}>{i === LAST ? 'Собрать мой план' : 'Дальше'}</button>
      </div>
    </div>
  )
}
