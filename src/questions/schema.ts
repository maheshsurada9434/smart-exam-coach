import { z } from 'zod'
import { EXAMS, SUBJECTS, SYLLABUS } from '../data/exams'

// Lifecycle: draft -> reviewed -> approved -> published -> archived.
export const STATUSES = ['draft', 'reviewed', 'approved', 'published', 'archived'] as const
export type Status = (typeof STATUSES)[number]
export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const
// 'dev-sample' = the small development dataset; never real exam content.
export const SOURCE_KINDS = ['original', 'previous-year', 'licensed', 'dev-sample'] as const
export const OPTION_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F'] as const

/** Only approved or published questions may appear in scored mock tests. */
export const isScorable = (s: Status) => s === 'approved' || s === 'published'

/** Allowed status changes: stay, move one step forward, go back to draft, or archive. */
export function allowedStatuses(current: Status): Status[] {
  const next = STATUSES[STATUSES.indexOf(current) + 1]
  return STATUSES.filter((s) => s === current || s === next || s === 'draft' || s === 'archived')
}

const examCodes = new Set(EXAMS.map((e) => e.code))
const optStr = z.string().trim().min(1).optional()

const base = {
  id: z
    .string()
    .trim()
    .min(1, 'ID is required')
    .max(64)
    .regex(/^[A-Za-z0-9_.-]+$/, 'ID may only use letters, numbers, - _ .'),
  examCodes: z
    .array(z.string())
    .min(1, 'At least one exam code is required')
    .refine((a) => a.every((c) => examCodes.has(c)), {
      message: `Unknown exam code (use: ${[...examCodes].join(', ')})`,
    }),
  cycle: optStr,
  subject: z.enum(SUBJECTS, { message: `Subject must be one of: ${SUBJECTS.join(', ')}` }),
  topic: z.string().trim().min(1, 'Topic is required'),
  subtopic: optStr,
  language: z.string().trim().min(2).default('en'),
  text: z.string().trim().min(1, 'Question text is required'),
  passage: optStr,
  image: optStr,
  explanation: z.string().trim().default(''),
  solutionSteps: z.array(z.string().trim().min(1)).default([]),
  difficulty: z.enum(DIFFICULTIES, { message: 'Difficulty must be easy, medium or hard' }),
  expectedSeconds: z.number().int().positive().optional(),
  source: z.object({
    kind: z.enum(SOURCE_KINDS, { message: `Source kind must be one of: ${SOURCE_KINDS.join(', ')}` }),
    label: optStr,
    url: z.string().url('Source URL is not a valid URL').optional(),
    year: z.number().int().min(1950).max(2100).optional(),
  }),
  status: z.enum(STATUSES, { message: `Status must be one of: ${STATUSES.join(', ')}` }),
}

const Mcq = z.object({
  ...base,
  type: z.literal('mcq'),
  options: z.array(z.string().trim().min(1)).min(2, 'Need at least 2 options').max(6, 'At most 6 options'),
  correctOption: z.number({ message: 'Answer must be an option letter A–F' }).int().min(0),
})
const Numerical = z.object({
  ...base,
  type: z.literal('numerical'),
  correctValue: z.number({ message: 'Answer must be a number' }).finite(),
  tolerance: z.number().min(0).default(0),
})

export const QuestionInputSchema = z.discriminatedUnion('type', [Mcq, Numerical]).superRefine((q, ctx) => {
  const err = (message: string, path: string) => ctx.addIssue({ code: 'custom', message, path: [path] })
  if (q.type === 'mcq') {
    if (q.correctOption >= q.options.length) err('Answer points to an option that does not exist', 'correctOption')
    const norm = q.options.map(normalize)
    if (new Set(norm).size !== norm.length) err('Options must all be different', 'options')
  }
  if (isScorable(q.status) && !q.explanation) err('Approved/published questions need an explanation', 'explanation')
  if (q.source.kind === 'previous-year' && (!q.source.label || !q.source.year))
    err('Previous-year questions need a source label and year', 'source')
})
export type QuestionInput = z.output<typeof QuestionInputSchema>

const System = z.object({
  version: z.number().int().min(1),
  createdAt: z.string(),
  updatedAt: z.string(),
  contentKey: z.string(),
})
export const QuestionSchema = QuestionInputSchema.and(System)
export type Question = QuestionInput & z.output<typeof System>

export function normalize(s: string) {
  return s.normalize('NFKC').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim()
}

/** Same text + same answer choices + same language = duplicate content, whatever the ID. */
export function contentKey(q: QuestionInput) {
  const answers = q.type === 'mcq' ? q.options.map(normalize).sort().join('|') : String(q.correctValue)
  return `${q.language}::${normalize(q.text)}::${answers}`
}

/** Non-blocking issues shown in the import report. */
export function questionWarnings(q: QuestionInput): string[] {
  const w: string[] = []
  if (!SYLLABUS[q.subject].includes(q.topic)) w.push(`Topic "${q.topic}" is not in the ${q.subject} syllabus list`)
  if (!q.explanation) w.push('No explanation yet')
  return w
}

export function formatIssues(e: z.ZodError): string[] {
  return e.issues.map((i) => {
    const path = i.path.join('.')
    return path && !i.message.toLowerCase().includes(path.toLowerCase()) ? `${path}: ${i.message}` : i.message
  })
}

export const correctAnswerLabel = (q: QuestionInput) =>
  q.type === 'mcq' ? `${OPTION_LETTERS[q.correctOption]}. ${q.options[q.correctOption]}` : String(q.correctValue)
