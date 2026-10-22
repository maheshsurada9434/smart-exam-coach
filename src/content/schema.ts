import { z } from 'zod'

// Study content (vocabulary, idioms, one-word substitution, grammar, polity, current affairs, GA facts).
// Content is stored, reviewed data: the app never writes or invents any of it.
export const CONTENT_KINDS = ['word', 'idiom', 'ows', 'grammar', 'polity', 'current-affairs', 'ga-fact'] as const
export type ContentKind = (typeof CONTENT_KINDS)[number]
export const KIND_LABEL: Record<ContentKind, string> = {
  word: 'Vocabulary',
  idiom: 'Idioms and phrases',
  ows: 'One word substitution',
  grammar: 'Grammar rules',
  polity: 'Indian Polity',
  'current-affairs': 'Current affairs',
  'ga-fact': 'General Awareness facts',
}
/** Kinds that can be quizzed from stored answers (front -> back). */
export const QUIZ_KINDS: ContentKind[] = ['word', 'idiom', 'ows']
export const CONTENT_VERIFICATION = ['unverified', 'reviewed', 'verified'] as const

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Use a YYYY-MM-DD date')
const opt = z.string().trim().min(1).optional()

export const ContentItemSchema = z
  .object({
    id: z.string().trim().min(1).max(64).regex(/^[A-Za-z0-9_.-]+$/, 'ID may only use letters, numbers, - _ .'),
    pack: z.string().trim().min(1, 'Pack is required'),
    kind: z.enum(CONTENT_KINDS, { message: `Kind must be one of: ${CONTENT_KINDS.join(', ')}` }),
    front: z.string().trim().min(1, 'Front (word, phrase, title or definition) is required'),
    back: z.string().trim().min(1, 'Back (meaning, answer or explanation) is required'),
    telugu: opt,
    synonyms: z.array(z.string().trim().min(1)).default([]),
    antonyms: z.array(z.string().trim().min(1)).default([]),
    examples: z.array(z.string().trim().min(1)).default([]),
    article: opt, // polity: article number, e.g. "21A"
    textType: z.enum(['constitutional-text', 'simplified']).optional(),
    source: z.object({ label: opt, url: z.string().url('Source URL is not a valid URL').optional() }).default({}),
    publishedOn: date.optional(),
    reviewedOn: date.optional(),
    tags: z.array(z.string().trim().min(1)).default([]),
    verification: z.enum(CONTENT_VERIFICATION).default('unverified'),
    language: z.string().trim().min(2).default('en'),
  })
  .superRefine((c, ctx) => {
    const err = (message: string, path: string) => ctx.addIssue({ code: 'custom', message, path: [path] })
    const hasSource = !!(c.source.label || c.source.url)
    if (c.kind === 'polity' && !c.textType) err('Polity items must say if they are constitutional text or a simplified explanation', 'textType')
    if (c.kind === 'current-affairs' && !c.publishedOn) err('Current affairs need a publication date', 'publishedOn')
    if (c.kind === 'current-affairs' && !hasSource) err('Current affairs need a source', 'source')
    if (c.verification === 'verified' && !hasSource) err('Verified items need a source', 'source')
  })
export type ContentItem = z.output<typeof ContentItemSchema>

export const CONTENT_FORMAT = 'smart-exam-coach-content'
export const CONTENT_VERSION = 1
