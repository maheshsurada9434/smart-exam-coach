import { db } from '../db/db'
import { loadQuestions } from '../questions/repo'
import type { Question } from '../questions/schema'
import {
  eligible,
  isCorrect,
  seededRng,
  selectQuestions,
  type Answer,
  type AttemptLike,
  type Response,
  type SelectionMode,
} from './engine'

export type PracticeConfig = {
  examCode: string
  mode: SelectionMode
  subject?: string
  topic?: string
  difficulty?: string
  count: number
  timed: boolean
  timeLimitMin?: number
}

export type PracticeSession = {
  id: string
  kind: 'practice'
  examCode: string
  status: 'active' | 'completed' | 'abandoned'
  startedAt: string
  submittedAt?: string
  config: PracticeConfig
  questionIds: string[]
  answers: Record<string, Answer>
  currentIndex: number
}

const attemptId = (sessionId: string, questionId: string) => `${sessionId}:${questionId}`

export async function loadAttempts(): Promise<AttemptLike[]> {
  return (await db.attempts.toArray()).filter(
    (a): a is typeof a & AttemptLike =>
      typeof a.questionId === 'string' && typeof a.topic === 'string' && typeof a.correct === 'boolean' && typeof a.createdAt === 'string',
  )
}

export async function bookmarkIds() {
  return new Set(await db.bookmarks.toCollection().primaryKeys())
}

export async function startSession(config: PracticeConfig, now = new Date(), seed = now.getTime()) {
  const { questions } = await loadQuestions()
  const pool = eligible(questions, config)
  const picked = selectQuestions({
    mode: config.mode,
    pool,
    attempts: await loadAttempts(),
    bookmarkIds: await bookmarkIds(),
    count: config.count,
    rng: seededRng(seed),
  })
  if (picked.length === 0) return { ok: false as const, error: 'No published questions match these settings.' }
  const session: PracticeSession = {
    id: crypto.randomUUID(),
    kind: 'practice',
    examCode: config.examCode,
    status: 'active',
    startedAt: now.toISOString(),
    config,
    questionIds: picked.map((q) => q.id),
    answers: {},
    currentIndex: 0,
  }
  await db.transaction('rw', db.sessions, async () => {
    // Only one active practice session at a time; an older one is kept as abandoned, not deleted.
    const active = await db.sessions.where('status').equals('active').filter((s) => s.kind === 'practice').toArray()
    for (const s of active) await db.sessions.update(s.id, { status: 'abandoned' })
    await db.sessions.add(session)
  })
  return { ok: true as const, session, short: picked.length < config.count }
}

// Rows can arrive from a restored backup, so check the shape before trusting it.
function asSession(r: unknown): PracticeSession | undefined {
  const s = r as PracticeSession | undefined
  const ok =
    s?.kind === 'practice' &&
    Array.isArray(s.questionIds) &&
    typeof s.answers === 'object' && s.answers !== null &&
    typeof s.config?.timed === 'boolean' &&
    !Number.isNaN(Date.parse(s.startedAt))
  return ok ? s : undefined
}

export const getSession = async (id: string) => asSession(await db.sessions.get(id))

export const activeSession = async () =>
  asSession(await db.sessions.where('status').equals('active').filter((s) => asSession(s) !== undefined).first())

export async function sessionQuestions(s: PracticeSession): Promise<Question[]> {
  const { questions } = await loadQuestions()
  const byId = new Map(questions.map((q) => [q.id, q]))
  return s.questionIds.map((id) => byId.get(id)).filter((q): q is Question => !!q)
}

function attemptRow(s: PracticeSession, q: Question, a: Answer) {
  return {
    id: attemptId(s.id, q.id),
    questionId: q.id,
    sessionId: s.id,
    mode: 'practice',
    examCode: s.examCode,
    subject: q.subject,
    topic: q.topic,
    difficulty: q.difficulty,
    response: a.response,
    correct: isCorrect(q, a.response),
    timeMs: a.timeMs,
    createdAt: a.answeredAt,
  }
}

/**
 * Learning mode: the answer is final and recorded as an attempt at once.
 * Timed mode: answers can change until submit; attempts are recorded on submit.
 */
export async function saveAnswer(sessionId: string, q: Question, response: Response, timeMs: number, now = new Date()) {
  return db.transaction('rw', db.sessions, db.attempts, async () => {
    const s = await getSession(sessionId)
    if (!s || s.status !== 'active') return false
    if (!s.config.timed && s.answers[q.id]) return false // learning answers are locked
    const a: Answer = { response, answeredAt: now.toISOString(), timeMs: Math.max(0, Math.round(timeMs)) }
    await db.sessions.update(sessionId, { answers: { ...s.answers, [q.id]: a } })
    if (!s.config.timed && response !== null && !(await db.attempts.get(attemptId(s.id, q.id))))
      await db.attempts.add(attemptRow(s, q, a))
    return true
  })
}

export const setIndex = (sessionId: string, currentIndex: number) => db.sessions.update(sessionId, { currentIndex })

/** Idempotent: submitting twice records attempts once. */
export async function submitSession(sessionId: string, now = new Date()) {
  const s = await getSession(sessionId)
  if (!s || s.status !== 'active') return s
  const questions = await sessionQuestions(s)
  await db.transaction('rw', db.sessions, db.attempts, async () => {
    const fresh = await getSession(sessionId)
    if (!fresh || fresh.status !== 'active') return
    for (const q of questions) {
      const a = fresh.answers[q.id]
      if (!a || a.response === null || (await db.attempts.get(attemptId(fresh.id, q.id)))) continue
      await db.attempts.add(attemptRow(fresh, q, a))
    }
    await db.sessions.update(sessionId, { status: 'completed', submittedAt: now.toISOString() })
  })
  return getSession(sessionId)
}

export const abandonSession = (id: string) => db.sessions.update(id, { status: 'abandoned' })

/** Remaining seconds from the stored start time, so a refresh cannot reset the clock. */
export function remainingSec(s: PracticeSession, now = Date.now()) {
  if (!s.config.timed || !s.config.timeLimitMin) return null
  return Math.max(0, Math.round(s.config.timeLimitMin * 60 - (now - Date.parse(s.startedAt)) / 1000))
}

/* ---------- bookmarks, notes, error reports ---------- */

export async function toggleBookmark(questionId: string, now = new Date()) {
  if (await db.bookmarks.get(questionId)) {
    await db.bookmarks.delete(questionId)
    return false
  }
  await db.bookmarks.add({ id: questionId, createdAt: now.toISOString() })
  return true
}

const noteId = (questionId: string) => `note:${questionId}`
export const getNote = async (questionId: string) => String((await db.notes.get(noteId(questionId)))?.text ?? '')
export async function saveNote(questionId: string, text: string, now = new Date()) {
  if (!text.trim()) return db.notes.delete(noteId(questionId))
  await db.notes.put({ id: noteId(questionId), questionId, text, updatedAt: now.toISOString() })
}

export const REPORT_REASONS = ['Wrong answer key', 'Mistake in question or options', 'Explanation is wrong or unclear', 'Other'] as const

export async function reportError(questionId: string, reason: string, details: string, version: number, now = new Date()) {
  await db.errorReports.add({
    id: crypto.randomUUID(),
    questionId,
    questionVersion: version,
    reason,
    details: details.trim(),
    status: 'open',
    createdAt: now.toISOString(),
  })
}
