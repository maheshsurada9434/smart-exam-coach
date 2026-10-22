// Pure practice logic: no database, no UI. Everything here is deterministic for a given rng.
import type { Question } from '../questions/schema'
import { weakTopicNames } from '../learning/mastery'

export const MISSING_EXPLANATION = 'Explanation not available yet. This question requires review.'

export const SELECTION_MODES = ['mixed', 'subject', 'topic', 'weak', 'incorrect', 'bookmarked'] as const
export type SelectionMode = (typeof SELECTION_MODES)[number]
export const MODE_LABELS: Record<SelectionMode, string> = {
  mixed: 'Mixed (all subjects)',
  subject: 'One subject',
  topic: 'One topic',
  weak: 'My weak topics',
  incorrect: 'Questions I got wrong',
  bookmarked: 'My bookmarked questions',
}


export type Response = number | null // mcq: option index; numerical: the value; null = unanswered
export type AttemptLike = { questionId: string; topic: string; correct: boolean; createdAt: string }

export function isCorrect(q: Question, response: Response): boolean {
  if (response === null || !Number.isFinite(response)) return false
  if (q.type === 'mcq') return response === q.correctOption
  return Math.abs(response - q.correctValue) <= q.tolerance
}

/** Questions a student may practise: published, for this exam, matching the filters. */
export function eligible(
  questions: Question[],
  f: { examCode: string; subject?: string; topic?: string; difficulty?: string },
) {
  return questions.filter(
    (q) =>
      q.status === 'published' &&
      q.examCodes.includes(f.examCode) &&
      (!f.subject || q.subject === f.subject) &&
      (!f.topic || q.topic === f.topic) &&
      (!f.difficulty || q.difficulty === f.difficulty),
  )
}

export function topicStats(attempts: AttemptLike[]) {
  const m = new Map<string, { attempts: number; correct: number }>()
  for (const a of attempts) {
    const s = m.get(a.topic) ?? { attempts: 0, correct: 0 }
    s.attempts++
    if (a.correct) s.correct++
    m.set(a.topic, s)
  }
  return m
}

/** Weak = mastery label "Needs more practice" (enough attempts AND low recent accuracy). */
export const weakTopics = (attempts: AttemptLike[]) => weakTopicNames(attempts)

/** Latest attempt per question, by createdAt. */
export function latestAttempts(attempts: AttemptLike[]) {
  const m = new Map<string, AttemptLike>()
  for (const a of attempts) {
    const cur = m.get(a.questionId)
    if (!cur || a.createdAt > cur.createdAt) m.set(a.questionId, a)
  }
  return m
}

/** Small seeded PRNG (mulberry32) so selection is testable. */
export function seededRng(seed: number) {
  let t = seed >>> 0
  return () => {
    t = (t + 0x6d2b79f5) >>> 0
    let r = Math.imul(t ^ (t >>> 15), 1 | t)
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296
  }
}

export type SelectInput = {
  mode: SelectionMode
  pool: Question[] // already filtered by eligible()
  attempts: AttemptLike[]
  bookmarkIds: Set<string>
  count: number
  rng: () => number
}

/**
 * Picks questions. Unseen questions come first, then the least recently practised,
 * so the same questions are not repeated until the pool runs out.
 * 'incorrect' and 'bookmarked' are retry modes and deliberately repeat questions.
 */
export function selectQuestions({ mode, pool, attempts, bookmarkIds, count, rng }: SelectInput): Question[] {
  const latest = latestAttempts(attempts)
  let candidates = pool
  if (mode === 'incorrect') candidates = pool.filter((q) => latest.get(q.id)?.correct === false)
  if (mode === 'bookmarked') candidates = pool.filter((q) => bookmarkIds.has(q.id))
  if (mode === 'weak') {
    const weak = new Set(weakTopics(attempts))
    candidates = pool.filter((q) => weak.has(q.topic))
  }
  return candidates
    .map((q) => ({ q, last: latest.get(q.id)?.createdAt ?? '', tie: rng() }))
    .sort((a, b) => (a.last < b.last ? -1 : a.last > b.last ? 1 : a.tie - b.tie))
    .slice(0, Math.max(0, count))
    .map((x) => x.q)
}

export type Answer = { response: Response; answeredAt: string; timeMs: number }

export function summarize(questions: Question[], answers: Record<string, Answer | undefined>) {
  let correct = 0
  let incorrect = 0
  let timeMs = 0
  const byTopic = new Map<string, { total: number; correct: number }>()
  for (const q of questions) {
    const a = answers[q.id]
    const t = byTopic.get(q.topic) ?? { total: 0, correct: 0 }
    t.total++
    if (a && a.response !== null) {
      timeMs += a.timeMs
      if (isCorrect(q, a.response)) {
        correct++
        t.correct++
      } else incorrect++
    }
    byTopic.set(q.topic, t)
  }
  const answered = correct + incorrect
  return {
    total: questions.length,
    correct,
    incorrect,
    unanswered: questions.length - answered,
    accuracy: answered ? correct / answered : null, // of answered questions, not a score
    timeMs,
    byTopic: [...byTopic].map(([topic, s]) => ({ topic, ...s })),
  }
}
