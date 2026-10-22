import { useMemo, useState, type ReactNode } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Download } from 'lucide-react'
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Button, Card, EmptyState, Skeleton } from '../components/ui'
import { EXAMS } from '../data/exams'
import { downloadText } from '../download'
import { toCsv } from '../questions/csv'
import { loadQuestions } from '../questions/repo'
import { addDays, localDate } from '../learning/dates'
import { loadOverview, syllabusTopics, type Overview } from '../analytics/load'
import {
  RANGE_LABEL,
  attemptsCsvRows,
  coverage,
  daily,
  dayOf,
  filterAttempts,
  groupBy,
  minutes,
  pct,
  rangeStart,
  repeatedErrors,
  summary,
  trend,
  weekly,
  type Range,
} from '../analytics/stats'

const field = 'min-h-11 rounded-md border border-border bg-surface px-3 text-sm'
const reducedMotion = () => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
const axis = { stroke: 'var(--color-muted)', fontSize: 12 }

export default function Performance() {
  const today = localDate()
  const data = useLiveQuery(() => loadOverview(today), [today])
  const questions = useLiveQuery(async () => new Map((await loadQuestions()).questions.map((q) => [q.id, q])))
  if (!data || !questions) return <Skeleton className="h-96 w-full" />
  if (data.attempts.length === 0)
    return (
      <section>
        <h1 className="text-2xl font-semibold">Performance</h1>
        <div className="mt-4">
          <EmptyState title="No attempts yet">
            Reports appear after you answer questions in <Link className="text-accent underline" to="/practice">Practice</Link> or a mock test.
          </EmptyState>
        </div>
      </section>
    )
  return <Report data={data} today={today} questionText={(id) => questions.get(id)?.text} />
}

function ChartCard({ title, summaryText, children }: { title: string; summaryText: string; children: ReactNode }) {
  return (
    <Card>
      <h2 className="font-semibold">{title}</h2>
      {/* Text alternative for screen readers and for anyone who prefers numbers. */}
      <p className="mt-1 text-sm text-muted">{summaryText}</p>
      <div className="mt-3 h-56" aria-hidden>
        {children}
      </div>
    </Card>
  )
}

