// English and GA questions built from the hand-written data. Wrong options are other stored answers of the
// same kind, filtered so they cannot also be correct (e.g. a near-synonym is never a "wrong" synonym option).
import { collect, makeTools, mcq } from './lib.mjs'
import { GRAMMAR_MCQ, IDIOMS, OWS, WORDS } from './english-data.mjs'
import { ARTICLES, CHEM, COMPUTER_ABBR, COMPUTER_FACTS, FACTS, SI_UNITS, STATE_CAPITALS, VITAMINS, WORLD_CAPITALS } from './ga-data.mjs'
import { CURRENT_AFFAIRS } from './ca-data.mjs'

const split = (s) => s.split('|').map((x) => x.trim())
const words = WORDS.map(([w, meaning, syn, ant, ex]) => ({ w, meaning, syn: split(syn), ant: split(ant), ex }))
const lc = (s) => s.toLowerCase()

/** Words whose meaning overlaps with x (shared synonym, or one lists the other). */
function related(x, y) {
  const a = new Set([x.w, ...x.syn].map(lc))
  const b = new Set([y.w, ...y.syn].map(lc))
  return [...a].some((v) => b.has(v))
}
function opposite(x, y) {
  const a = new Set([x.w, ...x.syn].map(lc))
  return y.ant.some((v) => a.has(lc(v))) || x.ant.some((v) => new Set([y.w, ...y.syn].map(lc)).has(lc(v)))
}

export function english(seed = 303) {
  const t = makeTools(seed)
  const { pick, shuffle } = t
  const S = 'English'
  const Q = (topic, o) => mcq(t, { subject: S, topic, ...o })
  const out = []

  out.push(
    ...collect(110, () => {
      const x = pick(words)
      const pool = words.filter((y) => y !== x && !related(x, y) && !opposite(x, y)).flatMap((y) => y.syn)
      const bad = new Set([...x.syn, ...x.ant, x.w].map(lc))
      const ds = [...x.ant.slice(0, 1), ...shuffle(pool).filter((d) => !bad.has(lc(d)))].slice(0, 6)
      return Q('Synonyms', { text: `Choose the word most similar in meaning to "${x.w}".`, answer: x.syn[0], distractors: ds, explanation: `"${x.w}" means "${lc(x.meaning)}". Its synonyms include ${x.syn.join(', ')}. Example: ${x.ex}`, difficulty: 'easy' })
    }),
  )
  out.push(
    ...collect(100, () => {
      const x = pick(words)
      const pool = words.filter((y) => y !== x && !related(x, y) && !opposite(x, y)).flatMap((y) => y.ant)
      const bad = new Set([...x.ant, x.w].map(lc))
      const ds = [...x.syn.slice(0, 1), ...shuffle(pool).filter((d) => !bad.has(lc(d)))].slice(0, 6)
      return Q('Antonyms', { text: `Choose the word opposite in meaning to "${x.w}".`, answer: x.ant[0], distractors: ds, explanation: `"${x.w}" means "${lc(x.meaning)}"; its opposite is "${x.ant[0]}".`, difficulty: 'easy' })
    }),
  )
  out.push(
    ...collect(85, () => {
      const [idiom, meaning, ex] = pick(IDIOMS)
      const ds = shuffle(IDIOMS.filter((i) => i[1] !== meaning).map((i) => i[1]))
      return Q('Idioms and Phrases', { text: `What is the meaning of the idiom "${idiom}"?`, answer: meaning, distractors: ds, explanation: `"${idiom}" means ${lc(meaning)}. Example: ${ex}`, difficulty: 'medium' })
    }),
  )
  out.push(
    ...collect(95, () => {
      const [def, word] = pick(OWS)
      const ds = shuffle(OWS.filter((o) => o[1] !== word).map((o) => o[1]))
      return Q('One Word Substitution', { text: `One word for: "${def}"`, answer: word, distractors: ds, explanation: `"${def}" is called "${word}".`, difficulty: 'medium' })
    }),
  )
  // Spelling: three misspellings made by simple, common errors.
  const misspell = (w, r) => {
    const v = 'aeiou'
    const s = w.toLowerCase()
    const ops = [
      () => s.replace(/([^aeiou])\1/, '$1'), // drop a doubled consonant
      () => {
        // double a consonant in the middle of the word (never the first letters)
        const i = [...s].findIndex((c, k) => k >= 2 && 'bcdfgklmnprst'.includes(c) && v.includes(s[k + 1] ?? '') && s[k - 1] !== c)
        return i < 0 ? s : s.slice(0, i) + s[i] + s.slice(i)
      },
      () => s.replace(/ie/, 'ei'),
      () => s.replace(/ei/, 'ie'),
      () => {
        const i = [...s].findIndex((c, k) => k > 1 && v.includes(c))
        return i < 0 ? s : s.slice(0, i) + v[(v.indexOf(s[i]) + 1 + Math.floor(r() * 4)) % 5] + s.slice(i + 1)
      },
      () => {
        const i = 2 + Math.floor(r() * (s.length - 4))
        return s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2)
      },
    ]
    const cap = (x) => x[0].toUpperCase() + x.slice(1)
    return [...new Set(ops.map((f) => cap(f())))].filter((x) => x.toLowerCase() !== s)
  }
  const long = [...words.map((x) => x.w), ...OWS.map((o) => o[1])].filter((w) => w.length >= 8 && /^[A-Za-z]+$/.test(w))
  out.push(...collect(40, () => {
    const w = pick(long)
    return Q('Spelling', { text: 'Choose the correctly spelt word.', answer: w, distractors: misspell(w, t.r), explanation: `The correct spelling is "${w}".`, difficulty: 'medium', stemKey: w })
  }))
  for (const [topic, text, answer, ds, explanation] of GRAMMAR_MCQ) {
    const q = Q(topic, { text, answer, distractors: ds, explanation, difficulty: 'medium' })
    if (q) out.push(q)
  }
  return out
}

