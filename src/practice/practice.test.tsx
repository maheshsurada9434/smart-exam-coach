import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { db } from '../db/db'
import { loadDevSample } from '../questions/repo'
import type { Question } from '../questions/schema'
import { eligible, isCorrect, seededRng, selectQuestions, summarize, weakTopics, type AttemptLike } from './engine'
import {
  activeSession,
  getNote,
  getSession,
  remainingSec,
  reportError,
  saveAnswer,
  saveNote,
  sessionQuestions,
  startSession,
  submitSession,
  toggleBookmark,
  type PracticeConfig,
} from './repo'

const mk = (id: string, topic = 'Percentage', extra: Partial<Question> = {}): Question =>
  ({
    id, examCodes: ['SSC_CGL'], subject: 'Quantitative Aptitude', topic, language: 'en', text: `Q ${id}`,
    explanation: 'x', solutionSteps: [], difficulty: 'easy', source: { kind: 'original' }, status: 'published',
    type: 'mcq', options: ['a', 'b', 'c'], correctOption: 1, version: 1, createdAt: '', updatedAt: '', contentKey: id,
    ...extra,
  }) as Question
const att = (questionId: string, correct: boolean, createdAt: string, topic = 'Percentage'): AttemptLike => ({ questionId, topic, correct, createdAt })
const pick = (mode: Parameters<typeof selectQuestions>[0]['mode'], pool: Question[], attempts: AttemptLike[], count = 10, bookmarks = new Set<string>()) =>
  selectQuestions({ mode, pool, attempts, bookmarkIds: bookmarks, count, rng: seededRng(7) }).map((q) => q.id)

describe('practice engine', () => {
  it('checks mcq and numerical answers', () => {
    const num = mk('n', 'Simplification', { type: 'numerical', correctValue: 2.5, tolerance: 0.1 } as Partial<Question>)
    expect(isCorrect(mk('m'), 1)).toBe(true)
    expect(isCorrect(mk('m'), 0)).toBe(false)
    expect(isCorrect(mk('m'), null)).toBe(false)
    expect(isCorrect(num, 2.58)).toBe(true)
    expect(isCorrect(num, 2.7)).toBe(false)
  })

  it('only offers published questions for the chosen exam and filters', () => {
    const pool = [mk('a'), mk('b', 'Average', { status: 'draft' }), mk('c', 'Average', { examCodes: ['SSC_GD'] }), mk('d', 'Average', { difficulty: 'hard' })]
    expect(eligible(pool, { examCode: 'SSC_CGL' }).map((q) => q.id)).toEqual(['a', 'd'])
    expect(eligible(pool, { examCode: 'SSC_CGL', difficulty: 'hard' }).map((q) => q.id)).toEqual(['d'])
    expect(eligible(pool, { examCode: 'SSC_CGL', topic: 'Percentage' }).map((q) => q.id)).toEqual(['a'])
  })

  it('needs enough evidence before calling a topic weak', () => {
    expect(weakTopics([att('a', false, '1')])).toEqual([])
    const five = (correct: number) => Array.from({ length: 5 }, (_, i) => att(`q${i}`, i < correct, String(i)))
    expect(weakTopics(five(2))).toEqual(['Percentage']) // 40%
    expect(weakTopics(five(3))).toEqual([]) // 60% is not below 60%
  })

  it('puts unseen questions first, then the least recently practised', () => {
    const pool = ['a', 'b', 'c', 'd'].map((id) => mk(id))
    const attempts = [att('a', true, '2026-10-03'), att('b', true, '2026-10-01'), att('a', true, '2026-10-02')]
    const ids = pick('mixed', pool, attempts)
    expect(ids.slice(0, 2).sort()).toEqual(['c', 'd'])
    expect(ids.slice(2)).toEqual(['b', 'a'])
    expect(pick('mixed', pool, attempts, 2).sort()).toEqual(['c', 'd'])
    expect(pick('mixed', pool, attempts)).toEqual(ids) // same seed, same order
  })

  it('retry modes use the latest result and bookmarks', () => {
    const pool = ['a', 'b', 'c'].map((id) => mk(id))
    const attempts = [att('a', false, '1'), att('a', true, '2'), att('b', false, '3')]
    expect(pick('incorrect', pool, attempts)).toEqual(['b'])
    expect(pick('bookmarked', pool, attempts, 10, new Set(['c']))).toEqual(['c'])
  })

  it('summarises results; accuracy is over answered questions only', () => {
    const qs = [mk('a'), mk('b'), mk('c', 'Average')]
    const ans = (response: number | null) => ({ response, answeredAt: '', timeMs: 1000 })
    const r = summarize(qs, { a: ans(1), b: ans(0) })
    expect(r).toMatchObject({ total: 3, correct: 1, incorrect: 1, unanswered: 1, accuracy: 0.5, timeMs: 2000 })
    expect(r.byTopic).toEqual([{ topic: 'Percentage', total: 2, correct: 1 }, { topic: 'Average', total: 1, correct: 0 }])
    expect(summarize(qs, {}).accuracy).toBeNull()
  })
})

