import { useEffect, useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowUp, Check, Plus, RefreshCw, SkipForward, Undo2 } from 'lucide-react'
import { Button, Card, EmptyState, Progress, Skeleton, useToast } from '../components/ui'
import { describeDbError } from '../db/db'
import { getPrefs } from '../db/prefs'
import { addDays, localDate, weekday, WEEKDAYS } from '../learning/dates'
import { studyDates, type TaskType } from '../learning/planner'
import {
  addManualTask,
  completeTask,
  generatePlan,
  moveTask,
  plannedVsActual,
  reopenTask,
  rescheduleUnfinished,
  skipTask,
  tasksBetween,
  tasksOn,
  updateTask,
  type Task,
} from '../learning/repo'

const TYPE_LABEL: Record<TaskType, string> = {
  concept: 'Concept study',
  practice: 'Practice',
  drill: 'Timed drill',
  'error-review': 'Error review',
  revision: 'Revision',
  vocabulary: 'Vocabulary',
  mock: 'Mock test',
}
const field = 'min-h-11 rounded-md border border-border bg-surface px-3 text-sm'

function taskLink(t: Task) {
  const q = (o: Record<string, string | undefined>) =>
    new URLSearchParams(Object.entries(o).filter((e): e is [string, string] => !!e[1])).toString()
  switch (t.type) {
    case 'practice':
    case 'concept':
      return `/practice?${q({ mode: t.topic ? 'topic' : 'mixed', subject: t.subject, topic: t.topic })}`
    case 'drill':
      return `/practice?${q({ mode: 'topic', subject: t.subject, topic: t.topic, timed: '1' })}`
    case 'error-review':
      return '/practice?mode=incorrect'
    case 'revision':
    case 'vocabulary':
      return '/revision'
    case 'mock':
      return '/mock-tests'
  }
}

