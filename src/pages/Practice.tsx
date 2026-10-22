import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Play } from 'lucide-react'
import { Button, Card, EmptyState, Skeleton, useToast } from '../components/ui'
import { EXAMS, SUBJECTS } from '../data/exams'
import { describeDbError } from '../db/db'
import { getPrefs } from '../db/prefs'
import { loadQuestions } from '../questions/repo'
import { DIFFICULTIES } from '../questions/schema'
import { MASTERY } from '../learning/mastery'
import { MODE_LABELS, SELECTION_MODES, eligible, seededRng, selectQuestions, type SelectionMode } from '../practice/engine'
import { abandonSession, activeSession, bookmarkIds, loadAttempts, startSession } from '../practice/repo'

const field = 'mt-1 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm'

export default function Practice() {
  const [params] = useSearchParams()
  const data = useLiveQuery(async () => ({
    prefs: (await getPrefs()).prefs,
    questions: (await loadQuestions()).questions,
    attempts: await loadAttempts(),
    bookmarks: await bookmarkIds(),
    active: await activeSession(),
  }))
  if (!data) return <Skeleton className="h-96 w-full" />
  return (
    <PracticeSetup
      data={data}
      initialMode={params.get('mode') as SelectionMode | null}
      initialSubject={params.get('subject')}
      initialTopic={params.get('topic')}
      initialTimed={params.get('timed') === '1'}
    />
  )
}

type Data = {
  prefs: Awaited<ReturnType<typeof getPrefs>>['prefs']
  questions: Awaited<ReturnType<typeof loadQuestions>>['questions']
  attempts: Awaited<ReturnType<typeof loadAttempts>>
  bookmarks: Set<string>
  active: Awaited<ReturnType<typeof activeSession>>
}

type SetupProps = { data: Data; initialMode: SelectionMode | null; initialSubject: string | null; initialTopic: string | null; initialTimed: boolean }

