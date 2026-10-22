// Pure analytics over stored attempts. Every figure comes from real records; small samples are flagged.
import { addDays, localDate } from '../learning/dates'

export type Att = {
  questionId: string
  examCode?: string
  subject?: string
  topic: string
  correct: boolean
  timeMs?: number
  createdAt: string
  mode?: string
}

/** Below this many attempts a figure is shown as provisional. */
export const PROVISIONAL_BELOW = 20
/** Both halves of a trend need at least this many attempts. */
export const TREND_MIN = 10
/** A change of this many accuracy points (or more) counts as improving / declining. */
export const TREND_DELTA = 0.05

export const dayOf = (iso: string) => localDate(new Date(iso))

export type Range = '7d' | '30d' | '90d' | 'all'
export const RANGE_LABEL: Record<Range, string> = { '7d': 'Last 7 days', '30d': 'Last 30 days', '90d': 'Last 90 days', all: 'All time' }
export const rangeStart = (r: Range, today: string) =>
  r === 'all' ? null : addDays(today, -({ '7d': 7, '30d': 30, '90d': 90 }[r] - 1))

export function filterAttempts(atts: Att[], f: { from?: string | null; to?: string; examCode?: string | null }) {
  return atts.filter((a) => {
    const d = dayOf(a.createdAt)
    return (!f.from || d >= f.from) && (!f.to || d <= f.to) && (!f.examCode || a.examCode === f.examCode)
  })
}

export function summary(atts: Att[]) {
  const correct = atts.filter((a) => a.correct).length
  const timeMs = atts.reduce((n, a) => n + (a.timeMs && a.timeMs > 0 ? a.timeMs : 0), 0)
  return {
    attempted: atts.length,
    correct,
    incorrect: atts.length - correct,
    accuracy: atts.length ? correct / atts.length : null,
    timeMs,
    avgTimeMs: atts.length ? Math.round(timeMs / atts.length) : null,
    provisional: atts.length < PROVISIONAL_BELOW,
  }
}

export function groupBy(atts: Att[], key: 'subject' | 'topic') {
  const m = new Map<string, Att[]>()
  for (const a of atts) {
    const k = a[key] || 'Unknown'
    m.set(k, [...(m.get(k) ?? []), a])
  }
  return [...m].map(([name, list]) => ({ name, ...summary(list) })).sort((a, b) => b.attempted - a.attempted || a.name.localeCompare(b.name))
}

/** One row per calendar day from `from` to `to`, including days with no activity. */
export function daily(atts: Att[], from: string, to: string) {
  const byDay = new Map<string, Att[]>()
  for (const a of atts) byDay.set(dayOf(a.createdAt), [...(byDay.get(dayOf(a.createdAt)) ?? []), a])
  const out = []
  for (let d = from; d <= to; d = addDays(d, 1)) {
    const s = summary(byDay.get(d) ?? [])
    out.push({ date: d, attempted: s.attempted, correct: s.correct, accuracy: s.accuracy, minutes: Math.round(s.timeMs / 60000) })
  }
  return out
}

/** Weeks start on Monday. */
export const weekStart = (day: string) => {
  const wd = new Date(`${day}T12:00:00Z`).getUTCDay()
  return addDays(day, -((wd + 6) % 7))
}

export function weekly(atts: Att[]) {
  const m = new Map<string, Att[]>()
  for (const a of atts) {
    const w = weekStart(dayOf(a.createdAt))
    m.set(w, [...(m.get(w) ?? []), a])
  }
  return [...m].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([week, list]) => ({ week, ...summary(list), minutes: Math.round(summary(list).timeMs / 60000) }))
}

/** Last 7 days vs everything before. Needs TREND_MIN attempts on both sides. */
export function trend(atts: Att[], today: string) {
  const cut = addDays(today, -6)
  const recent = summary(atts.filter((a) => dayOf(a.createdAt) >= cut))
  const earlier = summary(atts.filter((a) => dayOf(a.createdAt) < cut))
  if (recent.attempted < TREND_MIN || earlier.attempted < TREND_MIN || recent.accuracy === null || earlier.accuracy === null)
    return { recent, earlier, change: null, label: 'provisional' as const }
  const change = recent.accuracy - earlier.accuracy
  const label = change >= TREND_DELTA ? ('improving' as const) : change <= -TREND_DELTA ? ('declining' as const) : ('steady' as const)
  return { recent, earlier, change, label }
}

export function repeatedErrors(atts: Att[], min = 2) {
  const m = new Map<string, { questionId: string; topic: string; wrong: number; last: string }>()
  for (const a of atts) {
    if (a.correct) continue
    const e = m.get(a.questionId) ?? { questionId: a.questionId, topic: a.topic, wrong: 0, last: a.createdAt }
    e.wrong++
    if (a.createdAt > e.last) e.last = a.createdAt
    m.set(a.questionId, e)
  }
  return [...m.values()].filter((e) => e.wrong >= min).sort((a, b) => b.wrong - a.wrong || (a.last < b.last ? 1 : -1))
}

export function coverage(atts: Att[], syllabusTopics: string[]) {
  const done = new Set(atts.map((a) => a.topic))
  const covered = syllabusTopics.filter((t) => done.has(t)).length
  return { covered, total: syllabusTopics.length, pct: syllabusTopics.length ? covered / syllabusTopics.length : 0 }
}

export const pct = (x: number | null) => (x === null ? '—' : `${Math.round(x * 100)}%`)
export const minutes = (ms: number) => {
  const m = Math.round(ms / 60000)
  return m >= 60 ? `${Math.floor(m / 60)} h ${m % 60} min` : `${m} min`
}

/** Attempts as CSV rows for export. */
export function attemptsCsvRows(atts: Att[]) {
  return [
    ['date', 'exam', 'subject', 'topic', 'question_id', 'mode', 'correct', 'seconds'],
    ...atts.map((a) => [a.createdAt, a.examCode ?? '', a.subject ?? '', a.topic, a.questionId, a.mode ?? '', a.correct ? 'yes' : 'no', a.timeMs ? String(Math.round(a.timeMs / 1000)) : '']),
  ]
}
