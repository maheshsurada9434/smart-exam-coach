import { useEffect, useState, type ChangeEvent } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Download, Upload } from 'lucide-react'
import { Button, Card, Dialog, useToast } from '../components/ui'
import { EXAMS } from '../data/exams'
import { describeDbError } from '../db/db'
import { getPrefs, savePrefs } from '../db/prefs'
import { exportBackup, parseBackup, restoreBackup, type ParseResult, type RestoreMode } from '../db/backup'

const field = 'mt-1 block min-h-11 w-full rounded-md border border-border bg-surface px-3 text-sm'

export default function Settings() {
  const toast = useToast()
  const saved = useLiveQuery(() => getPrefs())
  const [examCode, setExamCode] = useState('')
  const [minutes, setMinutes] = useState('60')
  const [error, setError] = useState('')
  const [file, setFile] = useState<ParseResult | null>(null)
  const [confirmReplace, setConfirmReplace] = useState(false)

  useEffect(() => {
    if (!saved) return
    setExamCode(saved.prefs.examCode ?? '')
    setMinutes(String(saved.prefs.dailyMinutes))
  }, [saved])

  const mins = Number(minutes)
  const minutesInvalid = !Number.isInteger(mins) || mins < 10 || mins > 720

  async function save() {
    if (minutesInvalid) return
    try {
      await savePrefs({ examCode: examCode || null, dailyMinutes: mins })
      toast('Settings saved')
    } catch (e) {
      setError(describeDbError(e))
    }
  }

  async function download() {
    try {
      const backup = await exportBackup()
      const url = URL.createObjectURL(new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `smart-exam-coach-backup-${backup.exportedAt.slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(url)
      toast('Backup downloaded')
    } catch (e) {
      setError(describeDbError(e))
    }
  }

  async function pickFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (f) setFile(parseBackup(await f.text()))
  }

  async function restore(mode: RestoreMode) {
    if (!file?.ok) return
    setConfirmReplace(false)
    try {
      const r = await restoreBackup(file.backup, mode)
      setFile(null)
      toast(mode === 'replace' ? `Restored ${r.added} records` : `Added ${r.added} records, kept ${r.skipped} existing`)
    } catch (e) {
      setError(describeDbError(e))
    }
  }

  return (
    <section className="max-w-2xl">
      <h1 className="text-2xl font-semibold">Settings</h1>

      {error && (
        <p role="alert" className="mt-4 rounded-md border border-danger px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}
      {saved?.malformed && (
        <p role="alert" className="mt-4 rounded-md border border-warning px-4 py-3 text-sm text-warning">
          Your saved settings could not be read, so defaults are shown. Saving will replace them.
        </p>
      )}

      <Card className="mt-4">
        <h2 className="font-semibold">Study preferences</h2>
        <label className="mt-4 block text-sm font-medium">
          Target exam
          <select className={field} value={examCode} onChange={(e) => setExamCode(e.target.value)}>
            <option value="">Not chosen yet</option>
            {EXAMS.map((e) => (
              <option key={e.code} value={e.code}>
                {e.name}
              </option>
            ))}
          </select>
        </label>
        <label className="mt-4 block text-sm font-medium">
          Study minutes per day
          <input
            type="number"
            inputMode="numeric"
            min={10}
            max={720}
            className={field}
            value={minutes}
            onChange={(e) => setMinutes(e.target.value)}
            aria-invalid={minutesInvalid}
            aria-describedby="minutes-help"
          />
        </label>
        <p id="minutes-help" className={`mt-1 text-xs ${minutesInvalid ? 'text-danger' : 'text-muted'}`}>
          Enter a whole number from 10 to 720.
        </p>
        <Button className="mt-4" onClick={save} disabled={minutesInvalid}>
          Save preferences
        </Button>
      </Card>

      <Card className="mt-4">
        <h2 className="font-semibold">Backup and restore</h2>
        <p className="mt-2 text-sm text-muted">
          Your records are stored only in this browser on this device. They are not encrypted and not
          synced. Clearing browser data or losing this device deletes them unless you have a backup.
          The question bank is backed up separately.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button onClick={download}>
            <Download size={16} aria-hidden /> Download backup
          </Button>
          <label className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-md border border-border bg-surface px-4 text-sm font-medium hover:bg-surface-2 focus-within:outline focus-within:outline-2 focus-within:outline-accent">
            <Upload size={16} aria-hidden /> Restore from file
            <input type="file" accept="application/json,.json" className="sr-only" onChange={pickFile} />
          </label>
        </div>

        {file && !file.ok && (
          <p role="alert" className="mt-4 text-sm text-danger">
            {file.error} Nothing was changed.
          </p>
        )}
        {file?.ok && (
          <div className="mt-4 rounded-md border border-border p-4">
            <p className="text-sm">
              Backup from <strong>{new Date(file.backup.exportedAt).toLocaleString()}</strong>
            </p>
            <ul className="mt-2 grid grid-cols-2 gap-x-4 text-sm text-muted">
              {Object.entries(file.counts).map(([t, n]) => (
                <li key={t}>
                  {t}: {n}
                </li>
              ))}
            </ul>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button onClick={() => restore('merge')}>Merge (keep my current data)</Button>
              <Button variant="danger" onClick={() => setConfirmReplace(true)}>
                Replace my data
              </Button>
              <Button variant="ghost" onClick={() => setFile(null)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Dialog open={confirmReplace} onClose={() => setConfirmReplace(false)} title="Replace your data?">
        <p className="text-sm text-muted">
          This deletes all your current records in this browser and replaces them with the backup. The
          question bank is not affected. Download a backup first if you may need your current data.
        </p>
        <div className="mt-5 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmReplace(false)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => restore('replace')}>
            Replace
          </Button>
        </div>
      </Dialog>
    </section>
  )
}
