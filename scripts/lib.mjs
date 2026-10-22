// Shared helpers for the starter-material generators. No dependencies; run with `node scripts/build-starter.mjs`.
export const EXAMS_ALL = ['SSC_CGL', 'SSC_CHSL', 'SSC_MTS', 'SSC_GD', 'ANI']
export const SOURCE = { kind: 'original', label: 'Original practice set by Claude, not expert-reviewed' }

export function rng(seed) {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}
export const makeTools = (seed) => {
  const r = rng(seed)
  const int = (a, b) => a + Math.floor(r() * (b - a + 1))
  const pick = (xs) => xs[Math.floor(r() * xs.length)]
  const shuffle = (xs) => xs.map((x) => [r(), x]).sort((a, b) => a[0] - b[0]).map((p) => p[1])
  return { r, int, pick, shuffle }
}

export const gcd = (a, b) => (b ? gcd(b, a % b) : Math.abs(a))
export const lcm = (a, b) => (a / gcd(a, b)) * b

/** Formats numbers without float noise: 12, 12.5, 0.75 */
export const fmt = (n) => {
  const x = Math.round(n * 10000) / 10000
  return Number.isInteger(x) ? x.toLocaleString('en-IN') : String(x)
}
export const rs = (n) => `₹${fmt(n)}`

/** Fraction a/b in lowest terms as text ("3/4", "2", "-1/2"). */
export const frac = (a, b) => {
  if (b < 0) (a = -a), (b = -b)
  const g = gcd(a, b) || 1
  return b / g === 1 ? String(a / g) : `${a / g}/${b / g}`
}

/**
 * Builds one MCQ. `distractors` may contain duplicates or the answer itself; they are filtered,
 * and the question is dropped (null) if fewer than 3 distinct wrong options remain.
 */
export function mcq(tools, { subject, topic, text, answer, distractors, explanation, difficulty = 'medium', passage, steps = [], stemKey }) {
  const a = String(answer)
  const wrong = [...new Set(distractors.map(String))].filter((d) => d !== a && d.trim() !== '' && d !== 'NaN' && !d.includes('Infinity'))
  if (wrong.length < 3) return null
  const options = tools.shuffle([a, ...tools.shuffle(wrong).slice(0, 3)])
  return {
    examCodes: EXAMS_ALL,
    subject,
    topic,
    language: 'en',
    text,
    ...(passage ? { passage } : {}),
    explanation,
    solutionSteps: steps,
    difficulty,
    source: SOURCE,
    status: 'published',
    type: 'mcq',
    options,
    correctOption: options.indexOf(a),
    ...(stemKey ? { stemKey } : {}),
  }
}

/** Calls `make` until `count` distinct questions (by text + options) exist or attempts run out. */
export function collect(count, make, maxTries = count * 40) {
  const out = []
  const seen = new Set()
  for (let i = 0; i < maxTries && out.length < count; i++) {
    const q = make(i)
    if (!q) continue
    const stem = q.stemKey ?? (q.passage ?? '') + '|' + q.text
    if (seen.has(stem)) continue
    seen.add(stem)
    out.push(q)
  }
  return out
}
