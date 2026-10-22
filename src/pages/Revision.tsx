import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Repeat } from 'lucide-react'
import { Button, Card, EmptyState, Progress, Skeleton, useToast } from '../components/ui'
import QuestionView from '../components/QuestionView'
import { describeDbError } from '../db/db'
import { loadQuestions } from '../questions/repo'
import { correctAnswerLabel, type Question } from '../questions/schema'
import { isCorrect, type Response } from '../practice/engine'
import { addDays, localDate } from '../learning/dates'
import { GRADES } from '../learning/sm2'
import ContentItemView from '../components/ContentItemView'
import { loadContent, quizOptions } from '../content/repo'
import type { ContentItem } from '../content/schema'
import { seededRng } from '../practice/engine'
import { dueItems, removeItem, reviewItem, revisionCounts, revisionItems, syncQuestionItems, type RevisionItem } from '../learning/repo'

type Mode = 'mcq' | 'flashcard'
type Done = { item: RevisionItem; quality: number; nextDue: string }

export default function Revision() {
  const today = localDate()
  const [synced, setSynced] = useState(false)
  const [queue, setQueue] = useState<RevisionItem[] | null>(null)
  const [mode, setMode] = useState<Mode>('mcq')
  const [done, setDone] = useState<Done[]>([])

  useEffect(() => {
    syncQuestionItems(today).finally(() => setSynced(true))
  }, [today])

  const counts = useLiveQuery(() => revisionCounts(today), [today, synced])
  const upcoming = useLiveQuery(async () => {
    const items = await revisionItems()
    return Array.from({ length: 7 }, (_, i) => {
      const d = addDays(today, i + 1)
      return { d, n: items.filter((x) => x.due === d).length }
    })
  }, [today, synced])
  const questions = useLiveQuery(async () => new Map((await loadQuestions()).questions.map((q) => [q.id, q])))
  const cards = useLiveQuery(async () => (await loadContent()).items)

  if (!synced || !counts || !upcoming || !questions || !cards) return <Skeleton className="h-96 w-full" />

  if (queue) {
    const item = queue[0]
    if (!item) return <Summary done={done} onBack={() => (setQueue(null), setDone([]))} />
    const common = {
      key: item.id,
      item,
      mode,
      position: done.length + 1,
      total: done.length + queue.length,
      onGraded: (d: Done) => {
        setDone((x) => [...x, d])
        setQueue((x) => x!.slice(1))
      },
      onRemoved: () => setQueue((x) => x!.slice(1)),
    }
    if (item.kind === 'card') {
      const { key, ...rest } = common
      return <CardReview key={key} {...rest} card={cards.find((c) => c.id === item.refId)} pool={cards} />
    }
    return (
      <ReviewCard
        key={item.id}
        item={item}
        q={item.kind === 'question' ? questions.get(item.refId) : undefined}
        mode={mode}
        position={done.length + 1}
        total={done.length + queue.length}
        onGraded={(d) => {
          setDone((x) => [...x, d])
          setQueue((x) => x!.slice(1))
        }}
        onRemoved={() => setQueue((x) => x!.slice(1))}
      />
    )
  }

  const due = counts.overdue + counts.today
  return (
    <section className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Revision</h1>
      <p className="mt-1 text-sm text-muted">
        Spaced repetition (SM-2). Questions you got wrong and your bookmarks are added automatically. An item only moves to a longer
        interval when you recall it, never just by opening it.
      </p>
      <p className="mt-1 text-sm">
        <Link className="text-accent underline" to="/content">
          Vocabulary, idioms, Polity and current affairs →
        </Link>
      </p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          ['Overdue', counts.overdue],
          ['Due today', counts.today],
          ['Upcoming', counts.upcoming],
        ].map(([k, v]) => (
          <Card key={k} className="p-4">
            <p className="text-xs text-muted">{k}</p>
            <p className="mt-1 text-xl font-semibold">{v}</p>
          </Card>
        ))}
      </div>

      {counts.total === 0 ? (
        <div className="mt-4">
          <EmptyState icon={<Repeat size={28} aria-hidden />} title="Nothing to revise yet">
            Practise some questions or bookmark them, or add study content; they appear here for review.{' '}
            <Link className="text-accent underline" to="/practice">Go to practice</Link>
          </EmptyState>
        </div>
      ) : (
        <Card className="mt-4 space-y-4">
          <fieldset>
            <legend className="text-sm font-medium">Review style</legend>
            <div className="mt-2 flex flex-wrap gap-2">
              {(
                [
                  ['mcq', 'Multiple-choice recall'],
                  ['flashcard', 'Flashcards'],
                ] as const
              ).map(([m, label]) => (
                <label key={m} className={`flex min-h-11 cursor-pointer items-center gap-2 rounded-md border px-3 text-sm ${mode === m ? 'border-accent bg-accent-soft' : 'border-border'}`}>
                  <input type="radio" name="mode" checked={mode === m} onChange={() => setMode(m)} /> {label}
                </label>
              ))}
            </div>
          </fieldset>
          <Button
            disabled={due === 0}
            onClick={async () => {
              setDone([])
              setQueue(await dueItems(today))
            }}
          >
            {due ? `Start review (${due})` : 'Nothing due today'}
          </Button>
        </Card>
      )}

      <Card className="mt-4">
        <h2 className="font-semibold">Next 7 days</h2>
        <ul className="mt-2 grid grid-cols-7 gap-1 text-center text-xs">
          {upcoming.map(({ d, n }) => (
            <li key={d} className="rounded-md bg-surface-2 p-2">
              <span className="block text-muted">{d.slice(5)}</span>
              <span className="text-base font-semibold">{n}</span>
            </li>
          ))}
        </ul>
      </Card>
    </section>
  )
}

