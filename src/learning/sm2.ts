// SM-2 spaced repetition (Wozniak, 1987), as documented in docs/ALGORITHMS.md.
import { addDays } from './dates'

export type Sm2State = {
  easiness: number // "EF", never below 1.3
  interval: number // days
  repetitions: number // successful reviews in a row
  due: string // YYYY-MM-DD
  successes: number
  failures: number
  lastReviewed: string | null
}

export const newSm2 = (today: string): Sm2State => ({
  easiness: 2.5,
  interval: 0,
  repetitions: 0,
  due: today,
  successes: 0,
  failures: 0,
  lastReviewed: null,
})

/** quality 0–5. Below 3 is a failed recall: the item comes back tomorrow. */
export function review(s: Sm2State, quality: number, today: string): Sm2State {
  const q = Math.max(0, Math.min(5, Math.round(quality)))
  const easiness = Math.max(1.3, Math.round((s.easiness + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))) * 1000) / 1000)
  if (q < 3) return { ...s, easiness, repetitions: 0, interval: 1, due: addDays(today, 1), failures: s.failures + 1, lastReviewed: today }
  const repetitions = s.repetitions + 1
  const interval = repetitions === 1 ? 1 : repetitions === 2 ? 6 : Math.round(s.interval * s.easiness)
  return { ...s, easiness, repetitions, interval, due: addDays(today, interval), successes: s.successes + 1, lastReviewed: today }
}

export const GRADES = [
  { label: 'Again', quality: 1, hint: 'Forgot' },
  { label: 'Hard', quality: 3, hint: 'Recalled with effort' },
  { label: 'Good', quality: 4, hint: 'Recalled' },
  { label: 'Easy', quality: 5, hint: 'Instant' },
] as const

export type Bucket = 'overdue' | 'today' | 'upcoming'
export const bucket = (due: string, today: string): Bucket => (due < today ? 'overdue' : due === today ? 'today' : 'upcoming')

/** Only repeated successful reviews count; opening an item never does. */
export const isMature = (s: Sm2State) => s.interval >= 21
