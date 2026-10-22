import { beforeEach, describe, expect, it } from 'vitest'
import template from '../../public/templates/questions-template.csv?raw'
import schemaDoc from '../../docs/question-bank.schema.json?raw'
import { db } from '../db/db'
import { EXAMS, SUBJECTS } from '../data/exams'
import { DEV_QUESTIONS } from '../data/dev-questions'
import { CSV_COLUMNS, parseCsv, questionsToCsv, toCsv } from './csv'
import {
  DIFFICULTIES,
  QuestionInputSchema,
  SOURCE_KINDS,
  STATUSES,
  allowedStatuses,
  contentKey,
  type QuestionInput,
} from './schema'
import {
  buildPreview,
  commitImport,
  loadDevSample,
  loadQuestions,
  questionsToJson,
  removeDevSample,
  saveQuestionEdit,
  versionHistory,
} from './repo'

const base: QuestionInput = {
  id: 'T-1', examCodes: ['SSC_CGL'], subject: 'Quantitative Aptitude', topic: 'Percentage', language: 'en',
  text: 'What is 10% of 50?', explanation: '50 × 10 ÷ 100 = 5.', solutionSteps: [], difficulty: 'easy',
  source: { kind: 'original' }, status: 'draft', type: 'mcq', options: ['4', '5', '6', '7'], correctOption: 1,
}
const parse = (patch: object) => QuestionInputSchema.safeParse({ ...base, ...patch })
const csvOf = (...rows: Record<string, string>[]) =>
  toCsv([CSV_COLUMNS, ...rows.map((r) => CSV_COLUMNS.map((c) => r[c] ?? ''))])
const row = (patch: Record<string, string> = {}) => ({
  id: 'C-1', exam_codes: 'SSC_CGL', subject: 'Reasoning', topic: 'Series', question: 'Next: 1, 2, 3, ?',
  option_a: '4', option_b: '5', answer: 'A', difficulty: 'easy', source_kind: 'original', status: 'draft', ...patch,
})

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('CSV parser', () => {
  it('handles quotes, escaped quotes, commas/newlines in quotes, CRLF, BOM and blank lines', () => {
    const text = '﻿a,b,c\r\n"x, y","say ""hi""","line1\nline2"\r\n\r\n1,,3\n'
    expect(parseCsv(text)).toEqual([
      ['a', 'b', 'c'],
      ['x, y', 'say "hi"', 'line1\nline2'],
      ['1', '', '3'],
    ])
  })
  it('round-trips through toCsv', () => {
    const rows = [['a', 'b'], ['he said "x, y"', 'two\nlines']]
    expect(parseCsv(toCsv(rows))).toEqual(rows)
  })
})

describe('question schema', () => {
  it('accepts a valid mcq and a valid numerical question', () => {
    expect(parse({}).success).toBe(true)
    expect(parse({ type: 'numerical', correctValue: 5, options: undefined, correctOption: undefined }).success).toBe(true)
  })
  it.each([
    ['answer outside the options', { correctOption: 4 }],
    ['duplicate options', { options: ['5', ' 5 ', '6'] }],
    ['approved without explanation', { status: 'approved', explanation: '' }],
    ['previous-year without year', { source: { kind: 'previous-year', label: 'SSC CGL' } }],
    ['unknown exam code', { examCodes: ['UPSC'] }],
    ['bad id characters', { id: 'has space' }],
    ['unknown subject', { subject: 'Astrology' }],
  ])('rejects %s', (_, patch) => expect(parse(patch).success).toBe(false))

  it('follows the lifecycle rules', () => {
    expect(allowedStatuses('draft')).toEqual(['draft', 'reviewed', 'archived'])
    expect(allowedStatuses('approved')).toEqual(['draft', 'approved', 'published', 'archived'])
    expect(allowedStatuses('archived')).toEqual(['draft', 'archived'])
  })

  it('treats case, spacing and punctuation differences as the same content', () => {
    const a = QuestionInputSchema.parse(base)
    const b = QuestionInputSchema.parse({ ...base, id: 'T-2', text: 'what is 10 % of 50', options: ['7', '6', '5', '4'], correctOption: 2 })
    expect(contentKey(a)).toBe(contentKey(b))
  })
})

describe('development sample', () => {
  it('is valid, uniquely identified and clearly labelled', () => {
    for (const q of DEV_QUESTIONS) {
      expect(QuestionInputSchema.safeParse(q).success, q.id).toBe(true)
      expect(q.source.kind).toBe('dev-sample')
      expect(q.id.startsWith('DEV-')).toBe(true)
    }
    expect(new Set(DEV_QUESTIONS.map((q) => q.id)).size).toBe(DEV_QUESTIONS.length)
    expect(new Set(DEV_QUESTIONS.map(contentKey)).size).toBe(DEV_QUESTIONS.length)
  })
  it('loads only on request and can be removed', async () => {
    expect(await loadDevSample()).toBe(DEV_QUESTIONS.length)
    expect(await loadDevSample()).toBe(0)
    await db.questions.add({ id: 'MINE' })
    expect(await removeDevSample()).toBe(DEV_QUESTIONS.length)
    expect(await db.questions.toArray()).toEqual([{ id: 'MINE' }])
  })
})

