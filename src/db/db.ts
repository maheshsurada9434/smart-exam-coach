import Dexie, { type Table } from 'dexie'

// Row shapes for tables filled in later days are kept loose until those days define them.
export type Row = { id: string; [key: string]: unknown }

export const DB_NAME = 'smart-exam-coach'

// Tables holding the student's own records (backed up / restored together).
export const STUDENT_TABLES = [
  'prefs',
  'attempts',
  'sessions',
  'bookmarks',
  'notes',
  'tasks',
  'revisionItems',
  'reviewLogs',
  'errorReports',
] as const
export type StudentTable = (typeof STUDENT_TABLES)[number]

export class ExamDB extends Dexie {
  declare prefs: Table<Row, string>
  declare questions: Table<Row, string>
  declare attempts: Table<Row, string>
  declare sessions: Table<Row, string>
  declare bookmarks: Table<Row, string>
  declare notes: Table<Row, string>
  declare tasks: Table<Row, string>
  declare revisionItems: Table<Row, string>
  declare reviewLogs: Table<Row, string>
  declare importLogs: Table<Row, string>
  declare questionVersions: Table<Row, string>
  declare errorReports: Table<Row, string>
  declare contentItems: Table<Row, string>

  constructor(name = DB_NAME) {
    super(name)
    // Migrations: never edit a released version. Add version(N+1).stores({...}).upgrade(tx => ...)
    // with only the changed tables; Dexie runs upgrades in order and keeps existing rows.
    this.version(1).stores({
      prefs: 'id',
      questions: 'id, examCode, subject, topic, status',
      attempts: 'id, questionId, sessionId, examCode, topic, createdAt',
      sessions: 'id, kind, examCode, status, startedAt',
      bookmarks: 'id, createdAt',
      notes: 'id, questionId, updatedAt',
      tasks: 'id, date, status, topic',
      revisionItems: 'id, kind, refId, nextReview',
      reviewLogs: 'id, itemId, reviewedAt',
      importLogs: 'id, createdAt',
    })
    // v2 (Day 3): a question can belong to several exams; content index for duplicate checks;
    // previous question versions kept for history.
    this.version(2)
      .stores({
        questions: 'id, *examCodes, subject, topic, status, contentKey',
        questionVersions: 'id, questionId',
      })
      .upgrade((tx) =>
        tx
          .table('questions')
          .toCollection()
          .modify((q: Record<string, unknown>) => {
            if (!Array.isArray(q.examCodes)) {
              q.examCodes = typeof q.examCode === 'string' ? [q.examCode] : []
              delete q.examCode
            }
          }),
      )
    // v3 (Day 4): students can report a problem with a question.
    this.version(3).stores({ errorReports: 'id, questionId, status, createdAt' })
    // v4 (Day 7): study content (vocabulary, idioms, polity, current affairs ...). Admin data, not in student backups.
    this.version(4).stores({ contentItems: 'id, pack, kind' })
  }
}

export const db = new ExamDB()

export function describeDbError(e: unknown): string {
  const name = e instanceof Error ? e.name : ''
  if (name === 'QuotaExceededError' || (e as { inner?: Error })?.inner?.name === 'QuotaExceededError')
    return 'Browser storage is full. Download a backup, then free up space in your browser settings.'
  if (name === 'VersionError')
    return 'This data was saved by a newer version of the app. Reload the page to update.'
  if (name === 'MissingAPIError' || name === 'InvalidStateError')
    return 'This browser is blocking storage (often private mode). Your progress cannot be saved here.'
  return `Could not save or read your data (${name || 'unknown error'}). Your existing data was not changed.`
}
