import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'
import { db } from '../db/db'
import { savePrefs } from '../db/prefs'
import { loadDevSample } from '../questions/repo'
import { coverage, daily, filterAttempts, groupBy, rangeStart, repeatedErrors, summary, trend, weekStart, weekly, type Att } from './stats'

// Noon UTC keeps the local calendar day the same in every timezone used in CI.
const at = (day: string, correct: boolean, patch: Partial<Att> = {}): Att => ({
  questionId: 'q1', topic: 'Percentage', subject: 'Quantitative Aptitude', examCode: 'SSC_CGL', correct, timeMs: 30_000,
  createdAt: `${day}T12:00:00Z`, ...patch,
})

describe('analytics', () => {
  it('summarises and flags small samples as provisional', () => {
    expect(summary([])).toMatchObject({ attempted: 0, accuracy: null, provisional: true })
    const s = summary([at('2026-10-20', true), at('2026-10-21', false), at('2026-10-21', true, { timeMs: undefined })])
    expect(s).toMatchObject({ attempted: 3, correct: 2, incorrect: 1, timeMs: 60_000, avgTimeMs: 20_000, provisional: true })
    expect(s.accuracy).toBeCloseTo(2 / 3)
  })

  it('filters by date range and exam', () => {
    const a = [at('2026-10-01', true), at('2026-10-20', true), at('2026-10-21', false, { examCode: 'SSC_GD' })]
    expect(rangeStart('7d', '2026-10-22')).toBe('2026-10-16')
    expect(rangeStart('all', '2026-10-22')).toBeNull()
    expect(filterAttempts(a, { from: '2026-10-16', to: '2026-10-22' })).toHaveLength(2)
    expect(filterAttempts(a, { examCode: 'SSC_GD' })).toHaveLength(1)
  })

  it('groups by subject and topic', () => {
    const g = groupBy([at('2026-10-20', true), at('2026-10-20', false, { topic: 'Average' }), at('2026-10-20', true, { topic: 'Average' })], 'topic')
    expect(g.map((x) => [x.name, x.attempted, x.correct])).toEqual([['Average', 2, 1], ['Percentage', 1, 1]])
  })

  it('fills every day and groups weeks from Monday', () => {
    const d = daily([at('2026-10-20', true), at('2026-10-22', false)], '2026-10-19', '2026-10-22')
    expect(d.map((x) => [x.date, x.attempted])).toEqual([['2026-10-19', 0], ['2026-10-20', 1], ['2026-10-21', 0], ['2026-10-22', 1]])
    expect(d[1]!.minutes).toBe(1) // 30 s rounds to 1 min
    expect(weekStart('2026-10-22')).toBe('2026-10-19') // Thursday -> Monday
    expect(weekStart('2026-10-25')).toBe('2026-10-19') // Sunday -> previous Monday
    expect(weekly([at('2026-10-19', true), at('2026-10-25', true), at('2026-10-26', true)]).map((w) => [w.week, w.attempted])).toEqual([
      ['2026-10-19', 2],
      ['2026-10-26', 1],
    ])
  })

  it('reports a trend only with enough data on both sides', () => {
    const many = (day: string, n: number, correct: number) => Array.from({ length: n }, (_, i) => at(day, i < correct))
    expect(trend(many('2026-10-21', 12, 6), '2026-10-22').label).toBe('provisional')
    expect(trend([...many('2026-10-01', 10, 5), ...many('2026-10-21', 10, 8)], '2026-10-22')).toMatchObject({ label: 'improving' })
    expect(trend([...many('2026-10-01', 10, 8), ...many('2026-10-21', 10, 5)], '2026-10-22').label).toBe('declining')
    expect(trend([...many('2026-10-01', 10, 6), ...many('2026-10-21', 10, 6)], '2026-10-22').label).toBe('steady')
  })

  it('finds repeated errors and syllabus coverage', () => {
    const a = [at('2026-10-20', false), at('2026-10-21', false), at('2026-10-21', false, { questionId: 'q2' })]
    expect(repeatedErrors(a)).toMatchObject([{ questionId: 'q1', wrong: 2 }])
    expect(coverage(a, ['Percentage', 'Average', 'Series', 'Algebra'])).toEqual({ covered: 1, total: 4, pct: 0.25 })
  })
})

describe('dashboard and performance screens', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })
  const renderAt = (path: string) =>
    render(
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>,
    )

  it('shows onboarding, not invented numbers, for a new student', async () => {
    renderAt('/')
    expect(await screen.findByRole('heading', { name: 'Welcome to Smart Exam Coach' })).toBeInTheDocument()
    expect(screen.queryByText('Questions attempted')).toBeNull()
  })

  it('shows real figures once attempts exist', async () => {
    await loadDevSample()
    await savePrefs({ examCode: 'SSC_CGL' })
    const now = new Date().toISOString()
    await db.attempts.bulkAdd([
      { id: 'a1', questionId: 'DEV-001', topic: 'Percentage', subject: 'Quantitative Aptitude', examCode: 'SSC_CGL', correct: true, timeMs: 60_000, createdAt: now },
      { id: 'a2', questionId: 'DEV-004', topic: 'Series', subject: 'Reasoning', examCode: 'SSC_CGL', correct: false, timeMs: 60_000, createdAt: now },
    ])
    const { unmount } = renderAt('/')
    expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument()
    expect(screen.getByText('Provisional: fewer than 20 attempts')).toBeInTheDocument()
    expect(screen.getByText('2 min')).toBeInTheDocument()
    unmount()

    renderAt('/performance')
    expect(await screen.findByRole('heading', { name: 'Performance' })).toBeInTheDocument()
    expect(screen.getByText(/Provisional: only 2 attempts/)).toBeInTheDocument()
    expect(screen.getByText(/Quantitative Aptitude 100% of 1; Reasoning 0% of 1/)).toBeInTheDocument()
  })
})
