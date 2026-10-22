// Pure mock-test logic: scoring, building a test from the exam pattern, timing. No UI, no DB.
import type { Exam, Paper } from '../data/exams'
import { isScorable, type Question } from '../questions/schema'
import { isCorrect, selectQuestions, type Answer, type AttemptLike } from '../practice/engine'

/* ---------- scoring ---------- */

export type SectionRule = { name: string; marksPerCorrect: number; negativePerWrong: number }
export type Outcome = 'correct' | 'incorrect' | 'unanswered'
export type ItemResult = { section: string; outcome: Outcome }

/** Rounds to 2 decimals so fractional negatives like 0.33 do not leave float noise. */
export const round2 = (x: number) => Math.round(x * 100) / 100 + 0 // + 0 turns -0 into 0

/**
 * Score = correct × marks per correct − incorrect × negative marks per incorrect,
 * calculated per section with that section's own rule. Unanswered scores 0.
 */
export function scoreMock(rules: SectionRule[], items: ItemResult[]) {
  const sections = rules.map((r) => ({ ...r, total: 0, correct: 0, incorrect: 0, unanswered: 0, marks: 0, maxMarks: 0 }))
  const byName = new Map(sections.map((s) => [s.name, s]))
  for (const it of items) {
    const s = byName.get(it.section)
    if (!s) throw new Error(`Unknown section "${it.section}"`)
    s.total++
    s[it.outcome]++
  }
  for (const s of sections) {
    s.marks = round2(s.correct * s.marksPerCorrect - s.incorrect * s.negativePerWrong)
    s.maxMarks = round2(s.total * s.marksPerCorrect)
  }
  const sum = (k: 'correct' | 'incorrect' | 'unanswered' | 'marks' | 'maxMarks' | 'total') => round2(sections.reduce((n, s) => n + s[k], 0))
  return {
    sections,
    marks: sum('marks'),
    maxMarks: sum('maxMarks'),
    total: sum('total'),
    correct: sum('correct'),
    incorrect: sum('incorrect'),
    unanswered: sum('unanswered'),
  }
}
export type MockScore = ReturnType<typeof scoreMock>

export const outcome = (q: Question, a: Answer | undefined): Outcome =>
  !a || a.response === null ? 'unanswered' : isCorrect(q, a.response) ? 'correct' : 'incorrect'

/* ---------- building a test from the exam pattern ---------- */

export type MockSection = SectionRule & { subject: string; required: number; questionIds: string[] }
export type MockPlan = {
  examCode: string
  paperName: string
  sectionName: string | null // null = full paper
  sections: MockSection[]
  durationSec: number
  partial: boolean // fewer questions than the real pattern
  required: number
  available: number
}

/**
 * Only approved/published questions for this exam are used. If a section does not have enough,
 * the test is built with what exists and flagged as partial; time is scaled to the question count.
 */
export function buildMock(
  exam: Exam,
  paper: Paper,
  sectionName: string | null,
  questions: Question[],
  attempts: AttemptLike[],
  rng: () => number,
): MockPlan {
  const chosen = paper.sections.filter((s) => sectionName === null || s.name === sectionName)
  const used = new Set<string>()
  const sections: MockSection[] = chosen.map((s) => {
    const pool = questions.filter(
      (q) => isScorable(q.status) && q.examCodes.includes(exam.code) && q.subject === s.subject && !used.has(q.id),
    )
    const picked = selectQuestions({ mode: 'mixed', pool, attempts, bookmarkIds: new Set(), count: s.questions, rng })
    picked.forEach((q) => used.add(q.id))
    return {
      name: s.name,
      subject: s.subject,
      marksPerCorrect: s.marksPerCorrect,
      negativePerWrong: s.negativePerWrong,
      required: s.questions,
      questionIds: picked.map((q) => q.id),
    }
  })
  const paperQs = paper.sections.reduce((n, s) => n + s.questions, 0)
  const required = sections.reduce((n, s) => n + s.required, 0)
  const available = sections.reduce((n, s) => n + s.questionIds.length, 0)
  return {
    examCode: exam.code,
    paperName: paper.name,
    sectionName,
    sections,
    durationSec: Math.round((paper.durationMin * 60 * available) / paperQs),
    partial: available < required,
    required,
    available,
  }
}

/* ---------- timing ---------- */

export const deadline = (startedAt: string, durationSec: number) => Date.parse(startedAt) + durationSec * 1000
export const secondsLeft = (startedAt: string, durationSec: number, now = Date.now()) =>
  Math.max(0, Math.ceil((deadline(startedAt, durationSec) - now) / 1000))

/* ---------- palette ---------- */

export type QState = 'not-visited' | 'not-answered' | 'answered' | 'marked' | 'answered-marked'
export function questionState(answered: boolean, visited: boolean, marked: boolean): QState {
  if (answered) return marked ? 'answered-marked' : 'answered'
  if (marked) return 'marked'
  return visited ? 'not-answered' : 'not-visited'
}
export const STATE_LABELS: Record<QState, string> = {
  'not-visited': 'Not visited',
  'not-answered': 'Not answered',
  answered: 'Answered',
  marked: 'Marked for review',
  'answered-marked': 'Answered and marked for review (will be evaluated)',
}
