import { db } from '../db/db'
import { examByCode } from '../data/exams'
import { getPrefs } from '../db/prefs'
import { loadQuestions } from '../questions/repo'
import { isScorable } from '../questions/schema'
import { eligible, latestAttempts } from '../practice/engine'
import { mockHistory } from '../mock/repo'
import { daysBetween, localDate, weekday } from './dates'
import { topicMastery, type MasteryAttempt } from './mastery'
import { bucket, newSm2, review, type Sm2State } from './sm2'
import { recommend, type RecInput, type Recommendation } from './recommend'
import { planDay, type PlannedTask } from './planner'

/* ---------- attempts ---------- */

export async function masteryAttempts(): Promise<MasteryAttempt[]> {
  return (await db.attempts.toArray()).filter(
    (a): a is typeof a & MasteryAttempt =>
      typeof a.questionId === 'string' && typeof a.topic === 'string' && typeof a.correct === 'boolean' && typeof a.createdAt === 'string',
  )
}

/* ---------- revision (SM-2) ---------- */

export type RevisionItem = Sm2State & {
  id: string
  kind: 'question' | 'card'
  refId: string
  reason: string
  createdAt: string
}

const isItem = (r: unknown): r is RevisionItem => {
  const x = r as RevisionItem
  return !!x && typeof x.refId === 'string' && typeof x.due === 'string' && typeof x.easiness === 'number' && typeof x.interval === 'number'
}

export async function revisionItems(): Promise<RevisionItem[]> {
  return (await db.revisionItems.toArray()).filter(isItem)
}

/** Adds questions answered wrongly last time, and bookmarked questions. Existing items are left alone. */
export async function syncQuestionItems(today = localDate(), now = new Date()) {
  const latest = latestAttempts(await masteryAttempts())
  const wrong = [...latest.values()].filter((a) => !a.correct).map((a) => a.questionId)
  const marked = await db.bookmarks.toCollection().primaryKeys()
  const wanted = new Map<string, string>()
  for (const id of marked) wanted.set(id, 'Bookmarked')
  for (const id of wrong) wanted.set(id, 'Answered incorrectly')
  let added = 0
  await db.transaction('rw', db.revisionItems, async () => {
    for (const [qid, reason] of wanted) {
      const id = `q:${qid}`
      if (await db.revisionItems.get(id)) continue
      await db.revisionItems.add({ id, kind: 'question', refId: qid, reason, createdAt: now.toISOString(), ...newSm2(today) })
      added++
    }
  })
  return added
}

export async function revisionCounts(today = localDate()) {
  const items = await revisionItems()
  const c = { overdue: 0, today: 0, upcoming: 0, total: items.length }
  for (const i of items) c[bucket(i.due, today)]++
  return c
}

export async function dueItems(today = localDate()) {
  return (await revisionItems()).filter((i) => i.due <= today).sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : a.id < b.id ? -1 : 1))
}

export async function reviewItem(id: string, quality: number, today = localDate(), now = new Date()) {
  return db.transaction('rw', db.revisionItems, db.reviewLogs, async () => {
    const item = await db.revisionItems.get(id)
    if (!isItem(item)) return null
    const next = review(item, quality, today)
    await db.revisionItems.put({ ...item, ...next })
    await db.reviewLogs.add({
      id: crypto.randomUUID(),
      itemId: id,
      reviewedAt: now.toISOString(),
      quality,
      intervalBefore: item.interval,
      intervalAfter: next.interval,
      dueAfter: next.due,
    })
    return { ...item, ...next }
  })
}

export const removeItem = (id: string) => db.revisionItems.delete(id)

/* ---------- recommendations ---------- */

export async function recommendationInput(today = localDate()): Promise<RecInput & { examCode: string | null; dailyMinutes: number; studyDays: number[] }> {
  const { prefs } = await getPrefs()
  const exam = examByCode(prefs.examCode)
  const { questions } = await loadQuestions()
  const subjects = new Set(exam?.papers.flatMap((p) => p.sections.map((s) => s.subject)) ?? [])
  const counts = new Map<string, { topic: string; subject: string; questions: number }>()
  if (exam)
    for (const q of eligible(questions, { examCode: exam.code }).filter((q) => subjects.has(q.subject) || subjects.size === 0)) {
      const c = counts.get(q.topic) ?? { topic: q.topic, subject: q.subject, questions: 0 }
      c.questions++
      counts.set(q.topic, c)
    }
  const rev = await revisionCounts(today)
  const lastMock = (await mockHistory())[0]
  return {
    examCode: exam?.code ?? null,
    dailyMinutes: prefs.dailyMinutes,
    studyDays: prefs.studyDays,
    mastery: topicMastery(await masteryAttempts()),
    revisionDue: rev.overdue + rev.today,
    revisionOverdue: rev.overdue,
    practisable: [...counts.values()].sort((a, b) => a.topic.localeCompare(b.topic)),
    daysSinceMock: lastMock ? daysBetween(localDate(new Date(lastMock.startedAt)), today) : null,
    canMock: !!exam && exam.papers.length > 0 && questions.some((q) => isScorable(q.status) && q.examCodes.includes(exam.code)),
    daysToExam: prefs.targetDate ? daysBetween(today, prefs.targetDate) : null,
  }
}

export async function recommendations(today = localDate()): Promise<Recommendation[]> {
  const input = await recommendationInput(today)
  return input.examCode ? recommend(input) : []
}

/* ---------- study plan ---------- */

