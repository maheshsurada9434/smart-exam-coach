import { db } from '../db/db'
import { DEV_CONTENT, DEV_PACK } from '../data/dev-content'
import { localDate } from '../learning/dates'
import { newSm2 } from '../learning/sm2'
import { parseCsv } from '../questions/csv'
import { formatIssues, normalize } from '../questions/schema'
import { CONTENT_FORMAT, CONTENT_VERSION, ContentItemSchema, type ContentItem } from './schema'

export async function loadContent(): Promise<{ items: ContentItem[]; malformed: number }> {
  const rows = await db.contentItems.toArray()
  const items: ContentItem[] = []
  for (const r of rows) {
    const p = ContentItemSchema.safeParse(r)
    if (p.success) items.push(p.data)
  }
  return { items, malformed: rows.length - items.length }
}

const contentKey = (c: { kind: string; front: string; language?: string }) => `${c.language ?? 'en'}::${c.kind}::${normalize(c.front)}`

/* ---------- import ---------- */

export const CONTENT_CSV_REQUIRED = ['id', 'pack', 'kind', 'front', 'back']
const list = (v?: string) => (v ? v.split('|').map((x) => x.trim()).filter(Boolean) : [])
const o = (v?: string) => v || undefined

function csvRecords(text: string): { records: { line: number; value: unknown }[]; fileErrors: string[] } {
  const rows = parseCsv(text)
  const header = (rows[0] ?? []).map((h) => h.trim().toLowerCase())
  const missing = CONTENT_CSV_REQUIRED.filter((c) => !header.includes(c))
  if (!rows.length) return { records: [], fileErrors: ['The file is empty.'] }
  if (missing.length) return { records: [], fileErrors: [`Missing required columns: ${missing.join(', ')}`] }
  return {
    fileErrors: [],
    records: rows.slice(1).map((r, i) => {
      const d = Object.fromEntries(header.map((h, j) => [h, (r[j] ?? '').trim()]))
      return {
        line: i + 2,
        value: {
          id: d.id, pack: d.pack, kind: (d.kind ?? '').toLowerCase(), front: d.front, back: d.back, telugu: o(d.telugu),
          synonyms: list(d.synonyms), antonyms: list(d.antonyms), examples: list(d.examples), article: o(d.article),
          textType: o(d.text_type), source: { label: o(d.source_label), url: o(d.source_url) }, publishedOn: o(d.published_on),
          reviewedOn: o(d.reviewed_on), tags: list(d.tags), verification: o(d.verification?.toLowerCase()), language: o(d.language),
        },
      }
    }),
  }
}

function jsonRecords(text: string): { records: { line: number; value: unknown }[]; fileErrors: string[] } {
  let j: { format?: unknown; version?: unknown; pack?: { id?: unknown }; items?: unknown }
  try {
    j = JSON.parse(text)
  } catch {
    return { records: [], fileErrors: ['This file is not valid JSON.'] }
  }
  if (j?.format !== CONTENT_FORMAT || j.version !== CONTENT_VERSION || !Array.isArray(j.items))
    return { records: [], fileErrors: [`JSON must be {"format":"${CONTENT_FORMAT}","version":${CONTENT_VERSION},"pack":{"id":...},"items":[...]}`] }
  const packId = typeof j.pack?.id === 'string' ? j.pack.id : undefined
  return { fileErrors: [], records: j.items.map((v, i) => ({ line: i + 1, value: { pack: packId, ...(v as object) } })) }
}

export type ContentPreviewRow = { line: number; id: string; kind: 'new' | 'existing' | 'error'; errors: string[]; item?: ContentItem }
export type ContentPreview = { fileName: string; fileErrors: string[]; rows: ContentPreviewRow[] }

