import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { Bookmark } from 'lucide-react'
import { Button, Card, EmptyState, Skeleton } from '../components/ui'
import { db } from '../db/db'
import { loadQuestions } from '../questions/repo'
import { correctAnswerLabel } from '../questions/schema'
import { toggleBookmark } from '../practice/repo'

export default function Bookmarks() {
  const data = useLiveQuery(async () => {
    const marks = await db.bookmarks.orderBy('createdAt').reverse().toArray()
    const byId = new Map((await loadQuestions()).questions.map((q) => [q.id, q]))
    return marks.map((m) => ({ id: m.id, q: byId.get(m.id) }))
  })

  return (
    <section className="max-w-3xl">
      <h1 className="text-2xl font-semibold">Question bookmarks</h1>
      {!data ? (
        <Skeleton className="mt-4 h-40 w-full" />
      ) : data.length === 0 ? (
        <div className="mt-4">
          <EmptyState icon={<Bookmark size={28} aria-hidden />} title="No bookmarks yet">
            Use the Bookmark button on any question while practising.
          </EmptyState>
        </div>
      ) : (
        <>
          <Link
            to="/practice?mode=bookmarked"
            className="mt-4 inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-ink"
          >
            Practise bookmarked questions
          </Link>
          <ul className="mt-4 space-y-2">
            {data.map(({ id, q }) => (
              <li key={id}>
                <Card className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0 text-sm">
                    {q ? (
                      <>
                        <p className="text-xs text-muted">
                          {q.subject} · {q.topic}
                        </p>
                        <p className="mt-1">{q.text}</p>
                        <p className="mt-1 text-xs text-muted">Answer: {correctAnswerLabel(q)}</p>
                      </>
                    ) : (
                      <p className="text-muted">Question {id} is no longer in the question bank.</p>
                    )}
                  </div>
                  <Button variant="ghost" onClick={() => toggleBookmark(id)}>
                    Remove
                  </Button>
                </Card>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