describe('import', () => {
  it('accepts the shipped CSV template', async () => {
    const p = await buildPreview('t.csv', template)
    expect(p.fileErrors).toEqual([])
    expect(p.rows.map((r) => [r.kind, r.errors])).toEqual([['new', []], ['new', []]])
  })

  it('rejects files with missing required columns', async () => {
    const p = await buildPreview('x.csv', 'id,question\n1,hi\n')
    expect(p.fileErrors[0]).toMatch(/Missing required columns: exam_codes/)
    expect(p.rows).toEqual([])
  })

  it('reports row problems with line numbers', async () => {
    const p = await buildPreview(
      'x.csv',
      csvOf(
        row(),
        row({ question: 'Other' }), // same ID again
        row({ id: 'C-2', question: 'next 1 2 3' }), // same content as line 2
        row({ id: 'C-3', question: 'Gap', option_b: '', option_c: '9' }),
        row({ id: 'C-4', question: 'Bad letter', answer: 'Z' }),
        row({ id: 'C-5', question: 'Topic warning', topic: 'Origami' }),
      ),
    )
    const byLine = Object.fromEntries(p.rows.map((r) => [r.line, r]))
    expect(byLine[2]!.kind).toBe('new')
    expect(byLine[3]!.errors[0]).toMatch(/Duplicate ID in this file \(first used on line 2\)/)
    expect(byLine[4]!.errors[0]).toMatch(/Same question as line 2/)
    expect(byLine[5]!.errors.join()).toMatch(/without gaps/)
    expect(byLine[6]!.errors.join()).toMatch(/option letter/)
    expect(byLine[7]!.kind).toBe('new')
    expect(byLine[7]!.warnings.join()).toMatch(/not in the Reasoning syllabus/)
  })

  it('skips or updates stored IDs, keeps history and logs the import', async () => {
    await commitImport(await buildPreview('a.csv', csvOf(row())), 'skip-existing')
    const again = await buildPreview('b.csv', csvOf(row({ option_b: '6' }), row({ id: 'C-9', question: 'New one' })))
    expect(again.rows.map((r) => r.kind)).toEqual(['existing', 'new'])

    expect(await commitImport(again, 'skip-existing')).toEqual({ added: 1, updated: 0, skipped: 1, rejected: 0 })
    expect((await db.questions.get('C-1'))!.options).toEqual(['4', '5'])

    const third = await buildPreview('c.csv', csvOf(row({ option_b: '6' })))
    expect(await commitImport(third, 'update-existing')).toEqual({ added: 0, updated: 1, skipped: 0, rejected: 0 })
    const q = (await db.questions.get('C-1'))!
    expect([q.options, q.version]).toEqual([['4', '6'], 2])
    expect((await versionHistory('C-1')).map((h) => h.version)).toEqual([1])
    expect(await db.importLogs.count()).toBe(3)
  })

  it('rejects content already stored under another ID', async () => {
    await commitImport(await buildPreview('a.csv', csvOf(row())), 'skip-existing')
    const p = await buildPreview('b.csv', csvOf(row({ id: 'OTHER' })))
    expect(p.rows[0]!.errors[0]).toMatch(/already stored as "C-1"/)
  })

  it('round-trips through JSON and CSV export', async () => {
    await loadDevSample()
    const { questions } = await loadQuestions()
    const json = questionsToJson(questions)
    const csv = questionsToCsv(questions)
    await db.questions.clear()
    const fromJson = await buildPreview('q.json', json)
    expect(fromJson.rows.every((r) => r.kind === 'new')).toBe(true)
    const fromCsv = await buildPreview('q.csv', csv)
    expect(fromCsv.rows.map((r) => r.input)).toEqual(fromJson.rows.map((r) => r.input))
  })

  it('rejects JSON in the wrong format', async () => {
    expect((await buildPreview('q.json', '{"questions":[]}')).fileErrors[0]).toMatch(/format/)
    expect((await buildPreview('q.json', '{oops')).fileErrors[0]).toMatch(/not valid JSON/)
  })
})

describe('editing', () => {
  it('sends an approved question back to review when its answer key changes', async () => {
    await saveQuestionEdit({ ...base, status: 'approved' })
    const r1 = await saveQuestionEdit({ ...base, status: 'approved', explanation: 'Clearer explanation.' })
    expect(r1.ok && [r1.demoted, r1.question.status, r1.question.version]).toEqual([false, 'approved', 2])
    const r2 = await saveQuestionEdit({ ...base, status: 'approved', correctOption: 2 })
    expect(r2.ok && [r2.demoted, r2.question.status, r2.question.version]).toEqual([true, 'reviewed', 3])
    expect((await versionHistory(base.id)).map((h) => h.version)).toEqual([2, 1])
  })
  it('returns validation errors instead of saving', async () => {
    const r = await saveQuestionEdit({ ...base, text: '' })
    expect(r.ok).toBe(false)
    expect(await db.questions.count()).toBe(0)
  })
})

describe('docs/question-bank.schema.json', () => {
  it('stays in sync with the Zod schema', () => {
    const doc = JSON.parse(schemaDoc)
    const p = doc.$defs.question.properties
    expect(p.status.enum).toEqual([...STATUSES])
    expect(p.difficulty.enum).toEqual([...DIFFICULTIES])
    expect(p.subject.enum).toEqual([...SUBJECTS])
    expect(p.source.properties.kind.enum).toEqual([...SOURCE_KINDS])
    expect(p.examCodes.items.enum).toEqual(EXAMS.map((e) => e.code))
  })
})
