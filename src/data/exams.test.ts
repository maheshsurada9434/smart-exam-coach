import { describe, expect, it } from 'vitest'
import { EXAMS, SUBJECTS, SYLLABUS, examByCode, paperQuestions, paperTotalMarks } from './exams'

describe('exam config', () => {
  it('has unique exam codes and valid sections', () => {
    expect(new Set(EXAMS.map((e) => e.code)).size).toBe(EXAMS.length)
    for (const e of EXAMS)
      for (const p of e.papers) {
        expect(p.durationMin).toBeGreaterThan(0)
        for (const s of p.sections) {
          expect(SUBJECTS).toContain(s.subject)
          expect(s.questions).toBeGreaterThan(0)
          expect(s.marksPerCorrect).toBeGreaterThan(0)
          expect(s.negativePerWrong).toBeGreaterThanOrEqual(0)
        }
      }
  })

  it('matches the totals stated in the cited sources', () => {
    const totals = (code: string) => examByCode(code)!.papers.map((p) => [paperQuestions(p), paperTotalMarks(p)])
    expect(totals('SSC_CGL')).toEqual([[100, 200]])
    expect(totals('SSC_CHSL')).toEqual([[100, 200]])
    expect(totals('SSC_MTS')).toEqual([[40, 120], [50, 150]])
    expect(totals('SSC_GD')).toEqual([[80, 160]])
    expect(totals('ANI')).toEqual([[150, 150]])
  })

  it('never claims official verification without an official source', () => {
    for (const e of EXAMS) if (e.verification === 'official') expect(e.sources.length).toBeGreaterThan(0)
    expect(EXAMS.every((e) => e.verification !== 'official')).toBe(true) // nothing checked against a PDF yet
  })

  it('has topics for every subject', () => {
    for (const s of SUBJECTS) expect(SYLLABUS[s].length).toBeGreaterThan(0)
  })
})
