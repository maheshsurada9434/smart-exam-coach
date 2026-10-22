import { useEffect, useRef, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ChevronLeft, ChevronRight, Timer } from 'lucide-react'
import { Button, Card, Dialog, EmptyState, Progress, Skeleton, useToast } from '../components/ui'
import QuestionView from '../components/QuestionView'
import QuestionTools from '../components/QuestionTools'
import { describeDbError } from '../db/db'
import { summarize, type Response } from '../practice/engine'
import {
  getSession,
  remainingSec,
  saveAnswer,
  sessionQuestions,
  setIndex,
  startSession,
  submitSession,
  type PracticeSession as Session,
} from '../practice/repo'
import type { Question } from '../questions/schema'

const fmt = (sec: number) => `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`

export default function PracticeSession() {
  const { id = '' } = useParams()
  const session = useLiveQuery(async () => (await getSession(id)) ?? null, [id])
  const questions = useLiveQuery(async () => {
    const s = await getSession(id)
    return s ? sessionQuestions(s) : []
  }, [id, session?.status])

  if (session === undefined || questions === undefined) return <Skeleton className="h-96 w-full" />
  if (session === null)
    return (
      <EmptyState title="Session not found">
        <Link className="text-accent underline" to="/practice">Start a new practice session</Link>
      </EmptyState>
    )
  if (questions.length === 0)
    return (
      <EmptyState title="These questions are no longer in the question bank">
        <Link className="text-accent underline" to="/practice">Start a new practice session</Link>
      </EmptyState>
    )
  if (session.status === 'abandoned')
    return (
      <EmptyState title="This session was abandoned">
        <Link className="text-accent underline" to="/practice">Start a new practice session</Link>
      </EmptyState>
    )
  if (session.status === 'completed') return <Results session={session} questions={questions} />
  return <Runner session={session} questions={questions} />
}

function Runner({ session, questions }: { session: Session; questions: Question[] }) {
  const toast = useToast()
  const timed = session.config.timed
  const index = Math.min(session.currentIndex, questions.length - 1)
  const q = questions[index]!
  const saved = session.answers[q.id]
  const [draft, setDraft] = useState<Response>(saved?.response ?? null)
  const [confirmEnd, setConfirmEnd] = useState(false)
  const shownAt = useRef(Date.now())
  const [left, setLeft] = useState(() => remainingSec(session))
  const submitting = useRef(false)

  useEffect(() => {
    setDraft(session.answers[q.id]?.response ?? null)
    shownAt.current = Date.now()
  }, [q.id]) // eslint-disable-line react-hooks/exhaustive-deps -- reset only when the question changes

  const finish = async () => {
    if (submitting.current) return
    submitting.current = true
    try {
      await submitSession(session.id)
    } catch (e) {
      submitting.current = false
      toast(describeDbError(e))
    }
  }

  useEffect(() => {
    if (!timed) return
    const tick = () => {
      const r = remainingSec(session)
      setLeft(r)
      if (r === 0 && !submitting.current) {
        toast('Time is up. Your answers were submitted.')
        finish()
      }
    }
    tick()
    const t = setInterval(tick, 1000)
    return () => clearInterval(t)
  }, [session.id, timed]) // eslint-disable-line react-hooks/exhaustive-deps -- one timer per session

  const answeredCount = Object.values(session.answers).filter((a) => a.response !== null).length
  const learningLocked = !timed && !!saved
  const go = (i: number) => setIndex(session.id, Math.max(0, Math.min(questions.length - 1, i)))
  const record = (r: Response) => saveAnswer(session.id, q, r, Date.now() - shownAt.current).catch((e) => toast(describeDbError(e)))

  return (
    <section className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">
          Question {index + 1} of {questions.length}
        </h1>
        <div className="flex items-center gap-3">
          {left !== null && (
            <span role="timer" aria-label={`${fmt(left)} left`} className={`inline-flex items-center gap-1 font-mono text-sm font-semibold ${left < 60 ? 'text-danger' : ''}`}>
              <Timer size={16} aria-hidden /> {fmt(left)}
            </span>
          )}
          <Button variant="secondary" onClick={() => setConfirmEnd(true)}>
            {timed ? 'Submit' : 'End session'}
          </Button>
        </div>
      </div>
      <div className="mt-3">
        <Progress value={(answeredCount / questions.length) * 100} label={`${answeredCount} of ${questions.length} answered`} />
      </div>

      {timed && (
        <nav aria-label="Question palette" className="mt-3 flex flex-wrap gap-1.5">
          {questions.map((x, i) => {
            const done = session.answers[x.id]?.response != null
            return (
              <button
                key={x.id}
                type="button"
                onClick={() => go(i)}
                aria-current={i === index ? 'step' : undefined}
                aria-label={`Question ${i + 1}, ${done ? 'answered' : 'not answered'}`}
                className={`h-11 w-11 rounded-md border text-sm font-medium ${i === index ? 'border-accent ring-2 ring-accent' : 'border-border'} ${done ? 'bg-accent text-accent-ink' : 'bg-surface'}`}
              >
                {i + 1}
                {done && <span className="sr-only"> answered</span>}
              </button>
            )
          })}
        </nav>
      )}

      <Card className="mt-4" key={q.id}>
        <p className="mb-3 text-xs text-muted">
          {q.subject} · {q.topic} · {q.difficulty}
        </p>
        <QuestionView
          q={q}
          response={learningLocked ? saved!.response : draft}
          onChange={(r) => {
            setDraft(r) // shown at once; timed answers are also saved immediately
            if (timed) record(r)
          }}
          locked={learningLocked}
          reveal={learningLocked}
          celebrate={!timed}
        />
        {!timed && !learningLocked && (
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={() => record(draft)} disabled={draft === null}>
              Check answer
            </Button>
            {index < questions.length - 1 && (
              <Button variant="ghost" onClick={() => go(index + 1)}>
                Skip
              </Button>
            )}
          </div>
        )}
        <QuestionTools q={q} />
      </Card>

      <div className="mt-4 flex justify-between gap-3">
        <Button variant="secondary" onClick={() => go(index - 1)} disabled={index === 0}>
          <ChevronLeft size={16} aria-hidden /> Previous
        </Button>
        {index < questions.length - 1 ? (
          <Button variant={learningLocked || timed ? 'primary' : 'secondary'} onClick={() => go(index + 1)}>
            Next <ChevronRight size={16} aria-hidden />
          </Button>
        ) : (
          <Button onClick={() => (answeredCount === questions.length ? finish() : setConfirmEnd(true))}>Finish</Button>
        )}
      </div>

      <Dialog open={confirmEnd} onClose={() => setConfirmEnd(false)} title={timed ? 'Submit answers?' : 'End this session?'}>
        <p className="text-sm text-muted">
          You answered {answeredCount} of {questions.length}. {questions.length - answeredCount > 0 ? 'Unanswered questions count as not answered.' : ''}
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmEnd(false)}>
            Keep going
          </Button>
          <Button
            onClick={() => {
              setConfirmEnd(false)
              finish()
            }}
          >
            {timed ? 'Submit' : 'End and see results'}
          </Button>
        </div>
      </Dialog>
    </section>
  )
}

