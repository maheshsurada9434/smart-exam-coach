import { z } from 'zod'
import { db } from './db'

export const PrefsSchema = z.object({
  id: z.literal('prefs'),
  examCode: z.string().nullable(),
  dailyMinutes: z.number().int().min(10).max(720),
  studyDays: z.array(z.number().int().min(0).max(6)).max(7),
  targetDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
})
export type Prefs = z.infer<typeof PrefsSchema>

export const DEFAULT_PREFS: Prefs = {
  id: 'prefs',
  examCode: null,
  dailyMinutes: 60,
  studyDays: [0, 1, 2, 3, 4, 5, 6],
  targetDate: null,
}

// A malformed stored row is reported, never deleted; it is only replaced when the student saves.
export async function getPrefs(): Promise<{ prefs: Prefs; malformed: boolean }> {
  const row = await db.prefs.get('prefs')
  if (!row) return { prefs: DEFAULT_PREFS, malformed: false }
  const parsed = PrefsSchema.safeParse(row)
  return parsed.success ? { prefs: parsed.data, malformed: false } : { prefs: DEFAULT_PREFS, malformed: true }
}

export async function savePrefs(patch: Partial<Omit<Prefs, 'id'>>): Promise<Prefs> {
  const { prefs } = await getPrefs()
  const next = PrefsSchema.parse({ ...prefs, ...patch, id: 'prefs' })
  await db.prefs.put(next)
  return next
}
