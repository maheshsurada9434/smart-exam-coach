import { OPTION_LETTERS, type Question, type QuestionInput } from './schema'

/** RFC 4180 CSV: quoted fields, "" escapes, commas and newlines inside quotes, CRLF or LF. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const src = text.charCodeAt(0) === 0xfeff ? text.slice(1) : text // strip Excel BOM
  const endRow = () => {
    row.push(field)
    rows.push(row)
    row = []
    field = ''
  }
  for (let i = 0; i < src.length; i++) {
    const c = src[i]!
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') {
        field += '"'
        i++
      } else if (c === '"') quoted = false
      else field += c
    } else if (c === '"' && field === '') quoted = true
    else if (c === ',') {
      row.push(field)
      field = ''
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++
      endRow()
    } else field += c
  }
  if (field !== '' || row.length) endRow()
  return rows.filter((r) => r.some((f) => f.trim() !== ''))
}

const esc = (v: string) => (/[",\r\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
export const toCsv = (rows: string[][]) => rows.map((r) => r.map(esc).join(',')).join('\r\n') + '\r\n'

const OPTION_COLS = OPTION_LETTERS.map((l) => `option_${l.toLowerCase()}`)
export const CSV_COLUMNS = [
  'id', 'exam_codes', 'cycle', 'subject', 'topic', 'subtopic', 'type', 'language', 'question', 'passage',
  ...OPTION_COLS, 'answer', 'tolerance', 'explanation', 'solution_steps', 'difficulty', 'expected_seconds',
  'source_kind', 'source_label', 'source_url', 'source_year', 'status', 'image',
]
export const REQUIRED_COLUMNS = ['id', 'exam_codes', 'subject', 'topic', 'question', 'answer', 'difficulty', 'source_kind', 'status']

export type CsvRecord = { line: number; data: Record<string, string> }
export type CsvFile = { records: CsvRecord[]; fileErrors: string[]; fileWarnings: string[] }

export function readCsvFile(text: string): CsvFile {
  const rows = parseCsv(text)
  const header = (rows[0] ?? []).map((h) => h.trim().toLowerCase())
  const missing = REQUIRED_COLUMNS.filter((c) => !header.includes(c))
  const unknown = header.filter((h) => h && !CSV_COLUMNS.includes(h))
  const fileErrors = rows.length === 0 ? ['The file is empty.'] : missing.length ? [`Missing required columns: ${missing.join(', ')}`] : []
  const fileWarnings = unknown.length ? [`Ignored unknown columns: ${unknown.join(', ')}`] : []
  const records = fileErrors.length
    ? []
    : rows.slice(1).map((r, i) => ({
        line: i + 2,
        data: Object.fromEntries(header.map((h, j) => [h, (r[j] ?? '').trim()])),
      }))
  return { records, fileErrors, fileWarnings }
}

const num = (v: string | undefined) => (v ? Number(v) : undefined)
const list = (v: string | undefined) => (v ? v.split('|').map((x) => x.trim()).filter(Boolean) : [])
const opt = (v: string | undefined) => v || undefined

/** CSV row -> object for QuestionInputSchema, plus CSV-level problems the schema cannot see. */
export function recordToInput(d: Record<string, string>): { value: unknown; errors: string[] } {
  const errors: string[] = []
  const type = (d.type || 'mcq').toLowerCase()
  const cells = OPTION_COLS.map((c) => d[c] ?? '')
  const lastFilled = cells.map((c) => c !== '').lastIndexOf(true)
  const options = cells.slice(0, lastFilled + 1)
  if (options.includes('')) errors.push('Options must be filled from A onwards without gaps')
  const answer = (d.answer ?? '').trim()

  const common = {
    id: d.id,
    examCodes: list(d.exam_codes).map((c) => c.toUpperCase()),
    cycle: opt(d.cycle),
    subject: d.subject,
    topic: d.topic,
    subtopic: opt(d.subtopic),
    language: d.language || 'en',
    text: d.question,
    passage: opt(d.passage),
    image: opt(d.image),
    explanation: d.explanation ?? '',
    solutionSteps: list(d.solution_steps),
    difficulty: (d.difficulty ?? '').toLowerCase(),
    expectedSeconds: num(d.expected_seconds),
    source: { kind: (d.source_kind ?? '').toLowerCase(), label: opt(d.source_label), url: opt(d.source_url), year: num(d.source_year) },
    status: (d.status ?? '').toLowerCase(),
  }
  if (type === 'numerical') {
    const value = answer === '' ? NaN : Number(answer)
    return { value: { ...common, type, correctValue: Number.isFinite(value) ? value : undefined, tolerance: num(d.tolerance) ?? 0 }, errors }
  }
  const idx = OPTION_LETTERS.indexOf(answer.toUpperCase() as (typeof OPTION_LETTERS)[number])
  return { value: { ...common, type, options, correctOption: idx >= 0 ? idx : undefined }, errors }
}

export function questionToRecord(q: Question | QuestionInput): Record<string, string> {
  const r: Record<string, string> = {
    id: q.id,
    exam_codes: q.examCodes.join('|'),
    cycle: q.cycle ?? '',
    subject: q.subject,
    topic: q.topic,
    subtopic: q.subtopic ?? '',
    type: q.type,
    language: q.language,
    question: q.text,
    passage: q.passage ?? '',
    answer: q.type === 'mcq' ? OPTION_LETTERS[q.correctOption]! : String(q.correctValue),
    tolerance: q.type === 'numerical' && q.tolerance ? String(q.tolerance) : '',
    explanation: q.explanation,
    solution_steps: q.solutionSteps.join('|'),
    difficulty: q.difficulty,
    expected_seconds: q.expectedSeconds ? String(q.expectedSeconds) : '',
    source_kind: q.source.kind,
    source_label: q.source.label ?? '',
    source_url: q.source.url ?? '',
    source_year: q.source.year ? String(q.source.year) : '',
    status: q.status,
    image: q.image ?? '',
  }
  OPTION_COLS.forEach((c, i) => (r[c] = q.type === 'mcq' ? (q.options[i] ?? '') : ''))
  return r
}

export const questionsToCsv = (qs: (Question | QuestionInput)[]) =>
  toCsv([CSV_COLUMNS, ...qs.map((q) => CSV_COLUMNS.map((c) => questionToRecord(q)[c] ?? ''))])
