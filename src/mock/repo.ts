import { db } from '../db/db'
import { EXAMS } from '../data/exams'
import { loadQuestions } from '../questions/repo'
import type { Question } from '../questions/schema'
import { loadAttempts } from '../practice/repo'
import { seededRng, type Answer, type Response } from '../practice/engine'
import { buildMock, deadline, outcome, scoreMock, type MockPlan, type MockScore } from './engine'

export type MockSession = MockPlan & {
  id: string
  kind: 'mock'
  status: 'active' | 'completed'
  startedAt: string
  submittedAt?: string
  submitReason?: 'manual' | 'timeout'
  answers: Record<string, Answer>
  marked: Record<string, boolean>
  visited: Record<string, boolean>
  currentIndex: number
  // Frozen at submission so later edits to the question bank never change a past score.
  result?: MockScore & { outcomes: Record<string, 'correct' | 'incorrect' | 'unanswered'> }
}

// Rows can come from a restored backup, so check the shape before trusting it.
function asMock(r: unknown): MockSession | undefined {
  const s = r as MockSession | undefined
  const ok =
    s?.kind === 'mock' &&
    Array.isArray(s.sections) &&
    s.sections.every((x) => Array.isArray(x?.questionIds)) &&
    typeof s.answers === 'object' && s.answers !== null &&
    typeof s.durationSec === 'number' &&
    !Number.isNaN(Date.parse(s.startedAt))
  return ok ? { marked: {}, visited: {}, ...s } : undefined
}

export const getMock = async (id: string) => asMock(await db.sessions.get(id))
export const activeMock = async () =>
  asMock(await db.sessions.where('status').equals('active').filter((s) => asMock(s) !== undefined).first())

export async function mockHistory() {
  const rows = await db.sessions.where('status').equals('completed').toArray()
  return rows
    .map(asMock)
    .filter((s): s is MockSession => !!s?.result)
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
}

export async function planMock(examCode: string, paperName: string, sectionName: string | null, seed = Date.now()) {
  const exam = EXAMS.find((e) => e.code === examCode)
  const paper = exam?.papers.find((p) => p.name === paperName)
  if (!exam || !paper) return null
  return buildMock(exam, paper, sectionName, (await loadQuestions()).questions, await loadAttempts(), seededRng(seed))
}

export async function startMock(plan: MockPlan, now = new Date()) {
  if (plan.available === 0) return { ok: false as const, error: 'No approved or published questions for this test.' }
  const s: MockSession = {
    ...plan,
    id: crypto.randomUUID(),
    kind: 'mock',
    status: 'active',
    startedAt: now.toISOString(),
    answers: {},
    marked: {},
    visited: {},
    currentIndex: 0,
  }
  if (await activeMock()) return { ok: false as const, error: 'Finish or submit your current mock test first.' }
  await db.sessions.add(s)
  return { ok: true as const, session: s }
}

export const allIds = (s: MockSession) => s.sections.flatMap((x) => x.questionIds)

export async function mockQuestions(s: MockSession): Promise<Question[]> {
  const byId = new Map((await loadQuestions()).questions.map((q) => [q.id, q]))
  return allIds(s).map((id) => byId.get(id)).filter((q): q is Question => !!q)
}

/** Rejects changes after the deadline: the stored start time, not the on-screen clock, decides. */
export async function saveMockAnswer(id: string, questionId: string, response: Response, timeMs: number, now = new Date()) {
  return db.transaction('rw', db.sessions, async () => {
    const s = await getMock(id)
    if (!s || s.status !== 'active' || now.getTime() >= deadline(s.startedAt, s.durationSec)) return false
    const prev = s.answers[questionId]
    const a: Answer = { response, answeredAt: now.toISOString(), timeMs: (prev?.timeMs ?? 0) + Math.max(0, Math.round(timeMs)) }
    await db.sessions.update(id, { answers: { ...s.answers, [questionId]: a } })
    return true
  })
}

export async function updateMockNav(id: string, patch: { currentIndex?: number; visitedId?: string; marked?: [string, boolean] }) {
  return db.transaction('rw', db.sessions, async () => {
    const s = await getMock(id)
    if (!s || s.status !== 'active') return
    const changes: Record<string, unknown> = {}
    if (patch.currentIndex !== undefined) changes.currentIndex = patch.currentIndex
    if (patch.visitedId) changes.visited = { ...s.visited, [patch.visitedId]: true }
    if (patch.marked) changes.marked = { ...s.marked, [patch.marked[0]]: patch.marked[1] }
    await db.sessions.update(id, changes)
  })
}

/** Idempotent: a second submit (double tap, timer + button) changes nothing. */
export async function submitMock(id: string, reason: 'manual' | 'timeout', now = new Date()) {
  const first = await getMock(id)
  if (!first || first.status !== 'active') return first
  const qs = await mockQuestions(first)
  const sectionOf = new Map(first.sections.flatMap((x) => x.questionIds.map((qid) => [qid, x.name] as const)))
  await db.transaction('rw', db.sessions, db.attempts, async () => {
    const s = await getMock(id)
    if (!s || s.status !== 'active') return
    const outcomes: Record<string, 'correct' | 'incorrect' | 'unanswered'> = {}
    for (const q of qs) outcomes[q.id] = outcome(q, s.answers[q.id])
    const score = scoreMock(s.sections, qs.map((q) => ({ section: sectionOf.get(q.id)!, outcome: outcomes[q.id]! })))
    for (const q of qs) {
      const a = s.answers[q.id]
      if (!a || a.response === null) continue
      const attemptId = `${s.id}:${q.id}`
      if (await db.attempts.get(attemptId)) continue
      await db.attempts.add({
        id: attemptId,
        questionId: q.id,
        sessionId: s.id,
        mode: 'mock',
        examCode: s.examCode,
        subject: q.subject,
        topic: q.topic,
        difficulty: q.difficulty,
        response: a.response,
        correct: outcomes[q.id] === 'correct',
        timeMs: a.timeMs,
        createdAt: a.answeredAt,
      })
    }
    await db.sessions.update(id, { status: 'completed', submittedAt: now.toISOString(), submitReason: reason, result: { ...score, outcomes } })
  })
  return getMock(id)
}