function ReviewCard({
  item,
  q,
  mode,
  position,
  total,
  onGraded,
  onRemoved,
}: {
  item: RevisionItem
  q: Question | undefined
  mode: Mode
  position: number
  total: number
  onGraded: (d: Done) => void
  onRemoved: () => void
}) {
  const toast = useToast()
  const [response, setResponse] = useState<Response>(null)
  const [revealed, setRevealed] = useState(false)

  const grade = async (quality: number) => {
    try {
      const next = await reviewItem(item.id, quality)
      if (next) onGraded({ item, quality, nextDue: next.due })
    } catch (e) {
      toast(describeDbError(e))
    }
  }

  if (!q)
    return (
      <Card className="mx-auto max-w-3xl">
        <p className="text-sm">This question is no longer in the question bank.</p>
        <Button className="mt-3" variant="secondary" onClick={() => removeItem(item.id).then(onRemoved)}>
          Remove from revision
        </Button>
      </Card>
    )

  const correct = isCorrect(q, response)
  const flash = mode === 'flashcard'
  return (
    <section className="mx-auto max-w-3xl">
      <p className="text-sm text-muted">
        Item {position} of {total} · {item.reason} · {q.topic}
      </p>
      <div className="mt-2">
        <Progress value={((position - 1) / total) * 100} label={`Reviewed ${position - 1} of ${total}`} />
      </div>
      <Card className="mt-4">
        {flash && !revealed ? (
          <p className="whitespace-pre-line text-base font-medium">{q.text}</p>
        ) : flash ? (
          <>
            <p className="whitespace-pre-line text-base font-medium">{q.text}</p>
            <p className="mt-3 rounded-md bg-surface-2 p-3 text-sm">
              <strong>Answer:</strong> {correctAnswerLabel(q)}
            </p>
            {q.explanation && <p className="mt-2 text-sm">{q.explanation}</p>}
          </>
        ) : (
          <QuestionView q={q} response={response} onChange={setResponse} locked={revealed} reveal={revealed} celebrate />
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {!revealed ? (
            <Button onClick={() => setRevealed(true)} disabled={!flash && response === null}>
              {flash ? 'Show answer' : 'Check answer'}
            </Button>
          ) : !flash && !correct ? (
            <Button onClick={() => grade(1)}>Next (review again tomorrow)</Button>
          ) : (
            GRADES.filter((g) => flash || g.quality >= 3).map((g) => (
              <Button key={g.label} variant={g.quality === 4 ? 'primary' : 'secondary'} onClick={() => grade(g.quality)}>
                {g.label}
                <span className="text-xs opacity-80">· {g.hint}</span>
              </Button>
            ))
          )}
        </div>
      </Card>
    </section>
  )
}

function Summary({ done, onBack }: { done: Done[]; onBack: () => void }) {
  const remembered = done.filter((d) => d.quality >= 3).length
  const next = [...done].sort((a, b) => (a.nextDue < b.nextDue ? -1 : 1))[0]
  return (
    <section className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Review finished</h1>
      <Card className="mt-4">
        <p>Reviewed {done.length}</p>
        <p className="mt-1 text-sm text-muted">
          Remembered {remembered} · forgot {done.length - remembered}
          {next && ` · next item due ${next.nextDue}`}
        </p>
        <Button className="mt-4" onClick={onBack}>
          Back to revision
        </Button>
      </Card>
    </section>
  )
}

type CardProps = {
  item: RevisionItem
  card: ContentItem | undefined
  pool: ContentItem[]
  mode: Mode
  position: number
  total: number
  onGraded: (d: Done) => void
  onRemoved: () => void
}

/** Content cards: flashcard (self-graded) or multiple choice built from other stored answers of the same kind. */
function CardReview({ item, card, pool, mode, position, total, onGraded, onRemoved }: CardProps) {
  const toast = useToast()
  const [picked, setPicked] = useState<string | null>(null)
  const [revealed, setRevealed] = useState(false)
  const options = card && mode === 'mcq' ? quizOptions(card, pool, seededRng(position * 7919 + item.id.length)) : null

  const grade = async (quality: number) => {
    try {
      const next = await reviewItem(item.id, quality)
      if (next) onGraded({ item, quality, nextDue: next.due })
    } catch (e) {
      toast(describeDbError(e))
    }
  }

  if (!card)
    return (
      <Card className="mx-auto max-w-3xl">
        <p className="text-sm">This study item is no longer stored.</p>
        <Button className="mt-3" variant="secondary" onClick={() => removeItem(item.id).then(onRemoved)}>
          Remove from revision
        </Button>
      </Card>
    )

  const right = picked === card.back
  return (
    <section className="mx-auto max-w-3xl">
      <p className="text-sm text-muted">
        Item {position} of {total} · {item.reason}
      </p>
      <div className="mt-2">
        <Progress value={((position - 1) / total) * 100} label={`Reviewed ${position - 1} of ${total}`} />
      </div>
      <Card className="mt-4">
        {!revealed ? (
          <p className="text-base font-semibold">{card.kind === 'ows' ? `One word for: ${card.front}` : card.front}</p>
        ) : (
          <ContentItemView c={card} />
        )}
        {options && !revealed && (
          <div className="mt-3 space-y-2">
            {options.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setPicked(o)}
                aria-pressed={picked === o}
                className={`flex min-h-11 w-full items-center rounded-md border px-3 text-left text-sm ${picked === o ? 'border-accent bg-accent-soft' : 'border-border'}`}
              >
                {o}
              </button>
            ))}
          </div>
        )}
        {revealed && options && (
          <p className={`mt-3 text-sm font-semibold ${right ? 'text-success' : 'text-danger'}`} role="status">
            {right ? 'Correct' : `Incorrect. You chose: ${picked}`}
          </p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          {!revealed ? (
            <Button onClick={() => setRevealed(true)} disabled={!!options && picked === null}>
              {options ? 'Check answer' : 'Show answer'}
            </Button>
          ) : options && !right ? (
            <Button onClick={() => grade(1)}>Next (review again tomorrow)</Button>
          ) : (
            GRADES.filter((g) => !options || g.quality >= 3).map((g) => (
              <Button key={g.label} variant={g.quality === 4 ? 'primary' : 'secondary'} onClick={() => grade(g.quality)}>
                {g.label}
                <span className="text-xs opacity-80">· {g.hint}</span>
              </Button>
            ))
          )}
        </div>
      </Card>
    </section>
  )
}