export type Task = PlannedTask & {
  id: string
  date: string
  status: 'pending' | 'done' | 'skipped'
  order: number
  source: 'auto' | 'manual'
  actualMin?: number
  createdAt: string
}

const isTask = (r: unknown): r is Task => {
  const t = r as Task
  return !!t && typeof t.date === 'string' && typeof t.durationMin === 'number' && typeof t.type === 'string' && typeof t.order === 'number'
}

export async function tasksOn(date: string): Promise<Task[]> {
  return (await db.tasks.where('date').equals(date).toArray()).filter(isTask).sort((a, b) => a.order - b.order)
}

export async function tasksBetween(from: string, to: string): Promise<Task[]> {
  return (await db.tasks.where('date').between(from, to, true, true).toArray()).filter(isTask)
}

/**
 * (Re)generates plans for the given dates. Only pending auto-generated tasks are replaced;
 * done, skipped and manually added tasks are kept, and their minutes count against the budget.
 */
export async function generatePlan(dates: string[], today = localDate(), now = new Date()) {
  await syncQuestionItems(today, now)
  const input = await recommendationInput(today)
  if (!input.examCode) return { ok: false as const, error: 'Choose your target exam in Settings first.' }
  const allRecs = recommend(input)
  let mockPlaced = false
  await db.transaction('rw', db.tasks, async () => {
    for (const [i, date] of dates.entries()) {
      const existing = (await db.tasks.where('date').equals(date).toArray()).filter(isTask)
      const replace = existing.filter((t) => t.status === 'pending' && t.source === 'auto')
      await db.tasks.bulkDelete(replace.map((t) => t.id))
      if (!input.studyDays.includes(weekday(date))) continue
      const kept = existing.filter((t) => !replace.includes(t) && t.status !== 'skipped')
      const budget = input.dailyMinutes - kept.reduce((n, t) => n + t.durationMin, 0)
      // Revision is only known for today; one mock per generated range; nothing that repeats a kept task.
      const keptTopics = new Set(kept.map((t) => t.topic).filter(Boolean))
      const keptTypes = new Set(kept.map((t) => t.type))
      const recs = allRecs.filter(
        (r) =>
          (r.kind !== 'revision' || (date === today && !keptTypes.has('revision'))) &&
          (r.kind !== 'mock' || (!mockPlaced && !keptTypes.has('mock'))) &&
          !(r.topic && keptTopics.has(r.topic)),
      )
      const planned = planDay(recs, Math.max(0, budget), i)
      if (planned.some((t) => t.type === 'mock')) mockPlaced = true
      let order = Math.max(0, ...existing.filter((t) => !replace.includes(t)).map((t) => t.order + 1))
      for (const t of planned)
        await db.tasks.add({ ...t, id: crypto.randomUUID(), date, status: 'pending', order: order++, source: 'auto', createdAt: now.toISOString() })
    }
  })
  return { ok: true as const }
}

export async function addManualTask(date: string, t: Pick<PlannedTask, 'type' | 'durationMin'> & { topic?: string }, now = new Date()) {
  const order = Math.max(0, ...(await tasksOn(date)).map((x) => x.order + 1))
  await db.tasks.add({
    ...t,
    id: crypto.randomUUID(),
    date,
    priority: 'medium',
    reason: 'Added by you',
    status: 'pending',
    order,
    source: 'manual',
    createdAt: now.toISOString(),
  })
}

export const updateTask = (id: string, patch: Partial<Pick<Task, 'durationMin' | 'priority' | 'topic' | 'date'>>) =>
  db.tasks.update(id, { ...patch, source: 'manual' }) // an edited task is never replaced by regeneration
export const completeTask = (id: string, actualMin: number) => db.tasks.update(id, { status: 'done', actualMin: Math.max(0, Math.round(actualMin)) })
export const skipTask = (id: string) => db.tasks.update(id, { status: 'skipped' })
export const reopenTask = (id: string) => db.tasks.update(id, { status: 'pending', actualMin: undefined })

export async function moveTask(id: string, dir: -1 | 1) {
  await db.transaction('rw', db.tasks, async () => {
    const t = await db.tasks.get(id)
    if (!isTask(t)) return
    const list = await tasksOn(t.date)
    const i = list.findIndex((x) => x.id === id)
    const other = list[i + dir]
    if (!other) return
    await db.tasks.update(t.id, { order: other.order })
    await db.tasks.update(other.id, { order: t.order })
  })
}

/** Moves unfinished tasks from past days to today (appended after today's tasks). */
export async function rescheduleUnfinished(today = localDate()) {
  return db.transaction('rw', db.tasks, async () => {
    const old = (await db.tasks.where('date').below(today).toArray()).filter(isTask).filter((t) => t.status === 'pending')
    let order = Math.max(0, ...(await tasksOn(today)).map((x) => x.order + 1))
    for (const t of old.sort((a, b) => (a.date === b.date ? a.order - b.order : a.date < b.date ? -1 : 1)))
      await db.tasks.update(t.id, { date: today, order: order++, source: 'manual' })
    return old.length
  })
}

export function plannedVsActual(tasks: Task[]) {
  const active = tasks.filter((t) => t.status !== 'skipped')
  return {
    plannedMin: active.reduce((n, t) => n + t.durationMin, 0),
    doneMin: active.filter((t) => t.status === 'done').reduce((n, t) => n + t.durationMin, 0),
    actualMin: active.reduce((n, t) => n + (t.actualMin ?? 0), 0),
    done: active.filter((t) => t.status === 'done').length,
    total: active.length,
  }
}