function Report({ data, today, questionText }: { data: Overview; today: string; questionText: (id: string) => string | undefined }) {
  const [range, setRange] = useState<Range>('30d')
  const [exam, setExam] = useState(data.prefs.examCode ?? '')
  const anim = !reducedMotion()

  const r = useMemo(() => {
    const from = rangeStart(range, today) ?? (data.attempts.length ? data.attempts.map((a) => dayOf(a.createdAt)).sort()[0]! : today)
    const atts = filterAttempts(data.attempts, { from, to: today, examCode: exam || null })
    const days = daily(atts, from < addDays(today, -89) ? addDays(today, -89) : from, today)
    return {
      atts,
      s: summary(atts),
      days,
      weeks: weekly(atts),
      subjects: groupBy(atts, 'subject'),
      topics: groupBy(atts, 'topic'),
      tr: trend(filterAttempts(data.attempts, { examCode: exam || null }), today),
      errors: repeatedErrors(atts).slice(0, 10),
      cov: coverage(data.attempts, syllabusTopics(exam || data.prefs.examCode)),
      mocks: data.mocks.filter((m) => (!exam || m.examCode === exam) && m.result && dayOf(m.startedAt) >= from).reverse(),
      reviews: data.reviewLogs.filter((l) => typeof l.reviewedAt === 'string' && dayOf(String(l.reviewedAt)) >= from),
    }
  }, [data, range, exam, today])

  const remembered = r.reviews.filter((l) => Number(l.quality) >= 3).length
  const activeDays = r.days.filter((d) => d.attempted > 0)
  const best = [...r.subjects].filter((x) => x.attempted >= 5).sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0))[0]
  const trendText = {
    provisional: `Not enough data for a trend yet (needs ${10} attempts in the last 7 days and ${10} before).`,
    improving: `Improving: last 7 days ${pct(r.tr.recent.accuracy)} vs ${pct(r.tr.earlier.accuracy)} before.`,
    declining: `Declining: last 7 days ${pct(r.tr.recent.accuracy)} vs ${pct(r.tr.earlier.accuracy)} before.`,
    steady: `Steady: last 7 days ${pct(r.tr.recent.accuracy)} vs ${pct(r.tr.earlier.accuracy)} before.`,
  }[r.tr.label]

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-2xl font-semibold">Performance</h1>
        <div className="flex flex-wrap gap-2">
          <select aria-label="Date range" className={field} value={range} onChange={(e) => setRange(e.target.value as Range)}>
            {(Object.keys(RANGE_LABEL) as Range[]).map((x) => (
              <option key={x} value={x}>
                {RANGE_LABEL[x]}
              </option>
            ))}
          </select>
          <select aria-label="Exam filter" className={field} value={exam} onChange={(e) => setExam(e.target.value)}>
            <option value="">All exams</option>
            {EXAMS.map((e) => (
              <option key={e.code} value={e.code}>
                {e.name}
              </option>
            ))}
          </select>
          <Button variant="secondary" disabled={!r.atts.length} onClick={() => downloadText(`attempts-${today}.csv`, toCsv(attemptsCsvRows(r.atts)), 'text/csv')}>
            <Download size={16} aria-hidden /> Export CSV
          </Button>
        </div>
      </div>

      {r.s.provisional && (
        <p className="mt-3 rounded-md border border-warning px-4 py-2 text-sm text-warning">
          Provisional: only {r.s.attempted} attempts in this view. Results will be more reliable after at least 20.
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          ['Attempted', String(r.s.attempted)],
          ['Correct', String(r.s.correct)],
          ['Incorrect', String(r.s.incorrect)],
          ['Accuracy', pct(r.s.accuracy)],
          ['Avg time / question', r.s.avgTimeMs === null ? '—' : `${Math.round(r.s.avgTimeMs / 1000)} s`],
        ].map(([k, v]) => (
          <Card key={k} className="p-4">
            <p className="text-xs text-muted">{k}</p>
            <p className="mt-1 text-xl font-semibold">{v}</p>
          </Card>
        ))}
      </div>
      <p className="mt-2 text-sm">{trendText}</p>
      <p className="text-xs text-muted">
        Accuracy = correct ÷ answered (unanswered not counted). Mock scores below are raw marks with negative marking; score % =
        marks ÷ maximum. No rank or percentile is shown: there is no comparison group.
      </p>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ChartCard
          title="Accuracy by day"
          summaryText={activeDays.length ? `${activeDays.length} active days; accuracy ranged from ${pct(Math.min(...activeDays.map((d) => d.accuracy ?? 0)))} to ${pct(Math.max(...activeDays.map((d) => d.accuracy ?? 0)))}.` : 'No attempts in this period.'}
        >
          <ResponsiveContainer>
            <LineChart data={r.days.map((d) => ({ ...d, accuracyPct: d.accuracy === null ? null : Math.round(d.accuracy * 100) }))}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="date" tick={axis} tickFormatter={(d: string) => d.slice(5)} minTickGap={24} />
              <YAxis domain={[0, 100]} tick={axis} unit="%" width={44} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
              <Line type="monotone" dataKey="accuracyPct" name="Accuracy %" stroke="var(--color-accent)" strokeWidth={2} dot={false} connectNulls isAnimationActive={anim} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Time on questions by week" summaryText={r.weeks.length ? r.weeks.map((w) => `week of ${w.week}: ${w.minutes} min`).join('; ') + '.' : 'No time recorded.'}>
          <ResponsiveContainer>
            <BarChart data={r.weeks}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="week" tick={axis} tickFormatter={(d: string) => d.slice(5)} />
              <YAxis tick={axis} unit=" m" width={44} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
              <Bar dataKey="minutes" name="Minutes" fill="var(--color-accent)" radius={[4, 4, 0, 0]} isAnimationActive={anim} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Accuracy by subject"
          summaryText={r.subjects.map((x) => `${x.name} ${pct(x.accuracy)} of ${x.attempted}`).join('; ') + (best ? `. Best (5+ attempts): ${best.name}.` : '.')}
        >
          <ResponsiveContainer>
            <BarChart data={r.subjects.map((x) => ({ name: x.name, accuracyPct: Math.round((x.accuracy ?? 0) * 100) }))} layout="vertical" margin={{ left: 8 }}>
              <CartesianGrid stroke="var(--color-border)" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={axis} unit="%" />
              <YAxis type="category" dataKey="name" tick={axis} width={120} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
              <Bar dataKey="accuracyPct" name="Accuracy %" fill="var(--color-accent)" radius={[0, 4, 4, 0]} isAnimationActive={anim} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Mock test scores"
          summaryText={r.mocks.length ? r.mocks.map((m) => `${dayOf(m.startedAt)}: ${m.result!.marks}/${m.result!.maxMarks}${m.partial ? ' (partial)' : ''}`).join('; ') + '.' : 'No mock tests in this period.'}
        >
          <ResponsiveContainer>
            <LineChart data={r.mocks.map((m) => ({ date: dayOf(m.startedAt), scorePct: m.result!.maxMarks ? Math.round((m.result!.marks / m.result!.maxMarks) * 100) : 0 }))}>
              <CartesianGrid stroke="var(--color-border)" vertical={false} />
              <XAxis dataKey="date" tick={axis} tickFormatter={(d: string) => d.slice(5)} />
              <YAxis domain={[-25, 100]} tick={axis} unit="%" width={44} />
              <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }} />
              <Line type="monotone" dataKey="scorePct" name="Score %" stroke="var(--color-accent)" strokeWidth={2} isAnimationActive={anim} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="font-semibold">Syllabus coverage</h2>
          <p className="mt-2 text-2xl font-semibold">{pct(r.cov.pct)}</p>
          <p className="text-sm text-muted">
            {r.cov.covered} of {r.cov.total} topics attempted at least once
          </p>
        </Card>
        <Card>
          <h2 className="font-semibold">Revision</h2>
          <p className="mt-2 text-2xl font-semibold">{r.reviews.length}</p>
          <p className="text-sm text-muted">
            reviews in this period · remembered {r.reviews.length ? pct(remembered / r.reviews.length) : '—'} · {data.revision.overdue} overdue now
          </p>
        </Card>
        <Card>
          <h2 className="font-semibold">Study time</h2>
          <p className="mt-2 text-2xl font-semibold">{minutes(r.s.timeMs)}</p>
          <p className="text-sm text-muted">measured time on questions in this period</p>
        </Card>
      </div>

      <Card className="mt-4 overflow-x-auto">
        <h2 className="font-semibold">By topic</h2>
        <table className="mt-2 w-full min-w-[480px] text-left text-sm">
          <thead className="text-muted">
            <tr>
              {['Topic', 'Attempted', 'Accuracy', 'Avg time'].map((h) => (
                <th key={h} className="py-1.5 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {r.topics.map((t) => (
              <tr key={t.name} className="border-t border-border">
                <td className="py-1.5">{t.name}</td>
                <td className="py-1.5">{t.attempted}</td>
                <td className="py-1.5">
                  {pct(t.accuracy)}
                  {t.attempted < 5 && <span className="ml-1 text-xs text-muted">(few attempts)</span>}
                </td>
                <td className="py-1.5">{t.avgTimeMs === null ? '—' : `${Math.round(t.avgTimeMs / 1000)} s`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold">Repeated mistakes</h2>
        {r.errors.length === 0 ? (
          <p className="mt-2 text-sm text-muted">No question was answered wrongly more than once in this period.</p>
        ) : (
          <ul className="mt-2 space-y-1.5 text-sm">
            {r.errors.map((e) => (
              <li key={e.questionId} className="border-t border-border pt-1.5">
                <span className="font-medium">{e.wrong}× wrong</span> · {e.topic} · {questionText(e.questionId) ?? e.questionId}
              </li>
            ))}
          </ul>
        )}
        {r.errors.length > 0 && (
          <Link to="/practice?mode=incorrect" className="mt-3 inline-flex text-sm font-medium text-accent">
            Practise questions I got wrong
          </Link>
        )}
      </Card>
    </section>
  )
}
