import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { db } from '../db/db'
import { savePrefs } from '../db/prefs'
import { loadDevSample } from '../questions/repo'
import { addDays, daysBetween, localDate, weekday } from './dates'
import { topicMastery, type MasteryAttempt } from './mastery'
import { bucket, newSm2, review } from './sm2'
import { recommend, type RecInput, type Recommendation } from './recommend'
import { planDay, studyDates } from './planner'
import {
  addManualTask,
  completeTask,
  dueItems,
  generatePlan,
  moveTask,
  plannedVsActual,
  rescheduleUnfinished,
  reviewItem,
  revisionCounts,
  syncQuestionItems,
  tasksOn,
} from './repo'

const series = (topic: string, results: boolean[], start = 0): MasteryAttempt[] =>
  results.map((correct, i) => ({ questionId: `${topic}-${i}`, topic, subject: 'Quantitative Aptitude', correct, createdAt: `2026-10-${String(start + i + 1).padStart(2, '0')}` }))
const T = true
const F = false

describe('dates', () => {
  it('handles month, year and leap-day boundaries', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(daysBetween('2026-10-22', '2026-11-05')).toBe(14)
    expect(weekday('2026-10-22')).toBe(4) // Thursday
    expect(localDate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })
})

describe('mastery', () => {
  const label = (r: boolean[], start = 0) => topicMastery(series('X', r, start))[0]!
  it('needs a minimum sample before labelling', () => {
    expect(label([F]).label).toBe('insufficient')
    expect(label([F, F, F, F]).label).toBe('insufficient')
    expect(label([F, F, F, F]).confidence).toBe('none')
  })
  it('labels by recent accuracy', () => {
    expect(label([T, T, F, F, F]).label).toBe('needs-practice') // 40%
    expect(label([T, T, T, F, F]).label).toBe('developing') // 60%
    expect(label([T, T, T, T, T, T, T, T, F, F]).label).toBe('strong') // 10 attempts, 80%
    expect(label([T, T, T, T, T, T, T, T, T]).label).toBe('developing') // 100% but only 9 attempts
  })
  it('detects improvement against earlier attempts', () => {
    const m = label([F, F, F, F, F, T, T, T, T, T, T, T, F, F, F])
    expect([m.earlierAccuracy, m.recentAccuracy, m.label, m.confidence]).toEqual([0, 0.7, 'improving', 'medium'])
  })
  it('counts repeated mistakes on the same question', () => {
    const a = [...series('Y', [F, F, F, F, T]), { questionId: 'Y-0', topic: 'Y', correct: false, createdAt: '2026-10-20' }]
    expect(topicMastery(a)[0]!.repeatedMistakes).toBe(1)
  })
})

describe('SM-2', () => {
  const d = '2026-10-22'
  it('grows intervals 1 → 6 → round(6 × EF) on successful recall', () => {
    const a = review(newSm2(d), 4, d)
    expect([a.repetitions, a.interval, a.due, a.easiness]).toEqual([1, 1, '2026-10-23', 2.5])
    const b = review(a, 4, a.due)
    expect([b.interval, b.due]).toEqual([6, '2026-10-29'])
    const c = review(b, 4, b.due)
    expect([c.interval, c.due]).toEqual([15, '2026-11-13'])
    expect(review(newSm2(d), 5, d).easiness).toBe(2.6)
  })
  it('brings a failed item back tomorrow and lowers EF, never below 1.3', () => {
    const grown = review(review(review(newSm2(d), 4, d), 4, d), 4, d)
    const f = review(grown, 1, d)
    expect([f.repetitions, f.interval, f.due, f.failures, f.easiness]).toEqual([0, 1, '2026-10-23', 1, 1.96])
    let s = newSm2(d)
    for (let i = 0; i < 10; i++) s = review(s, 0, d)
    expect(s.easiness).toBe(1.3)
  })
  it('buckets by due date', () => {
    expect([bucket('2026-10-21', d), bucket(d, d), bucket('2026-10-23', d)]).toEqual(['overdue', 'today', 'upcoming'])
  })
})

