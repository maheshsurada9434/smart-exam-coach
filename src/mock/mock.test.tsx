import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { db } from '../db/db'
import { examByCode } from '../data/exams'
import { loadDevSample, saveQuestionEdit } from '../questions/repo'
import type { Question } from '../questions/schema'
import { seededRng } from '../practice/engine'
import { buildMock, questionState, round2, scoreMock, secondsLeft, type ItemResult, type Outcome } from './engine'
import { activeMock, getMock, mockQuestions, planMock, saveMockAnswer, startMock, submitMock, updateMockNav } from './repo'

const CGL = { name: 'Quant', marksPerCorrect: 2, negativePerWrong: 0.5 }
const items = (section: string, outcomes: [Outcome, number][]): ItemResult[] =>
  outcomes.flatMap(([o, n]) => Array.from({ length: n }, () => ({ section, outcome: o })))

describe('scoring engine', () => {
  it('all correct', () => expect(scoreMock([CGL], items('Quant', [['correct', 25]]))).toMatchObject({ marks: 50, maxMarks: 50, correct: 25 }))
  it('all incorrect', () => expect(scoreMock([CGL], items('Quant', [['incorrect', 25]])).marks).toBe(-12.5))
  it('all unanswered', () => expect(scoreMock([CGL], items('Quant', [['unanswered', 25]]))).toMatchObject({ marks: 0, unanswered: 25 }))
  it('mixed answers', () =>
    expect(scoreMock([CGL], items('Quant', [['correct', 10], ['incorrect', 5], ['unanswered', 10]]))).toMatchObject({
      marks: 17.5, correct: 10, incorrect: 5, unanswered: 10, total: 25,
    }))
  it('fractional negative marks without float noise', () => {
    expect(scoreMock([{ name: 'A', marksPerCorrect: 2, negativePerWrong: 0.25 }], items('A', [['correct', 1], ['incorrect', 3]])).marks).toBe(1.25)
    expect(scoreMock([{ name: 'A', marksPerCorrect: 1, negativePerWrong: 0.33 }], items('A', [['incorrect', 3]])).marks).toBe(-0.99)
    expect(round2(-0)).toBe(0)
    expect(Object.is(scoreMock([CGL], items('Quant', [['unanswered', 1]])).marks, -0)).toBe(false)
  })
  it('applies each section its own marking (e.g. MTS sessions)', () => {
    const r = scoreMock(
      [{ name: 'S1', marksPerCorrect: 3, negativePerWrong: 0 }, { name: 'S2', marksPerCorrect: 3, negativePerWrong: 1 }],
      [...items('S1', [['correct', 2], ['incorrect', 2]]), ...items('S2', [['correct', 2], ['incorrect', 2]])],
    )
    expect(r.sections.map((s) => s.marks)).toEqual([6, 4])
    expect(r).toMatchObject({ marks: 10, maxMarks: 24 })
  })
  it('rejects items for an unknown section', () => expect(() => scoreMock([CGL], items('Nope', [['correct', 1]]))).toThrow(/Unknown section/))
})

const fake = (id: string, subject: Question['subject'], extra: Partial<Question> = {}) =>
  ({
    id, examCodes: ['SSC_CGL'], subject, topic: 't', language: 'en', text: id, explanation: 'e', solutionSteps: [],
    difficulty: 'easy', source: { kind: 'original' }, status: 'approved', type: 'mcq', options: ['a', 'b'], correctOption: 0,
    version: 1, createdAt: '', updatedAt: '', contentKey: id, ...extra,
  }) as Question

describe('building a mock from the exam pattern', () => {
  const cgl = examByCode('SSC_CGL')!
  const paper = cgl.papers[0]!
  const subjects = paper.sections.map((s) => s.subject)
  const full = subjects.flatMap((sub) => Array.from({ length: 25 }, (_, i) => fake(`${sub}-${i}`, sub)))

  it('builds a full-length test with the real time when enough questions exist', () => {
    const p = buildMock(cgl, paper, null, full, [], seededRng(1))
    expect(p).toMatchObject({ partial: false, available: 100, required: 100, durationSec: 3600 })
    expect(p.sections.map((s) => s.questionIds.length)).toEqual([25, 25, 25, 25])
  })

  it('uses only approved/published questions of this exam and subject', () => {
    const pool = [
      fake('ok', 'Reasoning'),
      fake('pub', 'Reasoning', { status: 'published' }),
      fake('draft', 'Reasoning', { status: 'draft' }),
      fake('reviewed', 'Reasoning', { status: 'reviewed' }),
      fake('gd', 'Reasoning', { examCodes: ['SSC_GD'] }),
    ]
    const p = buildMock(cgl, paper, paper.sections[0]!.name, pool, [], seededRng(1))
    expect(p.sections[0]!.questionIds.sort()).toEqual(['ok', 'pub'])
    expect(p.partial).toBe(true)
  })

  it('scales time for sectional and partial tests', () => {
    expect(buildMock(cgl, paper, paper.sections[0]!.name, full, [], seededRng(1)).durationSec).toBe(900)
    expect(buildMock(cgl, paper, null, full.slice(0, 50), [], seededRng(1))).toMatchObject({ partial: true, available: 50, durationSec: 1800 })
  })

  it('palette states', () => {
    expect(questionState(false, false, false)).toBe('not-visited')
    expect(questionState(false, true, false)).toBe('not-answered')
    expect(questionState(true, true, true)).toBe('answered-marked')
    expect(questionState(false, true, true)).toBe('marked')
  })
})

