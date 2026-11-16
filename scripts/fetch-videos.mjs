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
  for (const c of found.slice(0, 12)) {
    if (c.len < 20 || c.len > 900) continue
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
