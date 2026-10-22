// Exam patterns as data. Nothing exam-specific should be hardcoded elsewhere.
// 'secondary' = taken from a published summary of the SSC notification, not yet checked
// against the notification PDF on ssc.gov.in. 'unverified' = not checked at all.
export type Verification = 'official' | 'secondary' | 'unverified'
export type Source = { label: string; url: string }

export type Section = {
  name: string
  subject: Subject
  questions: number
  marksPerCorrect: number
  negativePerWrong: number
}
export type Paper = { name: string; durationMin: number; sections: Section[] }
export type Exam = {
  code: string
  name: string
  family: 'SSC' | 'ANI'
  patternVersion: string
  verification: Verification
  sources: Source[]
  note: string
  papers: Paper[]
}

export const SUBJECTS = ['Quantitative Aptitude', 'Reasoning', 'English', 'General Awareness'] as const
export type Subject = (typeof SUBJECTS)[number]

export const SYLLABUS_VERSION = '2026-draft-1'
export const SYLLABUS_VERIFICATION: Verification = 'unverified'

// Common SSC Tier-1 topic list. Not yet checked line-by-line against each notification.
export const SYLLABUS: Record<Subject, string[]> = {
  'Quantitative Aptitude': [
    'Number System', 'Simplification', 'HCF and LCM', 'Percentage', 'Ratio and Proportion',
    'Average', 'Profit and Loss', 'Discount', 'Simple Interest', 'Compound Interest',
    'Time and Work', 'Time, Speed and Distance', 'Mixture and Alligation', 'Algebra',
    'Geometry', 'Mensuration', 'Trigonometry', 'Data Interpretation',
  ],
  Reasoning: [
    'Analogy', 'Classification', 'Series', 'Coding-Decoding', 'Blood Relations',
    'Direction Sense', 'Order and Ranking', 'Syllogism', 'Venn Diagrams',
    'Mathematical Operations', 'Non-verbal Reasoning', 'Puzzles',
  ],
  English: [
    'Reading Comprehension', 'Cloze Test', 'Error Spotting', 'Sentence Improvement',
    'Fill in the Blanks', 'Synonyms', 'Antonyms', 'Idioms and Phrases',
    'One Word Substitution', 'Spelling', 'Active and Passive Voice',
    'Direct and Indirect Speech', 'Para Jumbles',
  ],
  'General Awareness': [
    'History', 'Geography', 'Indian Polity', 'Economics', 'General Science',
    'Computer Awareness', 'Current Affairs', 'Static GK',
  ],
}

const s = (
  name: string,
  subject: Subject,
  questions: number,
  marksPerCorrect: number,
  negativePerWrong: number,
): Section => ({ name, subject, questions, marksPerCorrect, negativePerWrong })

const CHECK = 'Check against the latest official notification at https://ssc.gov.in before relying on it.'

