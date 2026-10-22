import { db } from '../db/db'
import { DEV_QUESTIONS } from '../data/dev-questions'
import { readCsvFile, recordToInput } from './csv'
import {
  QuestionInputSchema,
  QuestionSchema,
  contentKey,
  formatIssues,
  isScorable,
  questionWarnings,
  type Question,
  type QuestionInput,
} from './schema'

export const JSON_FORMAT = 'smart-exam-coach-questions'
export const JSON_VERSION = 1

/* ---------- reading ---------- */

/** Stored rows are re-validated; malformed ones are counted, never deleted. */
export async function loadQuestions(): Promise<{ questions: Question[]; malformed: number }> {
  const rows = await db.questions.toArray()
  const questions: Question[] = []
  for (const r of rows) {
    const p = QuestionSchema.safeParse(r)
    if (p.success) questions.push(p.data)
  }
  return { questions, malformed: rows.length - questions.length }
}

/* ---------- import ---------- */

export type PreviewRow = {
  line: number
  id: string
  kind: 'new' | 'existing' | 'error'
  errors: string[]
  warnings: string[]
  input?: QuestionInput
}
export type ImportPreview = { fileName: string; fileErrors: string[]; fileWarnings: string[]; rows: PreviewRow[] }

type RawRecord = { line: number; value: unknown; errors: string[] }

export function readImportFile(fileName: string, text: string): { records: RawRecord[]; fileErrors: string[]; fileWarnings: string[] } {
  if (/\.json$/i.test(fileName) || text.trimStart().startsWith('{')) {
    let json: unknown
    try {
      json = JSON.parse(text)
    } catch {
      return { records: [], fileErrors: ['This file is not valid JSON.'], fileWarnings: [] }
    }
    const j = json as { format?: unknown; version?: unknown; questions?: unknown }
    if (j?.format !== JSON_FORMAT || j.version !== JSON_VERSION || !Array.isArray(j.questions))
      return { records: [], fileErrors: [`JSON must be {"format":"${JSON_FORMAT}","version":${JSON_VERSION},"questions":[...]}`], fileWarnings: [] }
    return { records: j.questions.map((value, i) => ({ line: i + 1, value, errors: [] })), fileErrors: [], fileWarnings: [] }
  }
  const csv = readCsvFile(text)
  return {
    records: csv.records.map((r) => ({ line: r.line, ...recordToInput(r.data) })),
    fileErrors: csv.fileErrors,
    fileWarnings: csv.fileWarnings,
  }
}

export async function buildPreview(fileName: string, text: string): Promise<ImportPreview> {
  const { records, fileErrors, fileWarnings } = readImportFile(fileName, text)
  const rows: PreviewRow[] = records.map(({ line, value, errors }) => {
    const id = String((value as { id?: unknown })?.id ?? '')
    const p = QuestionInputSchema.safeParse(value)
    if (!p.success || errors.length) return { line, id, kind: 'error', errors: [...errors, ...(p.success ? [] : formatIssues(p.error))], warnings: [] }
    return { line, id: p.data.id, kind: 'new', errors: [], warnings: questionWarnings(p.data), input: p.data }
  })

  // Duplicates inside the file (by ID and by content).
  const firstId = new Map<string, number>()
  const firstKey = new Map<string, number>()
  for (const r of rows) {
    if (!r.input) continue
    const key = contentKey(r.input)
    const idLine = firstId.get(r.id)
    const keyLine = firstKey.get(key)
    if (idLine !== undefined) fail(r, `Duplicate ID in this file (first used on line ${idLine})`)
    else if (keyLine !== undefined) fail(r, `Same question as line ${keyLine} in this file`)
    else firstId.set(r.id, r.line), firstKey.set(key, r.line)
  }

  // Against the stored bank.
  const valid = rows.filter((r) => r.input)
  const stored = await db.questions.bulkGet(valid.map((r) => r.id))
  const keys = valid.map((r) => contentKey(r.input!))
  const sameContent = await db.questions.where('contentKey').anyOf(keys).toArray()
  const byKey = new Map(sameContent.map((q) => [q.contentKey as string, q.id]))
  valid.forEach((r, i) => {
    const other = byKey.get(keys[i]!)
    if (other && other !== r.id) fail(r, `Same question already stored as "${other}"`)
    else if (stored[i]) r.kind = 'existing'
  })
  return { fileName, fileErrors, fileWarnings, rows }
}

function fail(r: PreviewRow, msg: string) {
  r.kind = 'error'
  r.errors.push(msg)
  r.input = undefined
}

