import { useMemo, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Download, FlaskConical, Library, Pencil, Trash2 } from 'lucide-react'
import { Button, Card, EmptyState, Skeleton, useToast } from '../components/ui'
import QuestionImport from '../components/QuestionImport'
import QuestionEditDialog from '../components/QuestionEditDialog'
import { EXAMS, SUBJECTS } from '../data/exams'
import { db, describeDbError } from '../db/db'
import { downloadText } from '../download'
import { questionsToCsv } from '../questions/csv'
import { STARTER_PREFIX, loadDevSample, loadQuestions, loadStarterQuestions, questionsToJson, removeDevSample, removeStarterQuestions } from '../questions/repo'
import { STATUSES, correctAnswerLabel, normalize, type Question } from '../questions/schema'
import { staggerStyle } from '../components/motion'

const select = 'min-h-11 max-w-full rounded-md border border-border bg-surface px-3 text-sm'
const PAGE = 50

export default function QuestionBank() {
  const toast = useToast()
  const data = useLiveQuery(() => loadQuestions())
  const openReports = useLiveQuery(async () => {
    const m = new Map<string, number>()
    for (const r of await db.errorReports.where('status').equals('open').toArray()) m.set(String(r.questionId), (m.get(String(r.questionId)) ?? 0) + 1)
    return m
  })
  const [exam, setExam] = useState('')
  const [subject, setSubject] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')
  const [limit, setLimit] = useState(PAGE)
  const [editing, setEditing] = useState<Question | null>(null)

  const all = useMemo(() => data?.questions ?? [], [data])
  const filtered = useMemo(() => {
    const term = normalize(search)
    return all.filter(
      (q) =>
        (!exam || q.examCodes.includes(exam)) &&
        (!subject || q.subject === subject) &&
        (!status || q.status === status) &&
        (!term || normalize(`${q.id} ${q.text} ${q.topic}`).includes(term)),
    )
  }, [all, exam, subject, status, search])

  const hasDev = all.some((q) => q.source.kind === 'dev-sample')
  const starterCount = all.filter((q) => q.id.startsWith(STARTER_PREFIX)).length
  const [busy, setBusy] = useState(false)
  const run = async (fn: () => Promise<string>) => {
    setBusy(true)
    try {
      toast(await fn())
    } catch (e) {
      toast(e instanceof Error && e.message.startsWith('Could not download') ? e.message : describeDbError(e))
    } finally {
      setBusy(false)
    }
  }
  const stamp = () => new Date().toISOString().slice(0, 10)

  return (
    <section>
      <h1 className="text-2xl font-semibold">Question bank</h1>
      <p className="mt-1 max-w-2xl text-sm text-muted">
        Questions stored in this browser. Only <strong>approved</strong> or <strong>published</strong> questions are used in
        scored mock tests.
      </p>

      {!data ? (
        <Skeleton className="mt-6 h-40 w-full" />
      ) : (
        <>
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <span className="rounded-md bg-surface-2 px-3 py-1.5">Total: {all.length}</span>
            {STATUSES.map((s) => (
              <span key={s} className="rounded-md bg-surface-2 px-3 py-1.5">
                {s}: {all.filter((q) => q.status === s).length}
              </span>
            ))}
            {data.malformed > 0 && (
              <span role="alert" className="rounded-md border border-danger px-3 py-1.5 text-danger">
                {data.malformed} stored rows are malformed and hidden
              </span>
            )}
          </div>

          <Card className="mt-4 flex flex-col gap-4 border-accent sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 max-w-2xl gap-3">
              <Library size={22} className="mt-0.5 shrink-0 text-accent" aria-hidden />
              <div className="min-w-0">
                <h2 className="font-semibold">Starter question bank</h2>
                <p className="mt-1 text-sm text-muted">
                  About 1,700 original practice questions for all four subjects, enough for full-length CGL, CHSL, MTS, GD and A&amp;N mocks.
                  Maths and reasoning answers are computed by a program; English and GA were written by Claude. Not previous-year questions
                  and not expert-reviewed. Current-affairs questions show their news source.
                </p>
                {starterCount > 0 && <p className="mt-1 text-sm font-medium text-success">{starterCount} starter questions loaded</p>}
              </div>
            </div>
            {starterCount > 0 ? (
              <Button variant="ghost" disabled={busy} onClick={() => run(async () => `Removed ${await removeStarterQuestions()} starter questions`)}>
                <Trash2 size={16} aria-hidden /> Remove starter bank
              </Button>
            ) : (
              <Button
                disabled={busy}
                onClick={() =>
                  run(async () => {
                    const r = await loadStarterQuestions()
                    return `Added ${r.added} questions${r.rejected ? `, ${r.rejected} skipped as duplicates` : ''}`
                  })
                }
              >
                <Library size={16} aria-hidden /> {busy ? 'Loading…' : 'Load starter bank'}
              </Button>
            )}
          </Card>

          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            <QuestionImport />
            <Card>
              <h2 className="font-semibold">Export and sample data</h2>
              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="secondary" disabled={!filtered.length} onClick={() => downloadText(`questions-${stamp()}.csv`, questionsToCsv(filtered), 'text/csv')}>
                  <Download size={16} aria-hidden /> CSV ({filtered.length})
                </Button>
                <Button variant="secondary" disabled={!filtered.length} onClick={() => downloadText(`questions-${stamp()}.json`, questionsToJson(filtered))}>
                  <Download size={16} aria-hidden /> JSON ({filtered.length})
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted">
                The development sample is 14 simple questions written for testing the app. It is not exam content and is
                labelled DEV SAMPLE everywhere.
              </p>
              <div className="mt-3">
                {hasDev ? (
                  <Button variant="ghost" onClick={() => run(async () => `Removed ${await removeDevSample()} sample questions`)}>
                    <Trash2 size={16} aria-hidden /> Remove development sample
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={() => run(async () => `Added ${await loadDevSample()} sample questions`)}>
                    <FlaskConical size={16} aria-hidden /> Load development sample
                  </Button>
                )}
              </div>
            </Card>
          </div>

          <div className="mt-6 flex flex-wrap gap-2">
            <input className={select + ' min-w-48 flex-1'} placeholder="Search ID, text or topic" aria-label="Search questions" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className={select} aria-label="Exam" value={exam} onChange={(e) => setExam(e.target.value)}>
              <option value="">All exams</option>
              {EXAMS.map((e) => (
                <option key={e.code} value={e.code}>
                  {e.name}
                </option>
              ))}
            </select>
            <select className={select} aria-label="Subject" value={subject} onChange={(e) => setSubject(e.target.value)}>
              <option value="">All subjects</option>
              {SUBJECTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            <select className={select} aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>

          {filtered.length === 0 ? (
            <div className="mt-4">
              <EmptyState title={all.length ? 'No questions match these filters' : 'No questions yet'}>
                {all.length ? 'Change or clear the filters.' : 'Import a CSV or JSON file, or load the development sample to try the app.'}
              </EmptyState>
            </div>
          ) : (
            <ul className="stagger mt-4 space-y-2">
              {filtered.slice(0, limit).map((q, i) => (
                <li key={q.id} style={staggerStyle(i)} className="glass rounded-lg p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
                        <span className="font-mono">{q.id}</span>
                        <span>· {q.subject} · {q.topic} · {q.difficulty}</span>
                        <span className="rounded bg-surface-2 px-1.5 py-0.5 font-medium text-ink">{q.status}</span>
                        {!!openReports?.get(q.id) && (
                          <span className="rounded border border-danger px-1.5 py-0.5 font-medium text-danger">
                            {openReports.get(q.id)} open report{openReports.get(q.id) === 1 ? '' : 's'}
                          </span>
                        )}
                        {q.source.kind === 'dev-sample' && <span className="rounded border border-warning px-1.5 py-0.5 font-medium text-warning">DEV SAMPLE</span>}
                      </p>
                      <p className="mt-1 text-sm">{q.text}</p>
                      <p className="mt-1 text-xs text-muted">Answer: {correctAnswerLabel(q)}</p>
                    </div>
                    <button type="button" aria-label={`Edit ${q.id}`} onClick={() => setEditing(q)} className="grid h-11 w-11 shrink-0 place-items-center rounded-md hover:bg-surface-2">
                      <Pencil size={16} aria-hidden />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {filtered.length > limit && (
            <Button variant="secondary" className="mt-4" onClick={() => setLimit((l) => l + PAGE)}>
              Show more ({filtered.length - limit} left)
            </Button>
          )}
        </>
      )}
      {editing && <QuestionEditDialog question={editing} onClose={() => setEditing(null)} />}
    </section>
  )
}
