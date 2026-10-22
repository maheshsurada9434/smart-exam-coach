import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { ArrowRight, CircleHelp } from 'lucide-react'
import { Card, Progress, Skeleton } from '../components/ui'
import { EXAMS, examByCode } from '../data/exams'
import { localDate } from '../learning/dates'
import { LABEL_TEXT } from '../learning/mastery'
import { loadOverview, syllabusTopics, type Overview } from '../analytics/load'
import { RANGE_LABEL, coverage, filterAttempts, minutes, pct, rangeStart, summary, type Range } from '../analytics/stats'

const field = 'min-h-11 rounded-md border border-border bg-surface px-3 text-sm'
const linkBtn = 'inline-flex min-h-11 items-center gap-2 rounded-md px-4 text-sm font-medium'

export default function Dashboard() {
  const today = localDate()
  const data = useLiveQuery(() => loadOverview(today), [today])
  if (!data) return <Skeleton className="h-96 w-full" />
  if (data.attempts.length === 0 && data.mocks.length === 0) return <Onboarding data={data} />
  return <DashboardView data={data} today={today} />
}

function Onboarding({ data }: { data: Overview }) {
  const steps: [string, string, string, boolean][] = [
    ['Choose your exam', 'Pick SSC CGL, CHSL, MTS, GD or an Andaman exam and your daily study time.', '/settings', !!data.prefs.examCode],
    ['Add questions', 'Import a question file, or load the clearly labelled development sample to try the app.', '/question-bank', data.questionCount > 0],
    ['Start practising', 'Every attempt builds your real performance record. Statistics appear here after that.', '/practice', false],
  ]
  return (
    <section>
      <p className="text-sm font-medium text-accent">Study Smarter. Practice Better. Improve Every Day.</p>
      <h1 className="mt-1 text-2xl font-semibold">Welcome to Smart Exam Coach</h1>
      <p className="mt-2 max-w-2xl text-muted">
        A free, offline-friendly coach for SSC and Andaman &amp; Nicobar recruitment exams. Your records stay in this browser. No AI,
        no accounts, no paid services.
      </p>
      <ol className="mt-6 grid gap-4 sm:grid-cols-3">
        {steps.map(([t, d, to, done], i) => (
          <li key={t}>
            <Card className="h-full">
              <h2 className="font-semibold">
                {i + 1}. {t} {done && <span className="text-sm font-medium text-success">· done</span>}
              </h2>
              <p className="mt-1 text-sm text-muted">{d}</p>
              <Link to={to} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
                Open <ArrowRight size={14} aria-hidden />
              </Link>
            </Card>
          </li>
        ))}
      </ol>
      <p className="mt-6 text-sm text-muted">No statistics are shown until you have practised: nothing here is sample or made-up data.</p>
    </section>
  )
}

function Explain({ children }: { children: string }) {
  return (
    <details className="mt-1 text-xs text-muted">
      <summary className="inline-flex cursor-pointer items-center gap-1">
        <CircleHelp size={12} aria-hidden /> How is this calculated?
      </summary>
      <p className="mt-1">{children}</p>
    </details>
  )
}