const cfg = (patch: Partial<PracticeConfig> = {}): PracticeConfig => ({ examCode: 'SSC_CGL', mode: 'mixed', count: 5, timed: false, ...patch })

describe('practice sessions', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('refuses to start without published questions', async () => {
    expect(await startSession(cfg())).toEqual({ ok: false, error: 'No published questions match these settings.' })
  })

  it('learning mode records one attempt per question, even if saved twice', async () => {
    await loadDevSample()
    const r = await startSession(cfg({ mode: 'topic', subject: 'Quantitative Aptitude', topic: 'Percentage' }))
    if (!r.ok) throw new Error(r.error)
    const [q] = await sessionQuestions(r.session)
    expect(await saveAnswer(r.session.id, q!, 1, 4000)).toBe(true)
    expect(await saveAnswer(r.session.id, q!, 0, 4000)).toBe(false) // locked
    const attempts = await db.attempts.toArray()
    expect(attempts).toHaveLength(1)
    expect(attempts[0]).toMatchObject({ questionId: 'DEV-001', correct: true, topic: 'Percentage', timeMs: 4000 })
  })

  it('timed mode records attempts only on submit, and submitting twice is safe', async () => {
    await loadDevSample()
    const r = await startSession(cfg({ count: 3, timed: true, timeLimitMin: 10 }))
    if (!r.ok) throw new Error(r.error)
    const qs = await sessionQuestions(r.session)
    expect(qs.every((q) => q.status === 'published')).toBe(true) // the draft DEV-014 is never used
    await saveAnswer(r.session.id, qs[0]!, 0, 1000)
    await saveAnswer(r.session.id, qs[0]!, 1, 2000) // can change until submit
    await saveAnswer(r.session.id, qs[1]!, 2, 1000)
    expect(await db.attempts.count()).toBe(0)
    await submitSession(r.session.id)
    await submitSession(r.session.id)
    expect(await db.attempts.count()).toBe(2)
    expect((await getSession(r.session.id))!.status).toBe('completed')
    expect(await saveAnswer(r.session.id, qs[2]!, 0, 1000)).toBe(false) // closed session
  })

  it('resumes the active session and keeps only one active', async () => {
    await loadDevSample()
    const a = await startSession(cfg())
    const b = await startSession(cfg())
    if (!a.ok || !b.ok) throw new Error('start failed')
    expect((await activeSession())!.id).toBe(b.session.id)
    expect((await getSession(a.session.id))!.status).toBe('abandoned')
  })

  it('computes the timer from the stored start time', async () => {
    await loadDevSample()
    const start = new Date('2026-10-22T10:00:00Z')
    const r = await startSession(cfg({ timed: true, timeLimitMin: 10 }), start)
    if (!r.ok) throw new Error(r.error)
    expect(remainingSec(r.session, start.getTime() + 90_000)).toBe(510)
    expect(remainingSec(r.session, start.getTime() + 3_600_000)).toBe(0)
  })

  it('ignores malformed stored sessions', async () => {
    await db.sessions.add({ id: 'bad', kind: 'practice', status: 'active', questionIds: 'oops' })
    expect(await getSession('bad')).toBeUndefined()
    expect(await activeSession()).toBeUndefined()
  })

  it('stores bookmarks, notes and error reports', async () => {
    expect(await toggleBookmark('DEV-001')).toBe(true)
    expect(await toggleBookmark('DEV-001')).toBe(false)
    await saveNote('DEV-001', 'remember the formula')
    expect(await getNote('DEV-001')).toBe('remember the formula')
    await saveNote('DEV-001', '  ')
    expect(await getNote('DEV-001')).toBe('')
    await reportError('DEV-001', 'Wrong answer key', ' details ', 1)
    expect(await db.errorReports.toArray()).toMatchObject([{ questionId: 'DEV-001', status: 'open', details: 'details' }])
  })
})

describe('practice screen', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('runs a learning session end to end', async () => {
    await loadDevSample()
    render(
      <MemoryRouter initialEntries={['/practice']}>
        <App />
      </MemoryRouter>,
    )
    const user = userEvent.setup()
    await user.click(await screen.findByRole('radio', { name: 'One topic' }))
    await user.selectOptions(screen.getByLabelText('Topic'), 'Percentage')
    await user.click(screen.getByRole('button', { name: /Start practice/ }))

    expect(await screen.findByText('What is 20% of 150?')).toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: /30/ }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    expect(await screen.findByText('Correct')).toBeInTheDocument()
    expect(screen.getByText(/150 × 20 ÷ 100 = 30/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Finish' }))
    expect(await screen.findByRole('heading', { name: 'Practice results' })).toBeInTheDocument()
    expect(screen.getByText('1 of 1')).toBeInTheDocument()
    expect(await db.attempts.count()).toBe(1)
  })
})