const recInput = (patch: Partial<RecInput> = {}): RecInput => ({
  mastery: [
    ...topicMastery(series('Percentage', [F, F, F, T, F])),
    ...topicMastery(series('Average', [T, T, T, F, F])),
    ...topicMastery(series('Ratio', [F, F, F, F, F])), // weak but no questions available
  ],
  revisionDue: 3,
  revisionOverdue: 1,
  practisable: [
    { topic: 'Percentage', subject: 'Quantitative Aptitude', questions: 4 },
    { topic: 'Average', subject: 'Quantitative Aptitude', questions: 4 },
    { topic: 'Series', subject: 'Reasoning', questions: 2 },
  ],
  daysSinceMock: null,
  canMock: true,
  daysToExam: null,
  ...patch,
})

describe('recommendations', () => {
  it('follows the documented order and explains each item', () => {
    const r = recommend(recInput())
    expect(r.map((x) => [x.kind, x.topic])).toEqual([
      ['weak-topic', 'Percentage'],
      ['revision', undefined],
      ['new-topic', 'Series'],
      ['drill', 'Average'],
      ['mock', undefined],
    ])
    expect(r[0]!.reason).toMatch(/20% correct/)
    expect(r[1]!.reason).toMatch(/1 revision item is overdue/)
  })
  it('never recommends a topic that has no questions, and paces mocks', () => {
    expect(recommend(recInput()).some((x) => x.topic === 'Ratio')).toBe(false)
    expect(recommend(recInput({ daysSinceMock: 4 })).some((x) => x.kind === 'mock')).toBe(false)
    expect(recommend(recInput({ daysSinceMock: 4, daysToExam: 20 })).some((x) => x.kind === 'mock')).toBe(true)
  })
})

describe('planner', () => {
  const recs: Recommendation[] = [
    { kind: 'weak-topic', rank: 1, topic: 'A', reason: 'a' },
    { kind: 'weak-topic', rank: 1, topic: 'B', reason: 'b' },
    { kind: 'new-topic', rank: 4, topic: 'C', reason: 'c' },
    { kind: 'new-topic', rank: 4, topic: 'D', reason: 'd' },
    { kind: 'mock', rank: 6, reason: 'm' },
  ]
  const total = (b: number, o = 0) => planDay(recs, b, o).reduce((n, t) => n + t.durationMin, 0)
  it('never exceeds the daily budget', () => {
    for (const b of [5, 10, 15, 30, 45, 60, 90, 120, 240]) expect(total(b)).toBeLessThanOrEqual(b)
    expect(planDay(recs, 60).map((t) => [t.type, t.topic])).toEqual([
      ['practice', 'A'],
      ['practice', 'B'],
      ['concept', 'C'],
      ['practice', 'C'],
    ])
    expect(planDay(recs, 10).map((t) => t.questionCount)).toEqual([5]) // smaller version fits
    expect(planDay(recs, 4)).toEqual([])
  })
  it('includes a mock only when there is time, and rotates topics across days', () => {
    expect(planDay(recs, 200).some((t) => t.type === 'mock')).toBe(true)
    expect(planDay(recs, 60, 1)[0]!.topic).toBe('B')
  })
  it('lists only study days', () => {
    expect(studyDates('2026-10-22', 7, [1, 3, 5])).toEqual(['2026-10-23', '2026-10-26', '2026-10-28'])
  })
})