describe('mock sessions', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await loadDevSample()
  })
  const begin = async (start = new Date('2026-10-22T10:00:00Z')) => {
    const plan = (await planMock('SSC_GD', 'Computer Based Examination', null, 3))!
    const r = await startMock(plan, start)
    if (!r.ok) throw new Error(r.error)
    return { s: r.session, qs: await mockQuestions(r.session), start }
  }

  it('builds a partial GD test from the 13 published sample questions', async () => {
    const { s } = await begin()
    expect(s).toMatchObject({ partial: true, available: 13, required: 80, durationSec: Math.round((3600 * 13) / 80) })
  })

  it('keeps answers and position after a refresh, and resumes an interrupted test', async () => {
    const { s, qs, start } = await begin()
    await saveMockAnswer(s.id, qs[0]!.id, 1, 5000, new Date(start.getTime() + 10_000))
    await updateMockNav(s.id, { currentIndex: 4, visitedId: qs[4]!.id, marked: [qs[4]!.id, true] })
    const again = (await getMock(s.id))!
    expect(again.answers[qs[0]!.id]!.response).toBe(1)
    expect([again.currentIndex, again.visited[qs[4]!.id], again.marked[qs[4]!.id]]).toEqual([4, true, true])
    expect((await activeMock())!.id).toBe(s.id)
    expect((await startMock((await planMock('SSC_GD', 'Computer Based Examination', null))!)).ok).toBe(false)
  })

  it('rejects answers after the deadline and the clock comes from the stored start', async () => {
    const { s, qs, start } = await begin()
    const end = start.getTime() + s.durationSec * 1000
    expect(secondsLeft(s.startedAt, s.durationSec, start.getTime() + 60_000)).toBe(s.durationSec - 60)
    expect(await saveMockAnswer(s.id, qs[0]!.id, 0, 1, new Date(end - 1000))).toBe(true)
    expect(await saveMockAnswer(s.id, qs[1]!.id, 0, 1, new Date(end))).toBe(false)
    const done = (await submitMock(s.id, 'timeout', new Date(end)))!
    expect(done.submitReason).toBe('timeout')
    expect(done.result!.unanswered).toBe(12)
  })

  it('scores with GD marking, records attempts once, and ignores a second submit', async () => {
    const { s, qs, start } = await begin()
    const at = new Date(start.getTime() + 1000)
    const right = qs.find((q) => q.type === 'mcq')!
    const wrong = qs.find((q) => q.type === 'mcq' && q.id !== right.id)!
    await saveMockAnswer(s.id, right.id, right.type === 'mcq' ? right.correctOption : 0, 1, at)
    await saveMockAnswer(s.id, wrong.id, wrong.type === 'mcq' ? (wrong.correctOption + 1) % wrong.options.length : 0, 1, at)
    const r1 = (await submitMock(s.id, 'manual'))!
    expect(r1.result).toMatchObject({ correct: 1, incorrect: 1, unanswered: 11, marks: 1.75, maxMarks: 26 })
    const r2 = (await submitMock(s.id, 'manual'))!
    expect(r2.submittedAt).toBe(r1.submittedAt)
    expect(await db.attempts.where('sessionId').equals(s.id).count()).toBe(2)
  })

  it('freezes the score when the question bank changes later', async () => {
    const { s, qs, start } = await begin()
    const q = qs.find((x) => x.type === 'mcq')!
    if (q.type !== 'mcq') throw new Error()
    await saveMockAnswer(s.id, q.id, q.correctOption, 1, new Date(start.getTime() + 1000))
    const before = (await submitMock(s.id, 'manual'))!.result!.marks
    await saveQuestionEdit({ ...q, correctOption: (q.correctOption + 1) % q.options.length })
    expect((await getMock(s.id))!.result!.marks).toBe(before)
  })
})

describe('mock test screen', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await loadDevSample()
  })

  it('hides answers during the test and shows the result after submit', async () => {
    render(
      <MemoryRouter initialEntries={['/mock-tests']}>
        <App />
      </MemoryRouter>,
    )
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /Start partial test/ }))
    expect(await screen.findByRole('timer')).toBeInTheDocument()
    expect(screen.queryByText('Correct answer')).toBeNull()
    await user.click(screen.getAllByRole('button', { name: 'Submit test' })[0]!)
    await user.click(screen.getByRole('button', { name: 'Submit' }))
    expect(await screen.findByRole('heading', { name: 'Mock test result' })).toBeInTheDocument()
    expect(screen.getAllByText('Correct answer').length).toBeGreaterThan(0)
  })
})
