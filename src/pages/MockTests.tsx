import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate } from 'react-router-dom'
import { AlertTriangle, Play } from 'lucide-react'
import { Button, Card, EmptyState, Skeleton, useToast } from '../components/ui'
import { EXAMS } from '../data/exams'
import { describeDbError } from '../db/db'
import { getPrefs } from '../db/prefs'
import { activeMock, mockHistory, planMock, startMock } from '../mock/repo'
import type { MockPlan } from '../mock/engine'
import { staggerStyle } from '../components/motion'

const field = 'mt-1 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm'
const withPapers = EXAMS.filter((e) => e.papers.length > 0)

export default function MockTests() {
  const toast = useToast()
  const navigate = useNavigate()
  const data = useLiveQuery(async () => ({ prefs: (await getPrefs()).prefs, active: await activeMock(), history: await mockHistory() }))
  const [examCode, setExamCode] = useState<string | null>(null)
  const [paperName, setPaperName] = useState('')
  const [sectionName, setSectionName] = useState('') // '' = full paper
  const [plan, setPlan] = useState<MockPlan | null>(null)
  const [busy, setBusy] = useState(false)

  const exam = withPapers.find((e) => e.code === (examCode ?? data?.prefs.examCode)) ?? withPapers[0]!
  const paper = exam.papers.find((p) => p.name === paperName) ?? exam.papers[0]!

  useEffect(() => {
    let live = true
    planMock(exam.code, paper.name, sectionName || null).then((p) => live && setPlan(p))
    return () => {
      live = false
    }
  }, [exam.code, paper.name, sectionName])

  if (!data) return <Skeleton className="h-96 w-full" />

  async function start() {
    setBusy(true)
    try {
      const fresh = await planMock(exam.code, paper.name, sectionName || null) // re-plan with latest bank
      if (!fresh) return
      const r = await startMock(fresh)
      if (!r.ok) return toast(r.error)
      navigate(`/mock-tests/run/${r.session.id}`)
    } catch (e) {
      toast(describeDbError(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Mock tests</h1>
      <p className="mt-1 text-sm text-muted">
        Uses only <strong>approved</strong> or <strong>published</strong> questions and the marking rules from the Syllabus page.
      </p>

      {data.active && (
        <Card className="mt-4 border-accent">
          <h2 className="font-semibold">A mock test is in progress</h2>
          <p className="mt-1 text-sm text-muted">
            {data.active.paperName}
            {data.active.sectionName ? ` · ${data.active.sectionName}` : ''} · the timer keeps running while you are away.
          </p>
          <Link to={`/mock-tests/run/${data.active.id}`} className="mt-3 inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-ink">
            Return to the test
          </Link>
        </Card>
      )}

      <Card className="mt-4 space-y-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block text-sm font-medium">
            Exam
            <select className={field} value={exam.code} onChange={(e) => (setExamCode(e.target.value), setPaperName(''), setSectionName(''))}>
              {withPapers.map((e) => (
                <option key={e.code} value={e.code}>
                  {e.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Paper
            <select className={field} value={paper.name} onChange={(e) => (setPaperName(e.target.value), setSectionName(''))}>
              {exam.papers.map((p) => (
                <option key={p.name}>{p.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Test type
            <select className={field} value={sectionName} onChange={(e) => setSectionName(e.target.value)}>
              <option value="">Full paper</option>
              {paper.sections.map((s) => (
                <option key={s.name} value={s.name}>
                  Sectional: {s.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        {plan && (
          <>
            <table className="w-full text-left text-sm">
              <thead className="text-muted">
                <tr>
                  <th className="py-1.5 font-medium">Section</th>
                  <th className="py-1.5 font-medium">Questions available</th>
                  <th className="py-1.5 font-medium">Marking</th>
                </tr>
              </thead>
              <tbody>
                {plan.sections.map((s) => (
                  <tr key={s.name} className="border-t border-border">
                    <td className="py-1.5">{s.name}</td>
                    <td className={`py-1.5 ${s.questionIds.length < s.required ? 'text-warning' : ''}`}>
                      {s.questionIds.length} of {s.required}
                    </td>
                    <td className="py-1.5">
                      +{s.marksPerCorrect} / {s.negativePerWrong ? `−${s.negativePerWrong}` : 'no negative'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="text-sm">
              {plan.available} questions · {Math.round(plan.durationSec / 60)} min
              {sectionName && ' (time scaled from the full paper by question count)'}
            </p>
            {plan.partial && plan.available > 0 && (
              <p className="flex gap-2 rounded-md border border-warning p-3 text-sm text-warning">
                <AlertTriangle size={16} className="mt-0.5 shrink-0" aria-hidden />
                Not enough approved questions for the real pattern ({plan.available} of {plan.required}). You can take a partial test;
                its time is scaled down and its score is not comparable with the real exam.
              </p>
            )}
            {plan.available === 0 ? (
              <EmptyState title="No approved or published questions for this test">
                Add questions in the <Link className="text-accent underline" to="/question-bank">question bank</Link>.
              </EmptyState>
            ) : (
              <Button onClick={start} disabled={busy || !!data.active}>
                <Play size={16} aria-hidden /> {plan.partial ? 'Start partial test' : 'Start mock test'}
              </Button>
            )}
          </>
        )}
      </Card>

      <h2 className="mt-8 text-lg font-semibold">Past mock tests</h2>
      {data.history.length === 0 ? (
        <p className="mt-2 text-sm text-muted">No completed mock tests yet.</p>
      ) : (
        <ul className="stagger mt-3 space-y-2">
          {data.history.map((h, i) => (
            <li key={h.id} style={staggerStyle(i)}>
              <Link to={`/mock-tests/run/${h.id}`} className="lift flex flex-wrap items-center justify-between gap-2 glass rounded-lg p-4 text-sm hover:bg-surface-2">
                <span>
                  <strong>{EXAMS.find((e) => e.code === h.examCode)?.name ?? h.examCode}</strong> · {h.paperName}
                  {h.sectionName ? ` · ${h.sectionName}` : ''}
                  {h.partial && <span className="ml-2 text-warning">partial</span>}
                  <span className="block text-xs text-muted">{new Date(h.startedAt).toLocaleString()}</span>
                </span>
                <span className="font-semibold">
                  {h.result!.marks} / {h.result!.maxMarks}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