export const EXAMS: Exam[] = [
  {
    code: 'SSC_CGL',
    name: 'SSC CGL (Tier 1)',
    family: 'SSC',
    patternVersion: '2026-09',
    verification: 'secondary',
    sources: [{ label: 'PW: SSC CGL exam pattern (Sep 2026)', url: 'https://www.pw.live/exams/ssc/ssc-cgl-exam-pattern' }],
    note: CHECK,
    papers: [
      {
        name: 'Tier 1',
        durationMin: 60,
        sections: [
          s('General Intelligence and Reasoning', 'Reasoning', 25, 2, 0.5),
          s('General Awareness', 'General Awareness', 25, 2, 0.5),
          s('Quantitative Aptitude', 'Quantitative Aptitude', 25, 2, 0.5),
          s('English Comprehension', 'English', 25, 2, 0.5),
        ],
      },
    ],
  },
  {
    code: 'SSC_CHSL',
    name: 'SSC CHSL (Tier 1)',
    family: 'SSC',
    patternVersion: '2026-09',
    verification: 'secondary',
    sources: [{ label: "Mahendra's: SSC CHSL exam pattern (Sep 2026)", url: 'https://www.mahendras.org/blogs/ssc-chsl-exam-pattern' }],
    note: CHECK,
    papers: [
      {
        name: 'Tier 1',
        durationMin: 60,
        sections: [
          s('English Language', 'English', 25, 2, 0.5),
          s('General Intelligence', 'Reasoning', 25, 2, 0.5),
          s('Quantitative Aptitude', 'Quantitative Aptitude', 25, 2, 0.5),
          s('General Awareness', 'General Awareness', 25, 2, 0.5),
        ],
      },
    ],
  },
  {
    code: 'SSC_MTS',
    name: 'SSC MTS',
    family: 'SSC',
    patternVersion: '2025-notification',
    verification: 'secondary',
    sources: [{ label: 'SATHEE (IIT Kanpur): SSC MTS exam pattern, 2025 notification', url: 'https://sathee.iitk.ac.in/sathee-ssc/ssc-exams/ssc-mts/ssc-details/exam-pattern' }],
    note: `Both sessions are mandatory. ${CHECK}`,
    papers: [
      {
        name: 'Session I',
        durationMin: 45,
        sections: [
          s('Numerical and Mathematical Ability', 'Quantitative Aptitude', 20, 3, 0),
          s('Reasoning Ability and Problem Solving', 'Reasoning', 20, 3, 0),
        ],
      },
      {
        name: 'Session II',
        durationMin: 45,
        sections: [
          s('General Awareness', 'General Awareness', 25, 3, 1),
          s('English Language and Comprehension', 'English', 25, 3, 1),
        ],
      },
    ],
  },
  {
    code: 'SSC_GD',
    name: 'SSC GD Constable (CBE)',
    family: 'SSC',
    patternVersion: '2026-03',
    verification: 'secondary',
    sources: [{ label: 'PW: SSC GD exam pattern 2026 (Mar 2026)', url: 'https://store.pw.live/blogs/ssc-exams/ssc-gd-exam-pattern' }],
    note: CHECK,
    papers: [
      {
        name: 'Computer Based Examination',
        durationMin: 60,
        sections: [
          s('General Intelligence and Reasoning', 'Reasoning', 20, 2, 0.25),
          s('General Knowledge and General Awareness', 'General Awareness', 20, 2, 0.25),
          s('Elementary Mathematics', 'Quantitative Aptitude', 20, 2, 0.25),
          s('English / Hindi', 'English', 20, 2, 0.25),
        ],
      },
    ],
  },
  {
    code: 'ANI',
    name: 'A&N Administration: Combined Matric Level (Group C)',
    family: 'ANI',
    patternVersion: 'Advt. No. 01/ML/2026',
    verification: 'secondary',
    sources: [
      { label: 'Official recruitment portal (check the notification PDF)', url: 'https://erecruitment.andamannicobar.gov.in' },
      { label: 'FreeJobAlert summary of Advt. No. 01/ML/2026 (Jun–Jul 2026)', url: 'https://www.freejobalert.com/articles/andaman-and-nicobar-combined-matric-level-exam-2026-apply-online-for-1535-group-c-posts-3052810' },
    ],
    note: 'Tier I (Tablet Based Test) pattern for the 2026 Matric-level Group C posts; Tier II (physical, skill or trade test) is qualifying only. Other A&N posts (for example graduate-level or Police) use different patterns. Check the official notification before relying on it.',
    papers: [
      {
        name: 'Tier I (Tablet Based Test)',
        durationMin: 120,
        sections: [
          s('General Intelligence and Reasoning', 'Reasoning', 25, 1, 0.25),
          s('Numerical Aptitude', 'Quantitative Aptitude', 25, 1, 0.25),
          s('English Language', 'English', 50, 1, 0.25),
          s('General Awareness', 'General Awareness', 50, 1, 0.25),
        ],
      },
    ],
  },
]

export const examByCode = (code: string | null | undefined) => EXAMS.find((e) => e.code === code)
export const paperQuestions = (p: Paper) => p.sections.reduce((n, x) => n + x.questions, 0)
export const paperTotalMarks = (p: Paper) =>
  p.sections.reduce((n, x) => n + x.questions * x.marksPerCorrect, 0)
