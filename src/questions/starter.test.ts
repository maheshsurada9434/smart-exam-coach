import { beforeEach, describe, expect, it } from 'vitest'
import questionsJson from '../../public/data/starter-questions.json?raw'
import contentJson from '../../public/data/starter-content.json?raw'
import { db } from '../db/db'
import { EXAMS } from '../data/exams'
import { ContentItemSchema } from '../content/schema'
import { loadStarterContent } from '../content/repo'
import { planMock } from '../mock/repo'
import { QuestionInputSchema, contentKey, questionWarnings } from './schema'
import { STARTER_PREFIX, loadStarterQuestions, removeStarterQuestions } from './repo'

const qs = JSON.parse(questionsJson).questions as unknown[]
const items = JSON.parse(contentJson).items as unknown[]
const fakeFetch = (text: string) => (async () => new Response(text, { status: 200 })) as unknown as typeof fetch

describe('starter question bank (public/data/starter-questions.json)', () => {
  const parsed = qs.map((q) => QuestionInputSchema.safeParse(q))

  it('every question passes the app schema, is published and honestly labelled', () => {
    const bad = parsed.flatMap((p, i) => (p.success ? [] : [`${(qs[i] as { id: string }).id}: ${p.error.issues[0]?.message}`]))
    expect(bad).toEqual([])
    for (const p of parsed) {
      if (!p.success) continue
      expect(p.data.status).toBe('published')
      expect(p.data.id.startsWith(STARTER_PREFIX)).toBe(true)
      expect(p.data.source.kind).toBe('original')
      expect(p.data.source.label).toMatch(/not (expert-reviewed|independently verified)/)
      expect(p.data.explanation.length).toBeGreaterThan(0)
    }
  })

  it('has about 1,500+ unique questions with every topic in the syllabus', () => {
    const ok = parsed.filter((p) => p.success).map((p) => p.data!)
    expect(ok.length).toBeGreaterThanOrEqual(1500)
    expect(new Set(ok.map((q) => q.id)).size).toBe(ok.length)
    expect(new Set(ok.map(contentKey)).size).toBe(ok.length)
    expect(ok.flatMap((q) => questionWarnings(q).filter((w) => w.startsWith('Topic')))).toEqual([])
    for (const subject of ['Quantitative Aptitude', 'Reasoning', 'English', 'General Awareness'])
      expect(ok.filter((q) => q.subject === subject).length).toBeGreaterThanOrEqual(350)
  })
})

describe('starter content pack (public/data/starter-content.json)', () => {
  it('every entry passes the content schema', () => {
    const bad = items.flatMap((c) => {
      const p = ContentItemSchema.safeParse(c)
      return p.success ? [] : [`${(c as { id: string }).id}: ${p.error.issues[0]?.message}`]
    })
    expect(bad).toEqual([])
    expect(new Set(items.map((c) => (c as { id: string }).id)).size).toBe(items.length)
    const ca = items.filter((c) => (c as { kind: string }).kind === 'current-affairs') as { publishedOn?: string; source: { url?: string } }[]
    expect(ca.length).toBeGreaterThan(0)
    for (const c of ca) expect([c.publishedOn, c.source.url].every(Boolean)).toBe(true)
  })
})

describe('loading the starter material', () => {
  beforeEach(async () => {
    await db.delete()
    await db.open()
  })

  it('imports once, enables full-length mocks for every exam, and can be removed', async () => {
    const r = await loadStarterQuestions(fakeFetch(questionsJson))
    expect(r).toMatchObject({ added: qs.length, rejected: 0 })
    expect((await loadStarterQuestions(fakeFetch(questionsJson))).added).toBe(0) // nothing duplicated
    for (const exam of EXAMS)
      for (const paper of exam.papers) {
        const plan = (await planMock(exam.code, paper.name, null, 1))!
        expect(plan.partial, `${exam.code} ${paper.name}`).toBe(false)
      }
    expect(await removeStarterQuestions()).toBe(qs.length)
    expect(await db.questions.count()).toBe(0)
  }, 120_000)

  it('imports the content pack', async () => {
    expect((await loadStarterContent(fakeFetch(contentJson))).added).toBe(items.length)
  }, 60_000)
})
