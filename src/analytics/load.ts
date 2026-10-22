import { db } from '../db/db'
import { getPrefs } from '../db/prefs'
import { examByCode, SYLLABUS } from '../data/exams'
import { mockHistory } from '../mock/repo'
import { localDate } from '../learning/dates'
import { topicMastery } from '../learning/mastery'
import { recommendations, revisionCounts, tasksOn, masteryAttempts } from '../learning/repo'
import type { Att } from './stats'

export async function loadAttempts(): Promise<Att[]> {
  return (await masteryAttempts()) as Att[]
}

/** Topics in the syllabus of an exam (all subjects of its pattern; all subjects if no pattern). */
export function syllabusTopics(examCode: string | null) {
  const exam = examByCode(examCode)
  const subjects = exam?.papers.length
    ? [...new Set(exam.papers.flatMap((p) => p.sections.map((s) => s.subject)))]
    : (Object.keys(SYLLABUS) as (keyof typeof SYLLABUS)[])
  return subjects.flatMap((s) => SYLLABUS[s])
}

export async function loadOverview(today = localDate()) {
  const { prefs } = await getPrefs()
  const attempts = await loadAttempts()
  const sessions = await db.sessions.toArray()
  return {
    prefs,
    attempts,
    mastery: topicMastery(attempts),
    mocks: await mockHistory(),
    revision: await revisionCounts(today),
    todayTasks: await tasksOn(today),
    recommendations: prefs.examCode ? await recommendations(today) : [],
    questionCount: await db.questions.count(),
    reviewLogs: await db.reviewLogs.toArray(),
    recentSessions: sessions
      .filter((s) => (s.status === 'completed' || s.status === 'active') && typeof s.startedAt === 'string')
      .sort((a, b) => (String(a.startedAt) < String(b.startedAt) ? 1 : -1))
      .slice(0, 5),
  }
}
export type Overview = Awaited<ReturnType<typeof loadOverview>>
