import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Bookmark, BookmarkCheck, Flag } from 'lucide-react'
import { Button, Dialog, useToast } from './ui'
import { db, describeDbError } from '../db/db'
import { REPORT_REASONS, getNote, reportError, saveNote, toggleBookmark } from '../practice/repo'
import type { Question } from '../questions/schema'

const field = 'mt-1 block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm'

/** Bookmark, private note and "report a problem" for one question. */
export default function QuestionTools({ q }: { q: Question }) {
  const toast = useToast()
  const bookmarked = useLiveQuery(async () => !!(await db.bookmarks.get(q.id)), [q.id])
  const [note, setNote] = useState('')
  const [reporting, setReporting] = useState(false)
  const [reason, setReason] = useState<string>(REPORT_REASONS[0])
  const [details, setDetails] = useState('')

  useEffect(() => {
    let live = true
    getNote(q.id).then((n) => live && setNote(n))
    return () => {
      live = false
    }
  }, [q.id])

  const safe = (fn: () => Promise<unknown>, ok: string) => fn().then(() => toast(ok), (e) => toast(describeDbError(e)))

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          aria-pressed={!!bookmarked}
          onClick={() => safe(() => toggleBookmark(q.id), bookmarked ? 'Bookmark removed' : 'Bookmarked')}
        >
          {bookmarked ? <BookmarkCheck size={16} aria-hidden /> : <Bookmark size={16} aria-hidden />}
          {bookmarked ? 'Bookmarked' : 'Bookmark'}
        </Button>
        <Button variant="ghost" onClick={() => setReporting(true)}>
          <Flag size={16} aria-hidden /> Report a problem
        </Button>
      </div>
      <details className="mt-3 text-sm">
        <summary className="cursor-pointer font-medium">My note</summary>
        <label className="mt-2 block">
          <span className="sr-only">Private note for this question</span>
          <textarea className={field} rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Only you can see this note." />
        </label>
        <Button variant="secondary" className="mt-2" onClick={() => safe(() => saveNote(q.id, note), 'Note saved')}>
          Save note
        </Button>
      </details>

      <Dialog open={reporting} onClose={() => setReporting(false)} title="Report a problem">
        <label className="block text-sm font-medium">
          What is wrong?
          <select className={field + ' min-h-11'} value={reason} onChange={(e) => setReason(e.target.value)}>
            {REPORT_REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
        </label>
        <label className="mt-4 block text-sm font-medium">
          Details (optional)
          <textarea className={field} rows={3} value={details} onChange={(e) => setDetails(e.target.value)} />
        </label>
        <p className="mt-2 text-xs text-muted">The report is saved in this browser for whoever reviews the question bank here.</p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setReporting(false)}>
            Cancel
          </Button>
          <Button
            onClick={() =>
              safe(() => reportError(q.id, reason, details, q.version), 'Report saved').then(() => {
                setReporting(false)
                setDetails('')
              })
            }
          >
            Send report
          </Button>
        </div>
      </Dialog>
    </div>
  )
}