export default function Planner() {
  const toast = useToast()
  const today = localDate()
  const [view, setView] = useState<'day' | 'week'>('day')
  const [date, setDate] = useState(today)
  const prefs = useLiveQuery(() => getPrefs())
  const tasks = useLiveQuery(() => tasksOn(date), [date])
  const week = useLiveQuery(() => tasksBetween(today, addDays(today, 6)), [today])
  const overdue = useLiveQuery(async () => (await tasksBetween('0000-00-00', addDays(today, -1))).filter((t) => t.status === 'pending').length, [today])

  // Make today's plan automatically the first time the planner is opened on a day.
  useEffect(() => {
    if (!prefs?.prefs.examCode || tasks === undefined || date !== today) return
    if (tasks.length === 0) generatePlan([today], today).catch(() => {})
  }, [prefs?.prefs.examCode, tasks === undefined, date, today]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!prefs || !tasks || !week) return <Skeleton className="h-96 w-full" />
  const { examCode, dailyMinutes, studyDays, targetDate } = prefs.prefs

  const run = (fn: () => Promise<unknown>, ok?: string) =>
    fn().then(
      () => ok && toast(ok),
      (e) => toast(describeDbError(e)),
    )
  const regenerate = (dates: string[]) =>
    generatePlan(dates, today).then(
      (r) => toast(r.ok ? 'Plan updated from your latest results' : r.error),
      (e) => toast(describeDbError(e)),
    )

  const stats = plannedVsActual(tasks)
  const restDay = !studyDays.includes(weekday(date))

  return (
    <section className="max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Study planner</h1>
          <p className="mt-1 text-sm text-muted">
            {dailyMinutes} min per day · study days {studyDays.map((d) => WEEKDAYS[d]).join(', ') || 'none'}
            {targetDate && ` · exam on ${targetDate}`} · <Link className="text-accent underline" to="/settings">change</Link>
          </p>
        </div>
        <div role="tablist" aria-label="View" className="flex gap-1 rounded-md border border-border p-1">
          {(['day', 'week'] as const).map((v) => (
            <button key={v} role="tab" type="button" aria-selected={view === v} onClick={() => setView(v)} className={`min-h-9 rounded px-3 text-sm ${view === v ? 'bg-accent-soft text-accent' : ''}`}>
              {v === 'day' ? 'Day' : 'Week'}
            </button>
          ))}
        </div>
      </div>

      {!examCode ? (
        <div className="mt-4">
          <EmptyState title="Choose your exam first">
            Pick your target exam and daily study time in <Link className="text-accent underline" to="/settings">Settings</Link>.
          </EmptyState>
        </div>
      ) : view === 'week' ? (
        <WeekView today={today} week={week} studyDays={studyDays} onOpen={(d) => (setDate(d), setView('day'))} onRegenerate={() => regenerate(studyDates(today, 7, studyDays))} />
      ) : (
        <>
          {!!overdue && (
            <Card className="mt-4 flex flex-wrap items-center justify-between gap-3 border-warning p-4">
              <p className="text-sm">{overdue} unfinished task{overdue === 1 ? '' : 's'} from earlier days.</p>
              <Button variant="secondary" onClick={() => run(() => rescheduleUnfinished(today), 'Moved to today')}>
                Move to today
              </Button>
            </Card>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Button variant="ghost" aria-label="Previous day" onClick={() => setDate(addDays(date, -1))}>
              ‹
            </Button>
            <input type="date" aria-label="Date" className={field} value={date} onChange={(e) => e.target.value && setDate(e.target.value)} />
            <Button variant="ghost" aria-label="Next day" onClick={() => setDate(addDays(date, 1))}>
              ›
            </Button>
            {date !== today && (
              <Button variant="ghost" onClick={() => setDate(today)}>
                Today
              </Button>
            )}
            <Button variant="secondary" className="ml-auto" onClick={() => regenerate([date])} disabled={date < today}>
              <RefreshCw size={16} aria-hidden /> Update plan
            </Button>
          </div>

          <Card className="mt-4 p-4">
            <div className="flex flex-wrap justify-between gap-2 text-sm">
              <span>
                {stats.done} of {stats.total} tasks done
              </span>
              <span className="text-muted">
                Planned {stats.plannedMin} min · actual {stats.actualMin} min
              </span>
            </div>
            <div className="mt-2">
              <Progress value={stats.total ? (stats.done / stats.total) * 100 : 0} label="Tasks done today" />
            </div>
          </Card>

          {restDay && tasks.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="Rest day">This is not one of your study days.</EmptyState>
            </div>
          ) : tasks.length === 0 ? (
            <div className="mt-4">
              <EmptyState title="No tasks for this day">
                Use “Update plan”. If nothing appears, add published questions or practise a little so the planner has data.
              </EmptyState>
            </div>
          ) : (
            <ol className="mt-4 space-y-2">
              {tasks.map((t, i) => (
                <TaskRow key={t.id} t={t} first={i === 0} last={i === tasks.length - 1} run={run} />
              ))}
            </ol>
          )}
          <AddTask date={date} run={run} />
        </>
      )}
    </section>
  )
}

function TaskRow({ t, first, last, run }: { t: Task; first: boolean; last: boolean; run: (fn: () => Promise<unknown>, ok?: string) => void }) {
  const [actual, setActual] = useState(String(t.durationMin))
  const [mins, setMins] = useState(String(t.durationMin))
  const done = t.status === 'done'
  const skipped = t.status === 'skipped'
  return (
    <li className={`animate-page-in rounded-lg border bg-surface p-4 ${done ? 'border-success' : 'border-border'} ${skipped ? 'opacity-60' : ''}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 text-sm font-semibold">
            {TYPE_LABEL[t.type]}
            {t.topic && <span className="font-normal">· {t.topic}</span>}
            <span className="rounded bg-surface-2 px-1.5 py-0.5 text-xs font-medium">{t.priority} priority</span>
            {done && <span className="text-xs font-medium text-success">Done{t.actualMin !== undefined ? ` · ${t.actualMin} min` : ''}</span>}
            {skipped && <span className="text-xs font-medium text-muted">Skipped</span>}
          </p>
          <p className="mt-1 text-xs text-muted">
            {t.durationMin} min{t.questionCount ? ` · ${t.questionCount} ${t.type === 'revision' ? 'items' : 'questions'}` : ''}
          </p>
          <p className="mt-1 text-sm">{t.reason}</p>
        </div>
        <div className="flex shrink-0 flex-col">
          <button type="button" aria-label="Move up" disabled={first} onClick={() => run(() => moveTask(t.id, -1))} className="grid h-11 w-11 place-items-center rounded-md hover:bg-surface-2 disabled:opacity-30">
            <ArrowUp size={16} aria-hidden />
          </button>
          <button type="button" aria-label="Move down" disabled={last} onClick={() => run(() => moveTask(t.id, 1))} className="grid h-11 w-11 place-items-center rounded-md hover:bg-surface-2 disabled:opacity-30">
            <ArrowDown size={16} aria-hidden />
          </button>
        </div>
      </div>
      {t.status === 'pending' ? (
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <Link to={taskLink(t)} className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-medium text-accent-ink">
            Start
          </Link>
          <label className="text-xs">
            Minutes spent
            <input type="number" min={0} max={600} className={`${field} ml-1 w-20`} value={actual} onChange={(e) => setActual(e.target.value)} />
          </label>
          <Button variant="secondary" onClick={() => run(() => completeTask(t.id, Number(actual) || 0), 'Marked as done')}>
            <Check size={16} aria-hidden /> Done
          </Button>
          <Button variant="ghost" onClick={() => run(() => skipTask(t.id))}>
            <SkipForward size={16} aria-hidden /> Skip
          </Button>
          <details className="text-xs">
            <summary className="flex min-h-11 cursor-pointer items-center">Edit</summary>
            <label className="mt-1 block">
              Planned minutes
              <input type="number" min={1} max={600} className={`${field} ml-1 w-20`} value={mins} onChange={(e) => setMins(e.target.value)} />
            </label>
            <Button variant="secondary" className="mt-1" onClick={() => run(() => updateTask(t.id, { durationMin: Math.max(1, Number(mins) || 1) }), 'Task updated')}>
              Save
            </Button>
          </details>
        </div>
      ) : (
        <Button variant="ghost" className="mt-2" onClick={() => run(() => reopenTask(t.id))}>
          <Undo2 size={16} aria-hidden /> Undo
        </Button>
      )}
    </li>
  )
}

function AddTask({ date, run }: { date: string; run: (fn: () => Promise<unknown>, ok?: string) => void }) {
  const [type, setType] = useState<TaskType>('practice')
  const [topic, setTopic] = useState('')
  const [mins, setMins] = useState('15')
  return (
    <details className="mt-4 rounded-lg border border-border bg-surface p-4">
      <summary className="cursor-pointer text-sm font-medium">Add your own task</summary>
      <div className="mt-3 flex flex-wrap items-end gap-2">
        <label className="text-xs">
          Type
          <select className={`${field} mt-1 block`} value={type} onChange={(e) => setType(e.target.value as TaskType)}>
            {(Object.keys(TYPE_LABEL) as TaskType[]).map((k) => (
              <option key={k} value={k}>
                {TYPE_LABEL[k]}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs">
          Topic (optional)
          <input className={`${field} mt-1 block`} value={topic} onChange={(e) => setTopic(e.target.value)} />
        </label>
        <label className="text-xs">
          Minutes
          <input type="number" min={1} max={600} className={`${field} mt-1 block w-24`} value={mins} onChange={(e) => setMins(e.target.value)} />
        </label>
        <Button
          variant="secondary"
          onClick={() => run(() => addManualTask(date, { type, topic: topic.trim() || undefined, durationMin: Math.max(1, Number(mins) || 1) }), 'Task added')}
        >
          <Plus size={16} aria-hidden /> Add
        </Button>
      </div>
    </details>
  )
}

function WeekView({ today, week, studyDays, onOpen, onRegenerate }: { today: string; week: Task[]; studyDays: number[]; onOpen: (d: string) => void; onRegenerate: () => void }) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i))
  return (
    <>
      <div className="mt-4 flex justify-end">
        <Button variant="secondary" onClick={onRegenerate}>
          <RefreshCw size={16} aria-hidden /> Plan the next 7 days
        </Button>
      </div>
      <ul className="mt-3 space-y-2">
        {days.map((d) => {
          const ts = week.filter((t) => t.date === d && t.status !== 'skipped')
          const s = plannedVsActual(ts)
          const rest = !studyDays.includes(weekday(d))
          return (
            <li key={d}>
              <button type="button" onClick={() => onOpen(d)} className="flex w-full flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface p-4 text-left text-sm hover:bg-surface-2">
                <span className="font-medium">
                  {WEEKDAYS[weekday(d)]} {d}
                  {d === today && ' (today)'}
                </span>
                <span className="text-muted">
                  {rest && ts.length === 0 ? 'Rest day' : ts.length === 0 ? 'Not planned' : `${s.done}/${s.total} done · ${s.plannedMin} min · ${[...new Set(ts.map((t) => t.topic).filter(Boolean))].slice(0, 3).join(', ')}`}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}