function Results({ session, questions }: { session: Session; questions: Question[] }) {
  const navigate = useNavigate()
  const toast = useToast()
  const r = summarize(questions, session.answers)
  const weakest = [...r.byTopic].filter((t) => t.correct < t.total).sort((a, b) => a.correct / a.total - b.correct / b.total)[0]

  async function again(mode: 'incorrect' | 'topic', topic?: string) {
    const q = questions.find((x) => x.topic === topic)
    const res = await startSession({
      ...session.config,
      mode,
      subject: mode === 'topic' ? q?.subject : undefined,
      topic,
      count: session.config.count,
    })
    if (!res.ok) return toast(res.error)
    navigate(`/practice/session/${res.session.id}`)
  }

  return (
    <section className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-semibold">Practice results</h1>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Correct', `${r.correct} of ${r.total}`],
          ['Incorrect', String(r.incorrect)],
          ['Not answered', String(r.unanswered)],
          ['Accuracy', r.accuracy === null ? '—' : `${Math.round(r.accuracy * 100)}%`],
        ].map(([k, v]) => (
          <Card key={k} className="p-4">
            <p className="text-xs text-muted">{k}</p>
            <p className="mt-1 text-xl font-semibold">{v}</p>
          </Card>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted">
        Accuracy = correct ÷ answered. Time on answered questions: {fmt(Math.round(r.timeMs / 1000))}.
        {r.total < 10 && ' Small sample: treat these numbers as provisional.'}
      </p>

      <Card className="mt-4 overflow-x-auto">
        <h2 className="font-semibold">By topic</h2>
        <table className="mt-2 w-full text-left text-sm">
          <thead className="text-muted">
            <tr>
              <th className="py-1.5 font-medium">Topic</th>
              <th className="py-1.5 font-medium">Correct</th>
            </tr>
          </thead>
          <tbody>
            {r.byTopic.map((t) => (
              <tr key={t.topic} className="border-t border-border">
                <td className="py-1.5">{t.topic}</td>
                <td className="py-1.5">
                  {t.correct} / {t.total}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="mt-4 flex flex-wrap gap-3">
        {r.incorrect > 0 && <Button onClick={() => again('incorrect')}>Retry questions I got wrong</Button>}
        {weakest && (
          <Button variant="secondary" onClick={() => again('topic', weakest.topic)}>
            More practice: {weakest.topic}
          </Button>
        )}
        <Link to="/practice" className="inline-flex min-h-11 items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-surface-2">
          New practice
        </Link>
      </div>

      <h2 className="mt-8 text-lg font-semibold">Review</h2>
      <ol className="mt-3 space-y-4">
        {questions.map((q, i) => (
          <li key={q.id}>
            <Card>
              <p className="mb-2 text-xs text-muted">
                Question {i + 1} · {q.topic}
              </p>
              <QuestionView q={q} response={session.answers[q.id]?.response ?? null} locked reveal />
              <QuestionTools q={q} />
            </Card>
          </li>
        ))}
      </ol>
    </section>
  )
}