function DashboardView({ data, today }: { data: Overview; today: string }) {
  const [range, setRange] = useState<Range>('30d')
  const [exam, setExam] = useState<string>(data.prefs.examCode ?? '')
  const atts = filterAttempts(data.attempts, { from: rangeStart(range, today), to: today, examCode: exam || null })
  const s = summary(atts)
  const mocks = data.mocks.filter((m) => !exam || m.examCode === exam)
  const lastMock = mocks[0]
  const cov = coverage(data.attempts, syllabusTopics(exam || data.prefs.examCode))
  const weak = data.mastery.filter((m) => m.label === 'needs-practice')
  const doneTasks = data.todayTasks.filter((t) => t.status === 'done').length
  const activeTasks = data.todayTasks.filter((t) => t.status !== 'skipped').length
  const next = data.recommendations[0]
  const examName = examByCode(data.prefs.examCode)?.name

  return (
    <section>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">{examName ? `Preparing for ${examName}` : 'No target exam chosen yet'}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <select aria-label="Date range" className={field} value={range} onChange={(e) => setRange(e.target.value as Range)}>
            {(Object.keys(RANGE_LABEL) as Range[]).map((r) => (
              <option key={r} value={r}>
                {RANGE_LABEL[r]}
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
        </div>
      </div>

      {next && (
        <Card className="mt-4 border-accent">
          <p className="text-xs font-medium uppercase tracking-wide text-accent">Recommended next</p>
          <p className="mt-1 text-sm">{next.reason}</p>
          <Link to="/planner" className={`${linkBtn} mt-3 bg-accent text-accent-ink`}>
            Open today’s plan <ArrowRight size={14} aria-hidden />
          </Link>
        </Card>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="p-4">
          <p className="text-xs text-muted">Questions attempted</p>
          <p className="mt-1 text-2xl font-semibold">{s.attempted}</p>
          <Explain>Every answered question in practice and mock tests within the selected dates and exam.</Explain>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">Accuracy</p>
          <p className="mt-1 text-2xl font-semibold">{pct(s.accuracy)}</p>
          {s.attempted > 0 && s.provisional && <p className="text-xs text-warning">Provisional: fewer than 20 attempts</p>}
          <Explain>Correct answers ÷ answered questions. Unanswered questions are not counted. This is not a mock-test score.</Explain>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">Time on questions</p>
          <p className="mt-1 text-2xl font-semibold">{minutes(s.timeMs)}</p>
          <Explain>Measured time from showing a question to answering it. Reading notes or concepts is not included.</Explain>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted">Latest mock score</p>
          <p className="mt-1 text-2xl font-semibold">{lastMock?.result ? `${lastMock.result.marks} / ${lastMock.result.maxMarks}` : '—'}</p>
          {lastMock?.partial && <p className="text-xs text-warning">Partial test</p>}
          <Explain>Raw marks with the exam's negative marking, from your most recent submitted mock test.</Explain>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <Card>
          <h2 className="font-semibold">Today’s plan</h2>
          {activeTasks === 0 ? (
            <p className="mt-2 text-sm text-muted">No tasks yet for today.</p>
          ) : (
            <>
              <p className="mt-2 text-sm">
                {doneTasks} of {activeTasks} tasks done
              </p>
              <div className="mt-2">
                <Progress value={(doneTasks / activeTasks) * 100} label="Today's tasks done" />
              </div>
              <ul className="mt-3 space-y-1 text-sm">
                {data.todayTasks.slice(0, 4).map((t) => (
                  <li key={t.id} className={t.status === 'done' ? 'text-muted line-through' : ''}>
                    {t.topic ?? t.type} · {t.durationMin} min
                  </li>
                ))}
              </ul>
            </>
          )}
          <Link to="/planner" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
            Planner <ArrowRight size={14} aria-hidden />
          </Link>
        </Card>

        <Card>
          <h2 className="font-semibold">Revision due today</h2>
          <p className="mt-2 text-2xl font-semibold">{data.revision.today + data.revision.overdue}</p>
          {data.revision.overdue > 0 && <p className="text-xs text-warning">{data.revision.overdue} overdue</p>}
          <Link to="/revision" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
            Revise <ArrowRight size={14} aria-hidden />
          </Link>
        </Card>

        <Card>
          <h2 className="font-semibold">Syllabus coverage</h2>
          <p className="mt-2 text-sm">
            {cov.covered} of {cov.total} topics practised ({pct(cov.pct)})
          </p>
          <div className="mt-2">
            <Progress value={cov.pct * 100} label="Syllabus coverage" />
          </div>
          <Explain>A topic counts as covered after at least one attempt (all dates). Topic list: the Syllabus page for your exam.</Explain>
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Topic mastery</h2>
          {data.mastery.length === 0 ? (
            <p className="mt-2 text-sm text-muted">Practise to see topic mastery.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {[...data.mastery]
                .sort((a, b) => b.attempts - a.attempts)
                .slice(0, 8)
                .map((m) => (
                  <li key={m.topic} className="flex flex-wrap justify-between gap-2 border-t border-border pt-1.5">
                    <span>{m.topic}</span>
                    <span className={m.label === 'needs-practice' ? 'text-danger' : m.label === 'strong' ? 'text-success' : 'text-muted'}>
                      {LABEL_TEXT[m.label]} · {m.attempts} attempts
                    </span>
                  </li>
                ))}
            </ul>
          )}
          {weak.length > 0 && (
            <p className="mt-3 text-sm">
              Weak topics: <strong>{weak.map((w) => w.topic).join(', ')}</strong>
            </p>
          )}
          <Explain>Labels use your last 10 attempts per topic and need at least 5 attempts. Rules: docs/ALGORITHMS.md.</Explain>
        </Card>

        <Card>
          <h2 className="font-semibold">Recent activity</h2>
          {data.recentSessions.length === 0 ? (
            <p className="mt-2 text-sm text-muted">No sessions yet.</p>
          ) : (
            <ul className="mt-2 space-y-1.5 text-sm">
              {data.recentSessions.map((x) => {
                const isMock = x.kind === 'mock'
                const res = (x as { result?: { marks: number; maxMarks: number } }).result
                const qs = Array.isArray(x.questionIds) ? x.questionIds.length : 0
                return (
                  <li key={x.id} className="animate-page-in flex flex-wrap justify-between gap-2 border-t border-border pt-1.5">
                    <Link className="text-accent underline" to={isMock ? `/mock-tests/run/${x.id}` : `/practice/session/${x.id}`}>
                      {isMock ? 'Mock test' : 'Practice'}
                      {x.status === 'active' ? ' (in progress)' : ''}
                    </Link>
                    <span className="text-muted">
                      {new Date(String(x.startedAt)).toLocaleDateString()}
                      {res ? ` · ${res.marks} / ${res.maxMarks}` : qs ? ` · ${qs} questions` : ''}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
          <Link to="/performance" className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-accent">
            Full performance report <ArrowRight size={14} aria-hidden />
          </Link>
        </Card>
      </div>
    </section>
  )
}
