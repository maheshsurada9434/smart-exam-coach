// Builds public/data/starter-questions.json and public/data/starter-content.json.
// Run: node scripts/build-starter.mjs   (no dependencies). Output is deterministic for the fixed seeds.
import { writeFileSync } from 'node:fs'
import { quant } from './gen-quant.mjs'
import { reasoning } from './gen-reasoning.mjs'
import { currentAffairs, english, ga } from './gen-english-ga.mjs'
import { GRAMMAR, IDIOMS, OWS, WORDS } from './english-data.mjs'
import { ARTICLES, COMPUTER_FACTS, FACTS } from './ga-data.mjs'
import { CURRENT_AFFAIRS } from './ca-data.mjs'

// Same rule as normalize() in src/questions/schema.ts.
const norm = (s) => s.normalize('NFKC').toLowerCase().replace(/[\s"'‘’“”!?,;:]+/g, '').replace(/\.(?!\d)|(?<!\d)\./g, '')
const key = (q) => `${q.language}::${norm(q.text)}::${q.options.map(norm).sort().join('|')}`

const sets = [
  ['QA', quant()],
  ['RE', reasoning()],
  ['EN', english()],
  ['GA', ga()],
  ['CA', currentAffairs()],
]
const seen = new Set()
const questions = []
for (const [code, list] of sets) {
  let n = 0
  for (const q of list) {
    const k = key(q)
    if (seen.has(k)) continue
    seen.add(k)
    const { stemKey: _s, _id: _i, ...clean } = q
    questions.push({ id: `ST-${code}-${String(++n).padStart(4, '0')}`, ...clean })
  }
}

// Sanity checks (the app re-validates everything with its Zod schema in tests).
for (const q of questions) {
  if (q.options.length !== 4 || new Set(q.options.map(norm)).size !== 4) throw new Error(`Bad options in ${q.id}: ${q.options}`)
  if (q.correctOption < 0 || q.correctOption > 3) throw new Error(`Bad answer index in ${q.id}`)
  if (!q.explanation) throw new Error(`Missing explanation in ${q.id}`)
}

const today = '2026-10-22'
writeFileSync(
  'public/data/starter-questions.json',
  JSON.stringify({ format: 'smart-exam-coach-questions', version: 1, exportedAt: `${today}T00:00:00.000Z`, questions }) + '\n',
)

const split = (s) => s.split('|').map((x) => x.trim()).filter(Boolean)
const base = { pack: 'starter', verification: 'unverified', language: 'en' }
const self = { label: 'Starter pack written by Claude, not expert-reviewed' }
const items = [
  ...WORDS.map(([w, meaning, syn, ant, ex], i) => ({ ...base, id: `SC-W-${i + 1}`, kind: 'word', front: w, back: meaning, synonyms: split(syn), antonyms: split(ant), examples: [ex], tags: [], source: self })),
  ...IDIOMS.map(([f, b, ex], i) => ({ ...base, id: `SC-I-${i + 1}`, kind: 'idiom', front: f, back: b, synonyms: [], antonyms: [], examples: [ex], tags: [], source: self })),
  ...OWS.map(([d, w], i) => ({ ...base, id: `SC-O-${i + 1}`, kind: 'ows', front: d, back: w, synonyms: [], antonyms: [], examples: [], tags: [], source: self })),
  ...GRAMMAR.map(([f, b, ex], i) => ({ ...base, id: `SC-G-${i + 1}`, kind: 'grammar', front: f, back: b, synonyms: [], antonyms: [], examples: split(ex), tags: [], source: self })),
  ...ARTICLES.map(([no, title]) => ({ ...base, id: `SC-P-${no}`, kind: 'polity', article: no, textType: 'simplified', front: `Article ${no}`, back: title, synonyms: [], antonyms: [], examples: [], tags: ['Constitution'], source: { label: 'Constitution of India: simplified article titles written by Claude, not the constitutional text' } })),
  ...[...FACTS, ...COMPUTER_FACTS].map(([topic, q, a, , ex], i) => ({ ...base, id: `SC-F-${i + 1}`, kind: 'ga-fact', front: q, back: `${a}. ${ex}`, synonyms: [], antonyms: [], examples: [], tags: [topic], source: self })),
  ...CURRENT_AFFAIRS.map(([id, date, headline, summary, label, url, tags]) => ({ ...base, id: `SC-${id}`, kind: 'current-affairs', front: headline, back: summary, synonyms: [], antonyms: [], examples: [], tags, publishedOn: date, reviewedOn: today, source: { label, url } })),
]
writeFileSync('public/data/starter-content.json', JSON.stringify({ format: 'smart-exam-coach-content', version: 1, pack: { id: 'starter' }, items }) + '\n')

const count = (k) => questions.filter((q) => q.id.startsWith(`ST-${k}`)).length
console.log(`questions ${questions.length}: QA ${count('QA')}, RE ${count('RE')}, EN ${count('EN')}, GA ${count('GA')}, CA ${count('CA')}`)
const kinds = {}
for (const c of items) kinds[c.kind] = (kinds[c.kind] ?? 0) + 1
console.log(`content ${items.length}:`, kinds)