export type ImportMode = 'skip-existing' | 'update-existing'

export async function commitImport(preview: ImportPreview, mode: ImportMode, now = new Date()) {
  const result = { added: 0, updated: 0, skipped: 0, rejected: 0 }
  await db.transaction('rw', db.questions, db.questionVersions, db.importLogs, async () => {
    for (const r of preview.rows) {
      if (!r.input) {
        result.rejected++
        continue
      }
      if (r.kind === 'existing') {
        if (mode === 'skip-existing') {
          result.skipped++
          continue
        }
        await writeQuestion(r.input, now)
        result.updated++
      } else {
        await writeQuestion(r.input, now)
        result.added++
      }
    }
    await db.importLogs.add({ id: crypto.randomUUID(), createdAt: now.toISOString(), fileName: preview.fileName, mode, ...result })
  })
  return result
}

/* ---------- writing with version history ---------- */

/** Saves a question. An existing version is copied to questionVersions first. */
async function writeQuestion(input: QuestionInput, now: Date): Promise<Question> {
  const prevRow = await db.questions.get(input.id)
  const prev = prevRow ? QuestionSchema.safeParse(prevRow) : undefined
  const at = now.toISOString()
  if (prevRow) {
    const v = typeof prevRow.version === 'number' ? prevRow.version : 1
    await db.questionVersions.put({ id: `${input.id}@v${v}`, questionId: input.id, version: v, savedAt: at, snapshot: prevRow })
  }
  const q: Question = {
    ...input,
    version: prev?.success ? prev.data.version + 1 : prevRow ? 2 : 1,
    createdAt: prev?.success ? prev.data.createdAt : at,
    updatedAt: at,
    contentKey: contentKey(input),
  }
  await db.questions.put(q)
  return q
}

/**
 * Admin edit. If the question text, options or answer key change on an approved/published
 * question, it drops back to "reviewed" so the new answer key gets approved again.
 */
export async function saveQuestionEdit(value: unknown, now = new Date()) {
  const p = QuestionInputSchema.safeParse(value)
  if (!p.success) return { ok: false as const, errors: formatIssues(p.error) }
  const input = p.data
  const prevRow = await db.questions.get(input.id)
  const prev = prevRow ? QuestionSchema.safeParse(prevRow) : undefined
  let demoted = false
  if (prev?.success && isScorable(prev.data.status) && input.status === prev.data.status && answerKeyChanged(prev.data, input)) {
    input.status = 'reviewed'
    demoted = true
  }
  const clash = await db.questions.where('contentKey').equals(contentKey(input)).first()
  if (clash && clash.id !== input.id) return { ok: false as const, errors: [`Same question already stored as "${clash.id}"`] }
  const q = await db.transaction('rw', db.questions, db.questionVersions, () => writeQuestion(input, now))
  return { ok: true as const, question: q, demoted }
}

function answerKeyChanged(a: QuestionInput, b: QuestionInput) {
  if (contentKey(a) !== contentKey(b) || a.type !== b.type) return true
  if (a.type === 'mcq' && b.type === 'mcq') return a.options[a.correctOption] !== b.options[b.correctOption]
  if (a.type === 'numerical' && b.type === 'numerical') return a.tolerance !== b.tolerance
  return false
}

export const versionHistory = (questionId: string) =>
  db.questionVersions.where('questionId').equals(questionId).reverse().sortBy('version')

/* ---------- development sample ---------- */

export async function loadDevSample(now = new Date()) {
  let added = 0
  await db.transaction('rw', db.questions, db.questionVersions, async () => {
    for (const q of DEV_QUESTIONS) {
      if (await db.questions.get(q.id)) continue
      await writeQuestion(QuestionInputSchema.parse(q), now)
      added++
    }
  })
  return added
}

export async function removeDevSample() {
  const ids = (await db.questions.toArray())
    .filter((q) => (q.source as { kind?: string } | undefined)?.kind === 'dev-sample')
    .map((q) => q.id)
  await db.transaction('rw', db.questions, db.questionVersions, async () => {
    await db.questions.bulkDelete(ids)
    await db.questionVersions.where('questionId').anyOf(ids).delete()
  })
  return ids.length
}

/* ---------- export ---------- */

export const questionsToJson = (questions: Question[], now = new Date()) =>
  JSON.stringify({ format: JSON_FORMAT, version: JSON_VERSION, exportedAt: now.toISOString(), questions }, null, 2)