export async function previewContentImport(fileName: string, text: string): Promise<ContentPreview> {
  const isJson = /\.json$/i.test(fileName) || text.trimStart().startsWith('{')
  const { records, fileErrors } = isJson ? jsonRecords(text) : csvRecords(text)
  const rows: ContentPreviewRow[] = records.map(({ line, value }) => {
    const p = ContentItemSchema.safeParse(value)
    const id = String((value as { id?: unknown })?.id ?? '')
    return p.success ? { line, id: p.data.id, kind: 'new', errors: [], item: p.data } : { line, id, kind: 'error', errors: formatIssues(p.error) }
  })
  const fail = (r: ContentPreviewRow, msg: string) => Object.assign(r, { kind: 'error', item: undefined, errors: [...r.errors, msg] })
  const ids = new Map<string, number>()
  const keys = new Map<string, number>()
  for (const r of rows) {
    if (!r.item) continue
    const k = contentKey(r.item)
    if (ids.has(r.id)) fail(r, `Duplicate ID in this file (first used on line ${ids.get(r.id)})`)
    else if (keys.has(k)) fail(r, `Same entry as line ${keys.get(k)} in this file`)
    else {
      ids.set(r.id, r.line)
      keys.set(k, r.line)
    }
  }
  const stored = await loadContent()
  const storedIds = new Set(stored.items.map((c) => c.id))
  const storedKeys = new Map(stored.items.map((c) => [contentKey(c), c.id]))
  for (const r of rows) {
    if (!r.item) continue
    const other = storedKeys.get(contentKey(r.item))
    if (other && other !== r.id) fail(r, `Same entry already stored as "${other}"`)
    else if (storedIds.has(r.id)) r.kind = 'existing'
  }
  return { fileName, fileErrors, rows }
}

export async function commitContentImport(preview: ContentPreview, mode: 'skip-existing' | 'update-existing') {
  const res = { added: 0, updated: 0, skipped: 0, rejected: 0 }
  await db.transaction('rw', db.contentItems, async () => {
    for (const r of preview.rows) {
      if (!r.item) res.rejected++
      else if (r.kind === 'existing' && mode === 'skip-existing') res.skipped++
      else {
        await db.contentItems.put(r.item)
        res[r.kind === 'existing' ? 'updated' : 'added']++
      }
    }
  })
  return res
}

export const contentToJson = (items: ContentItem[], packId = 'export') =>
  JSON.stringify({ format: CONTENT_FORMAT, version: CONTENT_VERSION, pack: { id: packId }, items }, null, 2)

/* ---------- development sample ---------- */

export async function loadDevContent() {
  let added = 0
  await db.transaction('rw', db.contentItems, async () => {
    for (const c of DEV_CONTENT) {
      if (await db.contentItems.get(c.id)) continue
      await db.contentItems.add(ContentItemSchema.parse(c))
      added++
    }
  })
  return added
}

export async function removeDevContent() {
  const ids = (await db.contentItems.where('pack').equals(DEV_PACK).primaryKeys()) as string[]
  await db.transaction('rw', db.contentItems, db.revisionItems, async () => {
    await db.contentItems.bulkDelete(ids)
    await db.revisionItems.bulkDelete(ids.map((id) => `c:${id}`))
  })
  return ids.length
}

/* ---------- revision and daily items ---------- */

export async function addToRevision(itemIds: string[], today = localDate(), now = new Date()) {
  let added = 0
  await db.transaction('rw', db.revisionItems, async () => {
    for (const id of itemIds) {
      if (await db.revisionItems.get(`c:${id}`)) continue
      await db.revisionItems.add({ id: `c:${id}`, kind: 'card', refId: id, reason: 'Added from study content', createdAt: now.toISOString(), ...newSm2(today) })
      added++
    }
  })
  return added
}

/** Same item for everyone on the same date; changes daily. */
export function itemOfDay<T extends { id: string }>(items: T[], today: string): T | undefined {
  if (!items.length) return undefined
  let h = 0
  for (const ch of today) h = (h * 31 + ch.charCodeAt(0)) >>> 0
  return [...items].sort((a, b) => (a.id < b.id ? -1 : 1))[h % items.length]
}

/** Four options (the right answer + three other stored answers of the same kind), or null if too few. */
export function quizOptions(item: ContentItem, pool: ContentItem[], rng: () => number): string[] | null {
  const others = [...new Set(pool.filter((c) => c.kind === item.kind && c.id !== item.id && normalize(c.back) !== normalize(item.back)).map((c) => c.back))]
  if (others.length < 3) return null
  const pick = others
    .map((b) => ({ b, r: rng() }))
    .sort((a, b) => a.r - b.r)
    .slice(0, 3)
    .map((x) => x.b)
  return [...pick, item.back].map((b) => ({ b, r: rng() })).sort((a, b) => a.r - b.r).map((x) => x.b)
}
