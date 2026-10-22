import { beforeEach, describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import template from '../../public/templates/content-template.csv?raw'
import App from '../App'
import { db } from '../db/db'
import { DEV_CONTENT } from '../data/dev-content'
import { seededRng } from '../practice/engine'
import { toCsv } from '../questions/csv'
import { ContentItemSchema } from './schema'
import {
  addToRevision,
  commitContentImport,
  contentToJson,
  itemOfDay,
  loadContent,
  loadDevContent,
  previewContentImport,
  quizOptions,
  removeDevContent,
} from './repo'

const ok = (v: object) => ContentItemSchema.safeParse({ id: 'x', pack: 'p', kind: 'word', front: 'Lucid', back: 'Clear', ...v }).success

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('content schema', () => {
  it('enforces source and labelling rules', () => {
    expect(ok({})).toBe(true)
    expect(ok({ kind: 'polity' })).toBe(false) // must say text vs simplified
    expect(ok({ kind: 'polity', textType: 'simplified' })).toBe(true)
    expect(ok({ kind: 'current-affairs', source: { label: 'PIB' } })).toBe(false) // no date
    expect(ok({ kind: 'current-affairs', publishedOn: '2026-10-01' })).toBe(false) // no source
    expect(ok({ kind: 'current-affairs', publishedOn: '2026-10-01', source: { url: 'https://pib.gov.in' } })).toBe(true)
    expect(ok({ verification: 'verified' })).toBe(false)
    expect(ok({ kind: 'astrology' })).toBe(false)
  })
  it('dev sample is valid, labelled and has no current affairs', () => {
    for (const c of DEV_CONTENT) expect(ContentItemSchema.safeParse(c).success, c.id).toBe(true)
    expect(DEV_CONTENT.every((c) => c.pack === 'dev-sample' && c.verification === 'unverified')).toBe(true)
    expect(DEV_CONTENT.some((c) => c.kind === 'current-affairs')).toBe(false)
  })
})

describe('content import', () => {
  it('accepts the shipped CSV template', async () => {
    const p = await previewContentImport('t.csv', template)
    expect(p.fileErrors).toEqual([])
    expect(p.rows.map((r) => [r.kind, r.errors])).toEqual([['new', []], ['new', []], ['new', []]])
  })

  it('rejects duplicates and invalid rows, skips or updates stored IDs', async () => {
    const head = ['id', 'pack', 'kind', 'front', 'back', 'text_type']
    const csv = (...rows: string[][]) => toCsv([head, ...rows])
    const p = await previewContentImport(
      'a.csv',
      csv(['A', 'p', 'word', 'Lucid', 'Clear', ''], ['A', 'p', 'word', 'Other', 'x', ''], ['B', 'p', 'word', 'lucid!', 'y', ''], ['C', 'p', 'polity', 'Art 1', 'x', '']),
    )
    expect(p.rows.map((r) => r.kind)).toEqual(['new', 'error', 'error', 'error'])
    expect(p.rows[1]!.errors[0]).toMatch(/Duplicate ID/)
    expect(p.rows[2]!.errors[0]).toMatch(/Same entry as line 2/)
    expect(await commitContentImport(p, 'skip-existing')).toEqual({ added: 1, updated: 0, skipped: 0, rejected: 3 })

    const again = await previewContentImport('b.csv', csv(['A', 'p', 'word', 'Lucid', 'Very clear', '']))
    expect(again.rows[0]!.kind).toBe('existing')
    expect(await commitContentImport(again, 'skip-existing')).toMatchObject({ skipped: 1 })
    expect((await loadContent()).items[0]!.back).toBe('Clear')
    await commitContentImport(again, 'update-existing')
    expect((await loadContent()).items[0]!.back).toBe('Very clear')
  })

  it('round-trips through JSON export and rejects the wrong format', async () => {
    await loadDevContent()
    const json = contentToJson((await loadContent()).items)
    await db.contentItems.clear()
    const p = await previewContentImport('c.json', json)
    expect(p.rows.every((r) => r.kind === 'new')).toBe(true)
    expect((await previewContentImport('c.json', '{"items":[]}')).fileErrors[0]).toMatch(/format/)
  })
})

describe('content helpers', () => {
  it('picks the same item of the day for a date', () => {
    const items = [{ id: 'b' }, { id: 'a' }, { id: 'c' }]
    expect(itemOfDay(items, '2026-10-22')).toEqual(itemOfDay([...items].reverse(), '2026-10-22'))
    expect(itemOfDay([], '2026-10-22')).toBeUndefined()
  })
  it('builds quiz options only from stored answers', () => {
    const words = DEV_CONTENT.filter((c) => c.kind === 'word')
    const opts = quizOptions(words[0]!, DEV_CONTENT, seededRng(3))!
    expect(opts).toHaveLength(4)
    expect(new Set(opts).size).toBe(4)
    expect(opts).toContain(words[0]!.back)
    expect(opts.every((o) => words.some((w) => w.back === o))).toBe(true)
    expect(quizOptions(DEV_CONTENT.find((c) => c.kind === 'polity')!, DEV_CONTENT, seededRng(3))).toBeNull() // only 3 polity items
  })
  it('adds items to revision once, and removing the sample removes its cards', async () => {
    await loadDevContent()
    expect(await addToRevision(['DEVC-W1', 'DEVC-W2'])).toBe(2)
    expect(await addToRevision(['DEVC-W1'])).toBe(0)
    expect(await removeDevContent()).toBe(DEV_CONTENT.length)
    expect(await db.revisionItems.count()).toBe(0)
  })
})

describe('study content screen', () => {
  it('loads the sample, adds a word to revision and reviews it as a flashcard', async () => {
    render(
      <MemoryRouter initialEntries={['/content']}>
        <App />
      </MemoryRouter>,
    )
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /Load development sample/ }))
    expect(await screen.findByText('Word of the day')).toBeInTheDocument()
    await user.click(screen.getByRole('tab', { name: /Current affairs/ }))
    expect(screen.getByText('No content here yet')).toBeInTheDocument()

    await addToRevision(['DEVC-G1']) // grammar: only one item, so it is reviewed as a flashcard
    await user.click(screen.getAllByRole('link', { name: 'Revision' })[0]!)
    await user.click(await screen.findByRole('button', { name: 'Start review (1)' }))
    await user.click(screen.getByRole('button', { name: 'Show answer' }))
    expect(screen.getByText(/A singular subject takes a singular verb/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: /^Good/ }))
    expect(await screen.findByText('Reviewed 1')).toBeInTheDocument()
  })
})
