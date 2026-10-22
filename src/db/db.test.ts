import { beforeEach, describe, expect, it } from 'vitest'
import { DB_NAME, ExamDB, db, describeDbError } from './db'
import { DEFAULT_PREFS, getPrefs, savePrefs } from './prefs'
import { exportBackup, parseBackup, restoreBackup } from './backup'

beforeEach(async () => {
  await db.delete()
  await db.open()
})

describe('database', () => {
  it('opens empty with schema version 1 and default prefs', async () => {
    expect(db.verno).toBe(1)
    expect(await db.attempts.count()).toBe(0)
    expect(await getPrefs()).toEqual({ prefs: DEFAULT_PREFS, malformed: false })
  })

  it('keeps data when the database is reopened (no clearing on startup)', async () => {
    await db.attempts.add({ id: 'a1', questionId: 'q1' })
    db.close()
    const again = new ExamDB(DB_NAME)
    await again.open()
    expect(await again.attempts.get('a1')).toEqual({ id: 'a1', questionId: 'q1' })
    again.close()
    await db.open()
  })

  it('reports malformed prefs without deleting them', async () => {
    await db.prefs.put({ id: 'prefs', dailyMinutes: 'lots' })
    expect(await getPrefs()).toEqual({ prefs: DEFAULT_PREFS, malformed: true })
    expect(await db.prefs.get('prefs')).toEqual({ id: 'prefs', dailyMinutes: 'lots' })
  })

  it('validates prefs on save', async () => {
    await savePrefs({ examCode: 'SSC_CGL', dailyMinutes: 90 })
    expect((await getPrefs()).prefs).toMatchObject({ examCode: 'SSC_CGL', dailyMinutes: 90 })
    await expect(savePrefs({ dailyMinutes: 5 })).rejects.toThrow()
    expect((await getPrefs()).prefs.dailyMinutes).toBe(90)
  })

  it('explains storage-full errors', () => {
    const e = new Error('full')
    e.name = 'QuotaExceededError'
    expect(describeDbError(e)).toMatch(/storage is full/)
  })
})

describe('backup', () => {
  it('round-trips through export, parse and replace', async () => {
    await savePrefs({ examCode: 'SSC_GD' })
    await db.attempts.bulkAdd([{ id: 'a1' }, { id: 'a2' }])
    await db.questions.add({ id: 'q1' })
    const text = JSON.stringify(await exportBackup(new Date('2026-10-22T00:00:00Z')))

    await db.attempts.clear()
    await db.attempts.add({ id: 'other' })
    const parsed = parseBackup(text)
    expect(parsed.ok).toBe(true)
    if (!parsed.ok) return
    expect(parsed.counts.attempts).toBe(2)
    await restoreBackup(parsed.backup, 'replace')

    expect((await db.attempts.toArray()).map((r) => r.id).sort()).toEqual(['a1', 'a2'])
    expect((await getPrefs()).prefs.examCode).toBe('SSC_GD')
    expect(await db.questions.count()).toBe(1) // question bank untouched
  })

  it('merge adds new rows and never overwrites existing ones', async () => {
    await db.attempts.bulkAdd([{ id: 'a1', v: 'mine' }])
    const backup = await exportBackup()
    backup.data.attempts = [{ id: 'a1', v: 'backup' }, { id: 'a2', v: 'backup' }]
    expect(await restoreBackup(backup, 'merge')).toEqual({ added: 1, skipped: 1 })
    expect(await db.attempts.get('a1')).toEqual({ id: 'a1', v: 'mine' })
    expect(await db.attempts.get('a2')).toEqual({ id: 'a2', v: 'backup' })
  })

  it('rejects invalid files without touching data', async () => {
    const valid = await exportBackup()
    const bad = (patch: object) => parseBackup(JSON.stringify({ ...valid, ...patch }))
    expect(parseBackup('not json').ok).toBe(false)
    expect(bad({ app: 'other' }).ok).toBe(false)
    expect(bad({ version: 2 }).ok).toBe(false)
    expect(bad({ data: { attempts: 'x' } }).ok).toBe(false)
    expect(bad({ data: { attempts: [{ noId: 1 }] } }).ok).toBe(false)
    expect(bad({ data: { unknownTable: [] } }).ok).toBe(false)
    expect(bad({ data: { attempts: [{ id: 'a' }, { id: 'a' }] } }).ok).toBe(false)
    expect(bad({ data: { prefs: [{ id: 'prefs', dailyMinutes: -1 }] } }).ok).toBe(false)
    expect(bad({ data: {} }).ok).toBe(true) // missing tables are treated as empty
  })
})
