import { z } from 'zod'
import { db, STUDENT_TABLES, type Row, type StudentTable } from './db'
import { PrefsSchema } from './prefs'

export const BACKUP_APP = 'smart-exam-coach'
export const BACKUP_KIND = 'student-backup'
export const BACKUP_VERSION = 1

const RowSchema = z.object({ id: z.string().min(1) }).passthrough()

const BackupSchema = z.object({
  app: z.literal(BACKUP_APP),
  kind: z.literal(BACKUP_KIND),
  version: z.literal(BACKUP_VERSION),
  exportedAt: z.string(),
  data: z.record(z.enum(STUDENT_TABLES), z.array(RowSchema)),
})

export type Backup = {
  app: typeof BACKUP_APP
  kind: typeof BACKUP_KIND
  version: typeof BACKUP_VERSION
  exportedAt: string
  data: Record<StudentTable, Row[]>
}

const tables = () => STUDENT_TABLES.map((t) => db.table<Row, string>(t))

export async function exportBackup(now = new Date()): Promise<Backup> {
  const data = {} as Record<StudentTable, Row[]>
  await db.transaction('r', tables(), async () => {
    for (const t of STUDENT_TABLES) data[t] = await db.table<Row, string>(t).toArray()
  })
  return { app: BACKUP_APP, kind: BACKUP_KIND, version: BACKUP_VERSION, exportedAt: now.toISOString(), data }
}

export type ParseResult = { ok: true; backup: Backup; counts: Record<StudentTable, number> } | { ok: false; error: string }

export function parseBackup(text: string): ParseResult {
  let json: unknown
  try {
    json = JSON.parse(text)
  } catch {
    return { ok: false, error: 'This file is not valid JSON.' }
  }
  const parsed = BackupSchema.safeParse(json)
  if (!parsed.success) {
    const issue = parsed.error.issues[0]
    return { ok: false, error: `Not a valid Smart Exam Coach backup: ${issue?.path.join('.') || 'file'}: ${issue?.message}` }
  }
  const data = {} as Record<StudentTable, Row[]>
  const counts = {} as Record<StudentTable, number>
  for (const t of STUDENT_TABLES) {
    const rows = (parsed.data.data[t] ?? []) as Row[]
    const ids = new Set(rows.map((r) => r.id))
    if (ids.size !== rows.length) return { ok: false, error: `Backup has duplicate IDs in "${t}".` }
    data[t] = rows
    counts[t] = rows.length
  }
  const prefs = z.array(PrefsSchema).max(1).safeParse(data.prefs)
  if (!prefs.success) return { ok: false, error: 'Backup settings (prefs) are malformed.' }
  return { ok: true, backup: { ...parsed.data, data }, counts }
}

export type RestoreMode = 'merge' | 'replace'

// merge: adds rows whose ID is not already stored; existing rows are kept unchanged.
// replace: clears the student tables and writes the backup. Both run in one transaction.
export async function restoreBackup(backup: Backup, mode: RestoreMode) {
  let added = 0
  let skipped = 0
  await db.transaction('rw', tables(), async () => {
    for (const t of STUDENT_TABLES) {
      const table = db.table<Row, string>(t)
      const rows = backup.data[t]
      if (mode === 'replace') {
        await table.clear()
        await table.bulkAdd(rows)
        added += rows.length
        continue
      }
      const existing = await table.bulkGet(rows.map((r) => r.id))
      const fresh = rows.filter((_, i) => existing[i] === undefined)
      await table.bulkAdd(fresh)
      added += fresh.length
      skipped += rows.length - fresh.length
    }
  })
  return { added, skipped }
}