export function ga(seed = 404) {
  const t = makeTools(seed)
  const { pick, shuffle } = t
  const S = 'General Awareness'
  const Q = (topic, o) => mcq(t, { subject: S, topic, ...o })
  const out = []
  const from = (rows, n, make) => out.push(...collect(n, () => make(pick(rows))))

  from(ARTICLES, 55, ([no, title]) =>
    Q('Indian Polity', { text: `Article ${no} of the Constitution of India deals with:`, answer: title, distractors: shuffle(ARTICLES.filter((a) => a[0] !== no).map((a) => a[1])), explanation: `Article ${no}: ${title}. (Simplified wording.)`, difficulty: 'medium' }),
  )
  from(ARTICLES, 30, ([no, title]) =>
    Q('Indian Polity', { text: `Which Article of the Constitution of India deals with: ${title}?`, answer: `Article ${no}`, distractors: shuffle(ARTICLES.filter((a) => a[0] !== no).map((a) => `Article ${a[0]}`)), explanation: `${title} is Article ${no}.`, difficulty: 'hard' }),
  )
  from(CHEM, 30, ([el, sym]) => Q('General Science', { text: `What is the chemical symbol of ${el}?`, answer: sym, distractors: shuffle(CHEM.filter((c) => c[1] !== sym).map((c) => c[1])), explanation: `${el} has the symbol ${sym}.`, difficulty: 'easy' }))
  from(SI_UNITS, 18, ([q, u]) => Q('General Science', { text: `What is the SI unit of ${q.toLowerCase()}?`, answer: u, distractors: shuffle(SI_UNITS.filter((s) => s[1] !== u).map((s) => s[1])), explanation: `The SI unit of ${q.toLowerCase()} is the ${u.toLowerCase()}.`, difficulty: 'easy' }))
  from(VITAMINS, 7, ([v, d]) => Q('General Science', { text: `Deficiency of ${v} causes:`, answer: d, distractors: shuffle(VITAMINS.filter((x) => x[1] !== d).map((x) => x[1])), explanation: `${v} deficiency causes ${d.toLowerCase()}.`, difficulty: 'easy' }))
  from(COMPUTER_ABBR, 30, ([a, full]) => Q('Computer Awareness', { text: `In computing, what does "${a}" stand for?`, answer: full, distractors: shuffle(COMPUTER_ABBR.filter((x) => x[1] !== full).map((x) => x[1])), explanation: `${a} stands for ${full}.`, difficulty: 'easy' }))
  from(STATE_CAPITALS, 29, ([s, c]) => Q('Static GK', { text: `What is the capital of ${s}?`, answer: c, distractors: shuffle(STATE_CAPITALS.filter((x) => x[1] !== c).map((x) => x[1])), explanation: `The capital of ${s} is ${c}.`, difficulty: 'easy' }))
  from(WORLD_CAPITALS, 31, ([s, c]) => Q('Static GK', { text: `What is the capital of ${s}?`, answer: c, distractors: shuffle(WORLD_CAPITALS.filter((x) => x[1] !== c).map((x) => x[1])), explanation: `The capital of ${s} is ${c}.`, difficulty: 'easy' }))
  for (const [topic, text, answer, ds, explanation] of [...FACTS, ...COMPUTER_FACTS]) {
    const q = Q(topic, { text, answer, distractors: ds, explanation, difficulty: 'medium' })
    if (q) out.push(q)
  }
  return out
}

export function currentAffairs(seed = 505) {
  const t = makeTools(seed)
  return CURRENT_AFFAIRS.map(([id, date, , summary, label, url, , question, answer, ds]) => ({
    ...mcq(t, { subject: 'General Awareness', topic: 'Current Affairs', text: question, answer, distractors: ds, explanation: `${summary} (Source: ${label}, ${date}.)`, difficulty: 'medium' }),
    source: { kind: 'original', label: `Current affairs question by Claude from ${label} (${date}); not independently verified`, url },
    _id: id,
  }))
}
