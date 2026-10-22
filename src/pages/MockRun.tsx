import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useParams } from 'react-router-dom'
import { Bookmark, Check, ChevronLeft, Timer } from 'lucide-react'
import { Button, Card, Dialog, EmptyState, Skeleton, useToast } from '../components/ui'
import QuestionView from '../components/QuestionView'
import QuestionTools from '../components/QuestionTools'
import { EXAMS } from '../data/exams'
import { describeDbError } from '../db/db'
import { STATE_LABELS, questionState, secondsLeft, type QState } from '../mock/engine'
import { allIds, getMock, mockQuestions, saveMockAnswer, submitMock, updateMockNav, type MockSession } from '../mock/repo'
import type { Response } from '../practice/engine'
import type { Question } from '../questions/schema'

const fmt = (sec: number) =>
  `${Math.floor(sec / 3600) ? `${Math.floor(sec / 3600)}:` : ''}${String(Math.floor((sec % 3600) / 60)).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`

export default function MockRun() {
  const { id = '' } = useParams()
  const session = useLiveQuery(async () => (await getMock(id)) ?? null, [id])
  const questions = useLiveQuery(async () => {
    const s = await getMock(id)
    return s ? mockQuestions(s) : []
  }, [id, session?.status])

  if (session === undefined || questions === undefined) return <Skeleton className="h-96 w-full" />
  if (session === null || questions.length === 0)
    return (
      <EmptyState title="Mock test not found">
        <Link className="text-accent underline" to="/mock-tests">Back to mock tests</Link>
      </EmptyState>
    )
  return session.status === 'completed' ? <MockResult s={session} questions={questions} /> : <ExamScreen s={session} questions={questions} />
}

const stateStyle: Record<QState, string> = {
  'not-visited': 'bg-surface border-border',
  'not-answered': 'bg-surface border-danger',
  answered: 'bg-success text-bg border-success',
  marked: 'bg-surface border-warning',
  'answered-marked': 'bg-success text-bg border-warning ring-2 ring-warning',
}
const StateGlyph = ({ st }: { st: QState }) =>
  st === 'answered' || st === 'answered-marked' ? <Check size={12} aria-hidden /> : st === 'marked' ? <Bookmark size={12} aria-hidden /> : null

