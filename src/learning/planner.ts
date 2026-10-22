// Deterministic study planner: turns recommendations into tasks that fit the student's available time.
import { addDays, weekday } from './dates'
import type { Recommendation } from './recommend'

export type TaskType = 'concept' | 'practice' | 'drill' | 'error-review' | 'revision' | 'vocabulary' | 'mock'
export type PlannedTask = {
  type: TaskType
  topic?: string
  subject?: string
  durationMin: number
  questionCount?: number
  priority: 'high' | 'medium' | 'low'
  reason: string
}

export const PLAN = {
  minutesPerQuestion: 1.5,
  practiceQuestions: 10,
  conceptMin: 15,
  errorReviewMin: 10,
  drillQuestions: 10,
  drillMin: 12,
  maxRevisionMin: 20,
  mockMin: 60,
}

const practiceMin = (n: number) => Math.ceil(n * PLAN.minutesPerQuestion)

/** Task options for one recommendation, longest first, so a smaller version can fit a tight budget. */
function tasksFor(r: Recommendation): PlannedTask[][] {
  const base = { topic: r.topic, subject: r.subject, reason: r.reason }
  switch (r.kind) {
    case 'weak-topic':
      return [
        [{ ...base, type: 'practice', durationMin: practiceMin(PLAN.practiceQuestions), questionCount: PLAN.practiceQuestions, priority: 'high' }],
        [{ ...base, type: 'practice', durationMin: practiceMin(5), questionCount: 5, priority: 'high' }],
      ]
    case 'revision': {
      const n = r.count ?? 0
      return [[{ type: 'revision', durationMin: Math.min(PLAN.maxRevisionMin, Math.max(5, Math.ceil(n))), questionCount: n, priority: 'high', reason: r.reason }]]
    }
    case 'error-review':
      return [[{ ...base, type: 'error-review', durationMin: PLAN.errorReviewMin, priority: 'medium' }]]
    case 'new-topic':
      return [
        [
          { ...base, type: 'concept', durationMin: PLAN.conceptMin, priority: 'medium', reason: `${r.reason} Read the concept first.` },
          { ...base, type: 'practice', durationMin: practiceMin(PLAN.practiceQuestions), questionCount: PLAN.practiceQuestions, priority: 'medium' },
        ],
        [{ ...base, type: 'practice', durationMin: practiceMin(5), questionCount: 5, priority: 'medium' }],
      ]
    case 'drill':
      return [[{ ...base, type: 'drill', durationMin: PLAN.drillMin, questionCount: PLAN.drillQuestions, priority: 'low' }]]
    case 'mock':
      return [[{ type: 'mock', durationMin: PLAN.mockMin, priority: 'low', reason: r.reason }]]
  }
}

/**
 * Greedy fill in recommendation order. A task that does not fit is tried in its smaller form, then skipped,
 * so the total never exceeds the daily minutes. Topic recommendations rotate by `offset` so a week varies.
 */
export function planDay(recs: Recommendation[], budgetMin: number, offset = 0): PlannedTask[] {
  const fixed = recs.filter((r) => r.kind === 'revision' || r.kind === 'mock')
  const topical = recs.filter((r) => r.kind !== 'revision' && r.kind !== 'mock')
  const rotated = topical.length ? [...topical.slice(offset % topical.length), ...topical.slice(0, offset % topical.length)] : []
  const ordered = [...fixed.filter((r) => r.kind === 'revision'), ...rotated.sort((a, b) => a.rank - b.rank), ...fixed.filter((r) => r.kind === 'mock')]

  const out: PlannedTask[] = []
  const topicsUsed = new Set<string>()
  let left = budgetMin
  for (const r of ordered) {
    if (r.topic && topicsUsed.has(r.topic)) continue // one block per topic per day
    const option = tasksFor(r).find((opt) => opt.reduce((n, t) => n + t.durationMin, 0) <= left)
    if (!option) continue
    out.push(...option)
    left -= option.reduce((n, t) => n + t.durationMin, 0)
    if (r.topic) topicsUsed.add(r.topic)
  }
  return out
}

/** Dates from `start` for `days` days that are study days. */
export const studyDates = (start: string, days: number, studyDays: number[]) =>
  Array.from({ length: days }, (_, i) => addDays(start, i)).filter((d) => studyDays.includes(weekday(d)))
