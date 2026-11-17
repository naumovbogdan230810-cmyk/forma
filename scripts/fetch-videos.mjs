// Подбирает к каждому упражнению видео с техникой на YouTube.
// Запуск: npm run videos            — только для упражнений без видео
//         npm run videos -- --all   — пересобрать все
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const src = readFileSync(join(root, 'src/data/exercises.ts'), 'utf8')
const outPath = join(root, 'src/data/videos.json')
const all = process.argv.includes('--all')
const only = process.argv.filter((a) => a.startsWith('--id=')).map((a) => a.slice(5))

const exercises = [...src.matchAll(/e\('([^']+)', '([^']+)'/g)].map((m) => ({ id: m[1], name: m[2] }))
const result = all ? {} : JSON.parse(readFileSync(outPath, 'utf8'))

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36',
  'Accept-Language': 'ru-RU,ru;q=0.9',
  Cookie: 'SOCS=CAI; CONSENT=YES+1',
}

function collect(node, out) {
  if (!node || typeof node !== 'object') return
  if (node.videoRenderer?.videoId) out.push(node.videoRenderer)
  for (const v of Object.values(node)) collect(v, out)
}

// Уточнённые запросы там, где поиск по названию даёт не то
const QUERY = {
  db_row: 'Тяга гантели одной рукой в наклоне техника',
  leg_press: 'Жим ногами в тренажёре техника выполнения',
  bb_squat: 'Приседания со штангой на плечах техника',
  deadlift: 'Классическая становая тяга техника выполнения',
  pushdown: 'Разгибание рук на верхнем блоке трицепс техника',
  db_curl: 'Подъём гантелей на бицепс стоя техника выполнения',
  treadmill: 'Ходьба на беговой дорожке в гору как правильно',
  wide_pushup: 'Широкие отжимания от пола техника',
  decline_pushup: 'Отжимания с ногами на возвышенности техника',
  prone_y: 'Упражнение Y лёжа на животе подъём рук',
  chinup: 'Подтягивания обратным хватом техника выполнения',
  band_pulldown: 'Вертикальная тяга резины к груди техника',
  superman_pull: 'Супермен с тягой локтей упражнение для спины',
  band_row: 'Тяга резины к поясу техника',
  glute_bridge: 'Ягодичный мост техника выполнения',
  hyperext: 'Гиперэкстензия техника выполнения',
  db_lunge: 'Выпады с гантелями техника выполнения',
  single_calf: 'Подъём на носок на одной ноге техника',
  db_calf: 'Подъём на носки с гантелями стоя техника',
  band_curl: 'Сгибание рук на бицепс с резиной стоя техника',
  db_ext: 'Разгибание рук с гантелью из-за головы техника выполнения',
  jumping_jack: 'Jumping Jack техника выполнения упражнение',
  shoulder_machine: 'Жим в тренажёре на плечи сидя техника выполнения',
  mountain: 'Упражнение альпинист техника выполнения',
}

// Что обязано быть в названии ролика (must) и чего быть не должно (not: название или канал)
const RULES = {
  wide_pushup: { must: /широк/i },
  decline_pushup: { must: /возвыш|скамь|опор|ноги на|ногами на/i },
  prone_y: { must: /(^|[^a-zа-я])y([^a-zа-я]|$)|игрек/i },
  chinup: { must: /обратн/i, not: /сравнен/i },
  band_pulldown: { must: /резин|эспандер|петл/i, not: /прямых руках|прямыми руками/i },
  superman_pull: { must: /супермен/i },
  db_row: { must: /одной рук/i },
  band_row: { must: /резин|эспандер|петл/i, not: /в наклоне/i },
  glute_bridge: { must: /ягодичн\S* мост/i, not: /штанг|одной|neuroapps/i },
  hyperext: { must: /гиперэкстенз/i, not: /калечит|убить/i },
  db_lunge: { must: /гантел/i },
  single_calf: { must: /одной ног/i },
  db_calf: { must: /гантел/i },
  band_curl: { must: /резин|эспандер|петл/i, not: /колено/i },
  db_ext: { must: /из-?\s?за головы/i, not: /VOD/ },
  jumping_jack: { must: /jumping|джампинг|зв[её]зд/i, not: /clash/i },
  shoulder_machine: { must: /тренаж/i, not: /hammer strength|lifefitness/i },
  mountain: { must: /альпинист|скалолаз/i, not: /neuroapps/i },
}
const sleep =(ms) => new Promise((r) => setTimeout(r, ms))
const seconds =(t = '') => t.split(':').reduce((a, x) => a * 60 + Number(x), 0)

async function search(query) {
  const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIQAQ%253D%253D&hl=ru`
  const html = await (await fetch(url, { headers: HEADERS })).text()
  const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/s)
  if (!m) throw new Error('нет данных в ответе YouTube')
  const list = []
  collect(JSON.parse(m[1]), list)
  return list.map((v) => ({
    v: v.videoId,
    t: v.title?.runs?.[0]?.text ?? '',
    ch: v.ownerText?.runs?.[0]?.text ?? '',
    len: seconds(v.lengthText?.simpleText),
  }))
}

async function embeddable(id) {
  const r = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent('https://www.youtube.com/watch?v=' + id)}`, { headers: HEADERS })
  return r.status === 200
}

async function pick(ex) {
  const found = await search(QUERY[ex.id] ?? `${ex.name} техника выполнения`)
  const rule = RULES[ex.id]
  for (const c of found.slice(0, rule ? 20 : 12)) {
    if (c.len < 20 || c.len > 900) continue
    if (rule?.must && !rule.must.test(c.t)) continue
    if (rule?.not && rule.not.test(`${c.t} ${c.ch}`)) continue
    if (await embeddable(c.v)) return { v: c.v, t: c.t, ch: c.ch }
  }
  return null
}

const todo = exercises.filter((e) => (only.length ? only.includes(e.id) : !result[e.id]))
console.log(`Упражнений: ${exercises.length}, ищу видео для: ${todo.length}`)

let i = 0
async function worker() {
  while (i < todo.length) {
    const ex = todo[i++]
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const v = await pick(ex)
        if (v) { result[ex.id] = v; console.log(`+ ${ex.name} → ${v.t} [${v.ch}]`) }
        else console.log(`- ${ex.name}: не нашлось`)
        break
      } catch (err) {
        if (attempt === 3) console.log(`! ${ex.name}: ${err.message}`)
        else await sleep(4000 * attempt)
      }
    }
    await sleep(1200)
  }
}
await worker()

const sorted = Object.fromEntries(exercises.filter((e) => result[e.id]).map((e) => [e.id, result[e.id]]))
writeFileSync(outPath, JSON.stringify(sorted, null, 2) + '\n')
console.log(`Готово: ${Object.keys(sorted).length} из ${exercises.length}`)
