import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Button, Dialog, useToast } from './ui'
import { describeDbError } from '../db/db'
import { saveQuestionEdit, versionHistory } from '../questions/repo'
import { DIFFICULTIES, OPTION_LETTERS, allowedStatuses, type Question } from '../questions/schema'

const field = 'mt-1 block min-h-11 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm'

export default function QuestionEditDialog({ question, onClose }: { question: Question; onClose: () => void }) {
  const toast = useToast()
  const [q, setQ] = useState<Question>(question)
  const [errors, setErrors] = useState<string[]>([])
  const history = useLiveQuery(() => versionHistory(question.id), [question.id])
  const set = (patch: Partial<Question>) => setQ((cur) => ({ ...cur, ...patch }) as Question)

  async function save() {
    try {
      const r = await saveQuestionEdit(q)
      if (!r.ok) return setErrors(r.errors)
      toast(r.demoted ? 'Saved. Answer key changed, so status went back to "reviewed".' : 'Question saved')
      onClose()
    } catch (e) {
      setErrors([describeDbError(e)])
    }
  }

  return (
    <Dialog open onClose={onClose} title={`Edit ${question.id} (v${question.version})`}>
      <div className="max-h-[70dvh] space-y-4 overflow-y-auto pr-1">
        {errors.length > 0 && (
          <ul role="alert" className="rounded-md border border-danger p-3 text-sm text-danger">
            {errors.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
        <label className="block text-sm font-medium">
          Question
          <textarea className={field} rows={3} value={q.text} onChange={(e) => set({ text: e.target.value })} />
        </label>

        {q.type === 'mcq' ? (
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Options (select the correct one)</legend>
            {q.options.map((o, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="radio"
                  name="correct"
                  aria-label={`Option ${OPTION_LETTERS[i]} is correct`}
                  checked={q.correctOption === i}
                  onChange={() => set({ correctOption: i })}
                  className="h-5 w-5"
                />
                <span className="w-4 text-sm font-medium">{OPTION_LETTERS[i]}</span>
                <input
                  className={field + ' mt-0'}
                  aria-label={`Option ${OPTION_LETTERS[i]}`}
                  value={o}
                  onChange={(e) => set({ options: q.options.map((x, j) => (j === i ? e.target.value : x)) })}
                />
              </div>
            ))}
          </fieldset>
        ) : (
          <label className="block text-sm font-medium">
            Correct value
            <input
              type="number"
              className={field}
              value={Number.isFinite(q.correctValue) ? q.correctValue : ''}
              onChange={(e) => set({ correctValue: e.target.value === '' ? NaN : Number(e.target.value) })}
            />
          </label>
        )}

        <label className="block text-sm font-medium">
          Explanation
          <textarea className={field} rows={3} value={q.explanation} onChange={(e) => set({ explanation: e.target.value })} />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Status
            <select className={field} value={q.status} onChange={(e) => set({ status: e.target.value as Question['status'] })}>
              {allowedStatuses(question.status).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Difficulty
            <select className={field} value={q.difficulty} onChange={(e) => set({ difficulty: e.target.value as Question['difficulty'] })}>
              {DIFFICULTIES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </label>
        </div>

        {history && history.length > 0 && (
          <details className="text-sm">
            <summary className="cursor-pointer font-medium">Version history ({history.length})</summary>
            <ul className="mt-2 space-y-1 text-muted">
              {history.map((h) => (
                <li key={h.id}>
                  v{String(h.version)} · saved over on {new Date(String(h.savedAt)).toLocaleString()} · was{' '}
                  {String((h.snapshot as { status?: string })?.status ?? '?')}
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
      <div className="mt-5 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button onClick={save}>Save new version</Button>
      </div>
    </Dialog>
  )
}