function PracticeSetup({ data, initialMode, initialSubject, initialTopic, initialTimed }: SetupProps) {
  const toast = useToast()
  const navigate = useNavigate()
  const [examCode, setExamCode] = useState(data.prefs.examCode ?? EXAMS[0]!.code)
  const [mode, setMode] = useState<SelectionMode>(initialMode && SELECTION_MODES.includes(initialMode) ? initialMode : 'mixed')
  const [subject, setSubject] = useState<string>(SUBJECTS.find((x) => x === initialSubject) ?? SUBJECTS[0])
  const [topic, setTopic] = useState(initialTopic ?? '')
  const [difficulty, setDifficulty] = useState('')
  const [count, setCount] = useState(10)
  const [timed, setTimed] = useState(initialTimed)
  const [minutes, setMinutes] = useState(10)
  const [busy, setBusy] = useState(false)

  const needsSubject = mode === 'subject' || mode === 'topic'
  const filters = useMemo(
    () => ({ examCode, subject: needsSubject ? subject : undefined, topic: mode === 'topic' ? topic : undefined, difficulty: difficulty || undefined }),
    [examCode, needsSubject, subject, mode, topic, difficulty],
  )
  const pool = useMemo(() => eligible(data.questions, filters), [data.questions, filters])
  const available = useMemo(
    () => selectQuestions({ mode, pool, attempts: data.attempts, bookmarkIds: data.bookmarks, count: Infinity, rng: seededRng(1) }).length,
    [mode, pool, data.attempts, data.bookmarks],
  )
  const topics = useMemo(() => {
    const counts = new Map<string, number>()
    for (const q of eligible(data.questions, { examCode, subject })) counts.set(q.topic, (counts.get(q.topic) ?? 0) + 1)
    return [...counts].sort((a, b) => a[0].localeCompare(b[0]))
  }, [data.questions, examCode, subject])

  const anyPublished = data.questions.some((q) => q.status === 'published')
  const topicMissing = mode === 'topic' && !topic
  const canStart = !busy && available > 0 && !topicMissing && count >= 1 && (!timed || minutes >= 1)

  async function start() {
    setBusy(true)
    try {
      const r = await startSession({ ...filters, mode, count, timed, timeLimitMin: timed ? minutes : undefined })
      if (!r.ok) return toast(r.error)
      if (r.short) toast(`Only ${r.session.questionIds.length} questions available, so the session is shorter.`)
      navigate(`/practice/session/${r.session.id}`)
    } catch (e) {
      toast(describeDbError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Practice</h1>

      {data.active && (
        <Card className="mt-4 border-accent">
          <h2 className="font-semibold">You have an unfinished practice session</h2>
          <p className="mt-1 text-sm text-muted">
            {Object.keys(data.active.answers).length} of {data.active.questionIds.length} answered · started{' '}
            {new Date(data.active.startedAt).toLocaleString()}
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <Link to={`/practice/session/${data.active.id}`} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-accent px-4 text-sm font-medium text-accent-ink">
              Resume
            </Link>
            <Button variant="ghost" onClick={() => abandonSession(data.active!.id)}>
              Abandon it
            </Button>
          </div>
        </Card>
      )}

      {!anyPublished ? (
        <div className="mt-4">
          <EmptyState title="No published questions yet">
            Import questions in the <Link className="text-accent underline" to="/question-bank">question bank</Link>, or load the
            development sample there to try practice.
          </EmptyState>
        </div>
      ) : (
        <Card className="mt-4 space-y-5">
          <label className="block text-sm font-medium">
            Exam
            <select className={field} value={examCode} onChange={(e) => setExamCode(e.target.value)}>
              {EXAMS.map((e) => (
                <option key={e.code} value={e.code}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>

          <fieldset>
            <legend className="text-sm font-medium">What to practise</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {SELECTION_MODES.map((m) => (
                <label key={m} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm ${mode === m ? 'border-accent bg-accent-soft' : 'border-border'}`}>
                  <input type="radio" name="mode" checked={mode === m} onChange={() => setMode(m)} />
                  {MODE_LABELS[m]}
                </label>
              ))}
            </div>
            {mode === 'weak' && (
              <p className="mt-2 text-xs text-muted">
                A topic counts as weak after at least {MASTERY.minAttempts} attempts with under {MASTERY.developingAccuracy * 100}% correct in
                its last {MASTERY.recentWindow} attempts.
              </p>
            )}
          </fieldset>

          {needsSubject && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium">
                Subject
                <select className={field} value={subject} onChange={(e) => {
                    setSubject(e.target.value)
                    setTopic('')
                  }}>
                  {SUBJECTS.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </label>
              {mode === 'topic' && (
                <label className="block text-sm font-medium">
                  Topic
                  <select className={field} value={topic} onChange={(e) => setTopic(e.target.value)} aria-invalid={topicMissing}>
                    <option value="">Choose a topic</option>
                    {topics.map(([t, n]) => (
                      <option key={t} value={t}>
                        {t} ({n})
                      </option>
                    ))}
                  </select>
                </label>
              )}
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium">
              Difficulty
              <select className={field} value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                <option value="">Any</option>
                {DIFFICULTIES.map((d) => (
                  <option key={d}>{d}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium">
              Number of questions
              <input type="number" min={1} max={100} className={field} value={count} onChange={(e) => setCount(Math.min(100, Math.max(1, Number(e.target.value) || 1)))} />
            </label>
          </div>

          <fieldset>
            <legend className="text-sm font-medium">How</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              <label className={`flex min-h-11 cursor-pointer items-start gap-2 rounded-md border p-3 text-sm ${!timed ? 'border-accent bg-accent-soft' : 'border-border'}`}>
                <input type="radio" name="timed" className="mt-0.5" checked={!timed} onChange={() => setTimed(false)} />
                <span>
                  <strong>Learning mode</strong>
                  <span className="block text-muted">No timer. See the answer and explanation after each question.</span>
                </span>
              </label>
              <label className={`flex min-h-11 cursor-pointer items-start gap-2 rounded-md border p-3 text-sm ${timed ? 'border-accent bg-accent-soft' : 'border-border'}`}>
                <input type="radio" name="timed" className="mt-0.5" checked={timed} onChange={() => setTimed(true)} />
                <span>
                  <strong>Timed practice</strong>
                  <span className="block text-muted">Answers and explanations are shown at the end.</span>
                </span>
              </label>
            </div>
            {timed && (
              <label className="mt-3 block max-w-xs text-sm font-medium">
                Time limit (minutes)
                <input type="number" min={1} max={180} className={field} value={minutes} onChange={(e) => setMinutes(Math.min(180, Math.max(1, Number(e.target.value) || 1)))} />
              </label>
            )}
          </fieldset>

          <div className="flex flex-wrap items-center gap-4">
            <Button onClick={start} disabled={!canStart}>
              <Play size={16} aria-hidden /> Start practice
            </Button>
            <p className="text-sm text-muted" aria-live="polite">
              {topicMissing ? 'Choose a topic.' : `${available} question${available === 1 ? '' : 's'} available`}
            </p>
          </div>
        </Card>
      )}
    </section>
  )
}
