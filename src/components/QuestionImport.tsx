import { useState, type ChangeEvent } from 'react'
import { Upload } from 'lucide-react'
import { Button, Card, useToast } from './ui'
import { describeDbError } from '../db/db'
import { buildPreview, commitImport, type ImportMode, type ImportPreview } from '../questions/repo'

const MAX_BYTES = 10 * 1024 * 1024

export default function QuestionImport() {
  const toast = useToast()
  const [preview, setPreview] = useState<ImportPreview | null>(null)
  const [mode, setMode] = useState<ImportMode>('skip-existing')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  async function pick(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    setMessage('')
    if (!f) return
    if (f.size > MAX_BYTES) return setMessage('File is larger than 10 MB. Split it into smaller files.')
    setBusy(true)
    try {
      setPreview(await buildPreview(f.name, await f.text()))
    } catch (err) {
      setMessage(describeDbError(err))
    } finally {
      setBusy(false)
    }
  }

  async function confirm() {
    if (!preview) return
    setBusy(true)
    try {
      const r = await commitImport(preview, mode)
      setPreview(null)
      const text = `Imported ${r.added} new, updated ${r.updated}, skipped ${r.skipped} existing, rejected ${r.rejected}.`
      setMessage(text)
      toast('Import finished')
    } catch (err) {
      setMessage(`${describeDbError(err)} No questions were imported.`)
    } finally {
      setBusy(false)
    }
  }

  const rows = preview?.rows ?? []
  const count = (k: string) => rows.filter((r) => r.kind === k).length
  const fresh = count('new')
  const existing = count('existing')
  const errors = count('error')
  const toImport = fresh + (mode === 'update-existing' ? existing : 0)
  const problems = rows.filter((r) => r.errors.length || r.warnings.length)

  return (
    <Card>
      <h2 className="font-semibold">Import questions</h2>
      <p className="mt-1 text-sm text-muted">
        CSV or JSON. Nothing is saved until you confirm.{' '}
        <a className="text-accent underline" href={`${import.meta.env.BASE_URL}templates/questions-template.csv`} download>
          Download CSV template
        </a>
      </p>
      <label className="mt-4 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-2 focus-within:outline focus-within:outline-2 focus-within:outline-accent">
        <Upload size={16} aria-hidden /> {busy ? 'Working…' : 'Choose file'}
        <input type="file" accept=".csv,text/csv,.json,application/json" className="sr-only" onChange={pick} disabled={busy} />
      </label>

      {message && (
        <p role="status" className="mt-4 text-sm">
          {message}
        </p>
      )}

      {preview && (
        <div className="mt-4 rounded-md border border-border p-4">
          <p className="text-sm font-medium">{preview.fileName}</p>
          {preview.fileErrors.map((e) => (
            <p key={e} role="alert" className="mt-2 text-sm text-danger">
              {e}
            </p>
          ))}
          {preview.fileWarnings.map((w) => (
            <p key={w} className="mt-2 text-sm text-warning">
              {w}
            </p>
          ))}
          {preview.fileErrors.length === 0 && (
            <>
              <ul className="mt-2 flex flex-wrap gap-x-6 text-sm">
                <li>Rows: {rows.length}</li>
                <li>New: {fresh}</li>
                <li>Already stored: {existing}</li>
                <li className={errors ? 'text-danger' : ''}>Rejected: {errors}</li>
              </ul>
              {existing > 0 && (
                <fieldset className="mt-3 text-sm">
                  <legend className="font-medium">Questions whose ID is already stored</legend>
                  <label className="mt-1 flex min-h-11 items-center gap-2">
                    <input type="radio" name="mode" checked={mode === 'skip-existing'} onChange={() => setMode('skip-existing')} />
                    Skip them (keep stored versions)
                  </label>
                  <label className="flex min-h-11 items-center gap-2">
                    <input type="radio" name="mode" checked={mode === 'update-existing'} onChange={() => setMode('update-existing')} />
                    Update them (old version is kept in history)
                  </label>
                </fieldset>
              )}
              {problems.length > 0 && (
                <div className="mt-3 max-h-72 overflow-auto rounded-md border border-border">
                  <table className="w-full text-left text-xs">
                    <thead className="sticky top-0 bg-surface-2">
                      <tr>
                        <th className="p-2">Line</th>
                        <th className="p-2">ID</th>
                        <th className="p-2">Problem</th>
                      </tr>
                    </thead>
                    <tbody>
                      {problems.slice(0, 200).map((r) => (
                        <tr key={r.line} className="border-t border-border align-top">
                          <td className="p-2">{r.line}</td>
                          <td className="p-2">{r.id || '—'}</td>
                          <td className="p-2">
                            {r.errors.map((e) => (
                              <div key={e} className="text-danger">
                                Error: {e}
                              </div>
                            ))}
                            {r.warnings.map((w) => (
                              <div key={w} className="text-warning">
                                Warning: {w}
                              </div>
                            ))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={confirm} disabled={busy || toImport === 0}>
              Import {toImport} question{toImport === 1 ? '' : 's'}
            </Button>
            <Button variant="ghost" onClick={() => setPreview(null)} disabled={busy}>
              Cancel
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