describe('learning data', () => {
  const today = '2026-10-22'
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await loadDevSample()
  })
  const attempt = (qid: string, topic: string, correct: boolean, createdAt: string) =>
    db.attempts.add({ id: `${qid}-${createdAt}`, questionId: qid, topic, subject: 'Quantitative Aptitude', correct, createdAt })

  it('adds wrong and bookmarked questions to revision once, and SM-2 moves them', async () => {
    await attempt('DEV-001', 'Percentage', false, '2026-10-21T10:00:00Z')
    await attempt('DEV-002', 'Simple Interest', false, '2026-10-21T10:00:00Z')
    await attempt('DEV-002', 'Simple Interest', true, '2026-10-21T11:00:00Z') // latest is right
    await db.bookmarks.add({ id: 'DEV-007', createdAt: '2026-10-21' })
    expect(await syncQuestionItems(today)).toBe(2)
    expect(await syncQuestionItems(today)).toBe(0)
    expect((await dueItems(today)).map((i) => i.refId).sort()).toEqual(['DEV-001', 'DEV-007'])

    await reviewItem('q:DEV-001', 4, today)
    expect(await revisionCounts(today)).toMatchObject({ today: 1, upcoming: 1, total: 2 })
    expect(await db.reviewLogs.where('itemId').equals('q:DEV-001').count()).toBe(1)
  })

  it('plans within budget, keeps your work when regenerating, and reschedules', async () => {
    expect((await generatePlan([today], today)).ok).toBe(false) // no exam yet
    await savePrefs({ examCode: 'SSC_CGL', dailyMinutes: 45 })
    for (const [i, c] of [F, F, T, F, F].entries()) await attempt(`DEV-00${i + 1}`, 'Percentage', c, `2026-10-2${i}T10:00:00Z`)

    await generatePlan([today], today)
    let tasks = await tasksOn(today)
    expect(plannedVsActual(tasks).plannedMin).toBeLessThanOrEqual(45)
    expect(tasks[0]).toMatchObject({ type: 'revision' })
    expect(tasks.find((t) => t.topic === 'Percentage')!.reason).toMatch(/Practise Percentage/)

    await completeTask(tasks[0]!.id, 7)
    await addManualTask(today, { type: 'concept', topic: 'Mine', durationMin: 10 })
    await generatePlan([today], today)
    tasks = await tasksOn(today)
    expect(tasks.filter((t) => t.status === 'done')).toHaveLength(1)
    expect(tasks.some((t) => t.topic === 'Mine')).toBe(true)
    expect(plannedVsActual(tasks)).toMatchObject({ actualMin: 7, done: 1 })
    expect(plannedVsActual(tasks).plannedMin).toBeLessThanOrEqual(45)

    const last = tasks[tasks.length - 1]!
    await moveTask(last.id, -1)
    expect((await tasksOn(today)).at(-2)!.id).toBe(last.id)

    await addManualTask('2026-10-20', { type: 'practice', durationMin: 15 })
    expect(await rescheduleUnfinished(today)).toBe(1)
    expect(await tasksOn('2026-10-20')).toEqual([])
  })

  it('skips non-study days', async () => {
    await savePrefs({ examCode: 'SSC_CGL', studyDays: [1] }) // Mondays only
    await generatePlan([today], today) // Thursday
    expect(await tasksOn(today)).toEqual([])
  })
})

describe('screens', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
    await loadDevSample()
  })

  it('reviews a due question in the Revision screen', async () => {
    await db.attempts.add({ id: 'x', questionId: 'DEV-001', topic: 'Percentage', correct: false, createdAt: '2026-10-21T10:00:00Z' })
    render(
      <MemoryRouter initialEntries={['/revision']}>
        <App />
      </MemoryRouter>,
    )
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Start review (1)' }))
    await user.click(screen.getByRole('radio', { name: /30/ }))
    await user.click(screen.getByRole('button', { name: 'Check answer' }))
    await user.click(screen.getByRole('button', { name: /^Good/ }))
    expect(await screen.findByRole('heading', { name: 'Review finished' })).toBeInTheDocument()
    expect(screen.getByText('Reviewed 1')).toBeInTheDocument()
  })

  it('makes today’s plan automatically with reasons', async () => {
    await savePrefs({ examCode: 'SSC_CGL', dailyMinutes: 60 })
    render(
      <MemoryRouter initialEntries={['/planner']}>
        <App />
      </MemoryRouter>,
    )
    expect((await screen.findAllByText(/you have not practised it yet/)).length).toBeGreaterThan(0)
  })
})