function ExamScreen({ s, questions }: { s: MockSession; questions: Question[] }) {
  const toast = useToast()
  const index = Math.min(s.currentIndex, questions.length - 1)
  const q = questions[index]!
  const [left, setLeft] = useState(() => secondsLeft(s.startedAt, s.durationSec))
  const [confirm, setConfirm] = useState(false)
  const shownAt = useRef(Date.now())
  const submitting = useRef(false)
  const examName = EXAMS.find((e) => e.code === s.examCode)?.name ?? s.examCode

  const submit = async (reason: 'manual' | 'timeout') => {
    if (submitting.current) return
    submitting.current = true
    try {
      await submitMock(s.id, reason)
      if (reason === 'timeout') toast('Time is up. The test was submitted automatically.')
    } catch (e) {
      submitting.current = false
      toast(describeDbError(e))
    }
  }

  // Clock is derived from the stored start time, so refreshing or leaving the page does not pause it.
  useEffect(() => {
    const tick = () => {
      const l = secondsLeft(s.startedAt, s.durationSec)
      setLeft(l)
      if (l === 0) submit('timeout')
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [s.id]) // eslint-disable-line react-hooks/exhaustive-deps -- one clock per test

  useEffect(() => {
    shownAt.current = Date.now()
    updateMockNav(s.id, { visitedId: q.id })
  }, [s.id, q.id])

  const spent = () => {
    const ms = Date.now() - shownAt.current
    shownAt.current = Date.now()
    return ms
  }
  // Show the choice at once; the stored answer catches up a moment later. A rejected save is rolled back.
  const [shown, setShown] = useState<Record<string, Response>>({})
  const responseOf = (id: string): Response => (id in shown ? (shown[id] as Response) : (s.answers[id]?.response ?? null))
  const forget = (id: string) =>
    setShown((x) => {
      const copy = { ...x }
      delete copy[id]
      return copy
    })
  const answer = (r: Response) => {
    const id = q.id
    setShown((x) => ({ ...x, [id]: r }))
    saveMockAnswer(s.id, id, r, spent()).then(
      (ok) => {
        if (ok) return
        forget(id)
        toast('This test has ended; the answer was not saved.')
      },
      (e) => {
        forget(id)
        toast(describeDbError(e))
      },
    )
  }
  const go = (i: number) => updateMockNav(s.id, { currentIndex: Math.max(0, Math.min(questions.length - 1, i)) })
  const response = responseOf(q.id)
  const ids = allIds(s)
  const states = questions.map((x) => questionState(responseOf(x.id) !== null, !!s.visited[x.id], !!s.marked[x.id]))
  const count = (st: QState) => states.filter((x) => x === st).length
  const answered = count('answered') + count('answered-marked')
  const sectionOf = (qid: string) => s.sections.find((x) => x.questionIds.includes(qid))

  return (
    <section className="mx-auto max-w-5xl">
      <header className="sticky top-14 z-nav -mx-4 flex flex-wrap items-center justify-between gap-2 border-b border-border bg-bg px-4 py-2 md:top-0">
        <div className="min-w-0 text-sm">
          <p className="truncate font-semibold">
            {examName} · {s.paperName}
            {s.sectionName ? ` · ${s.sectionName}` : ''}
          </p>
          {s.partial && <p className="text-xs text-warning">Partial test ({s.available} of {s.required} questions)</p>}
        </div>
        <span role="timer" aria-label={`Time left ${fmt(left)}`} className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-mono text-base font-semibold ${left < 300 ? 'border-danger text-danger' : 'border-border'}`}>
          <Timer size={16} aria-hidden /> {fmt(left)}
        </span>
      </header>

      {s.sections.length > 1 && (
        <nav aria-label="Sections" className="mt-3 flex gap-2 overflow-x-auto">
          {s.sections.map((sec) => {
            const first = ids.indexOf(sec.questionIds[0] ?? '')
            const active = sectionOf(q.id)?.name === sec.name
            return (
              <button
                key={sec.name}
                type="button"
                disabled={first < 0}
                onClick={() => go(first)}
                aria-current={active ? 'true' : undefined}
                className={`min-h-11 shrink-0 rounded-md border px-3 text-sm ${active ? 'border-accent bg-accent-soft text-accent' : 'border-border bg-surface'}`}
              >
                {sec.name}
              </button>
            )
          })}
        </nav>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_280px]">
        <Card>
          <p className="mb-3 text-xs text-muted">
            Question {index + 1} of {questions.length} · {sectionOf(q.id)?.name} · +{sectionOf(q.id)?.marksPerCorrect}
            {sectionOf(q.id)?.negativePerWrong ? ` / −${sectionOf(q.id)?.negativePerWrong}` : ''}
          </p>
          <QuestionView q={q} response={response} onChange={answer} />
          <div className="mt-5 flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => go(index - 1)} disabled={index === 0}>
              <ChevronLeft size={16} aria-hidden /> Previous
            </Button>
            <Button variant="ghost" onClick={() => answer(null)} disabled={response === null}>
              Clear response
            </Button>
            <Button
              variant="secondary"
              onClick={async () => {
                await updateMockNav(s.id, { marked: [q.id, !s.marked[q.id]] })
                if (!s.marked[q.id]) go(index + 1)
              }}
            >
              {s.marked[q.id] ? 'Unmark review' : 'Mark for review & next'}
            </Button>
            <Button onClick={() => (index < questions.length - 1 ? go(index + 1) : setConfirm(true))}>
              {index < questions.length - 1 ? 'Save & next' : 'Save & submit'}
            </Button>
          </div>
        </Card>

        <aside aria-label="Question palette">
          <Card className="p-4">
            <div className="grid grid-cols-6 gap-1.5 lg:grid-cols-5">
              {questions.map((x, i) => (
                <button
                  key={x.id}
                  type="button"
                  onClick={() => go(i)}
                  aria-current={i === index ? 'step' : undefined}
                  aria-label={`Question ${i + 1}: ${STATE_LABELS[states[i]!]}`}
                  className={`relative flex h-11 items-center justify-center gap-0.5 rounded-md border text-sm font-medium ${stateStyle[states[i]!]} ${i === index ? 'outline outline-2 outline-offset-1 outline-ink' : ''}`}
                >
                  {i + 1}
                  <StateGlyph st={states[i]!} />
                </button>
              ))}
            </div>
            <ul className="mt-4 space-y-1 text-xs">
              {(Object.keys(STATE_LABELS) as QState[]).map((st) => (
                <li key={st} className="flex items-center gap-2">
                  <span className={`inline-flex h-5 w-5 items-center justify-center rounded border ${stateStyle[st]}`}>
                    <StateGlyph st={st} />
                  </span>
                  {STATE_LABELS[st]}: {count(st)}
                </li>
              ))}
            </ul>
            <Button className="mt-4 w-full" onClick={() => setConfirm(true)}>
              Submit test
            </Button>
          </Card>
        </aside>
      </div>

      <Dialog open={confirm} onClose={() => setConfirm(false)} title="Submit the test?">
        <ul className="text-sm">
          <li>Answered: {answered}</li>
          <li>Not answered: {questions.length - answered}</li>
          <li>Marked for review: {count('marked') + count('answered-marked')}</li>
        </ul>
        <p className="mt-2 text-sm text-muted">You cannot change answers after submitting.</p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirm(false)}>
            Back to test
          </Button>
          <Button
            onClick={() => {
              setConfirm(false)
              submit('manual')
            }}
          >
            Submit
          </Button>
        </div>
      </Dialog>
    </section>
  )
}

function MockResult({ s, questions }: { s: MockSession; questions: Question[] }) {
  const r = s.result!
  const answered = r.correct + r.incorrect
  const timeUsed = Math.min(s.durationSec, Math.round((Date.parse(s.submittedAt ?? s.startedAt) - Date.parse(s.startedAt)) / 1000))
  const byTopic = new Map<string, { total: number; correct: number }>()
  for (const q of questions) {
    const t = byTopic.get(q.topic) ?? { total: 0, correct: 0 }
    t.total++
    if (r.outcomes[q.id] === 'correct') t.correct++
    byTopic.set(q.topic, t)
  }

  return (
    <section className="mx-auto max-w-4xl">
      <h1 className="text-2xl font-semibold">Mock test result</h1>
      <p className="mt-1 text-sm text-muted">
        {EXAMS.find((e) => e.code === s.examCode)?.name} · {s.paperName}
        {s.sectionName ? ` · ${s.sectionName}` : ''} · {new Date(s.startedAt).toLocaleString()}
        {s.submitReason === 'timeout' && ' · submitted automatically when time ran out'}
      </p>
      {s.partial && (
        <p className="mt-2 text-sm text-warning">
          Partial test ({s.available} of {s.required} questions): not comparable with a real exam score.
        </p>
      )}

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Score', `${r.marks} / ${r.maxMarks}`],
          ['Score %', r.maxMarks ? `${Math.round((r.marks / r.maxMarks) * 1000) / 10}%` : '—'],
          ['Accuracy', answered ? `${Math.round((r.correct / answered) * 100)}%` : '—'],
          ['Time used', fmt(timeUsed)],
        ].map(([k, v]) => (
          <Card key={k} className="p-4">
            <p className="text-xs text-muted">{k}</p>
            <p className="mt-1 text-xl font-semibold">{v}</p>
          </Card>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">
        Score = correct × marks − wrong × negative marks (raw marks, not normalised). Score % = score ÷ maximum marks. Accuracy =
        correct ÷ answered. No rank or percentile is shown because there is no comparison group. The score was frozen when the test
        was submitted.
      </p>

      <Card className="mt-4 overflow-x-auto">
        <h2 className="font-semibold">By section</h2>
        <table className="mt-2 w-full min-w-[520px] text-left text-sm">
          <thead className="text-muted">
            <tr>
              {['Section', 'Questions', 'Correct', 'Wrong', 'Not answered', 'Marks'].map((h) => (
                <th key={h} className="py-1.5 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {r.sections.map((x) => (
              <tr key={x.name} className="border-t border-border">
                <td className="py-1.5">{x.name}</td>
                <td className="py-1.5">{x.total}</td>
                <td className="py-1.5">{x.correct}</td>
                <td className="py-1.5">{x.incorrect}</td>
                <td className="py-1.5">{x.unanswered}</td>
                <td className="py-1.5 font-medium">
                  {x.marks} / {x.maxMarks}
                </td>
              </tr>
            ))}
            <tr className="border-t-2 border-border font-semibold">
              <td className="py-1.5">Total</td>
              <td className="py-1.5">{r.total}</td>
              <td className="py-1.5">{r.correct}</td>
              <td className="py-1.5">{r.incorrect}</td>
              <td className="py-1.5">{r.unanswered}</td>
              <td className="py-1.5">
                {r.marks} / {r.maxMarks}
              </td>
            </tr>
          </tbody>
        </table>
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold">By topic</h2>
        <ul className="mt-2 grid gap-x-6 text-sm sm:grid-cols-2">
          {[...byTopic].map(([t, v]) => (
            <li key={t} className="flex justify-between border-t border-border py-1.5">
              <span>{t}</span>
              <span>
                {v.correct} / {v.total}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      <div className="mt-4">
        <Link to="/mock-tests" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-surface-2">
          Back to mock tests
        </Link>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Review answers</h2>
      <ol className="mt-3 space-y-4">
        {questions.map((q, i) => (
          <li key={q.id}>
            <Card>
              <p className="mb-2 text-xs text-muted">Question {i + 1} · {q.topic}</p>
              <QuestionView q={q} response={s.answers[q.id]?.response ?? null} locked reveal />
              <QuestionTools q={q} />
            </Card>
          </li>
        ))}
      </ol>
    </section>
  )
}
