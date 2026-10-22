import type { QuestionInput } from '../questions/schema'

// DEVELOPMENT SAMPLE ONLY. Simple original questions written for testing the app.
// Not previous-year questions and not official content. Loaded only when the user asks.
const ALL = ['SSC_CGL', 'SSC_CHSL', 'SSC_MTS', 'SSC_GD', 'ANI']
const src = { kind: 'dev-sample' as const, label: 'DEV SAMPLE: written for app testing, not exam content' }
const mcq = (
  id: string,
  subject: QuestionInput['subject'],
  topic: string,
  text: string,
  options: string[],
  correctOption: number,
  explanation: string,
  difficulty: 'easy' | 'medium' | 'hard' = 'easy',
): QuestionInput => ({
  id, examCodes: ALL, subject, topic, language: 'en', text, explanation, solutionSteps: [],
  difficulty, source: src, status: 'published', type: 'mcq', options, correctOption,
})

export const DEV_QUESTIONS: QuestionInput[] = [
  mcq('DEV-001', 'Quantitative Aptitude', 'Percentage', 'What is 20% of 150?', ['25', '30', '35', '40'], 1,
    '20% of 150 = 150 × 20 ÷ 100 = 30.'),
  mcq('DEV-002', 'Quantitative Aptitude', 'Simple Interest',
    'What is the simple interest on ₹2,000 at 5% per annum for 3 years?', ['₹300', '₹250', '₹350', '₹600'], 0,
    'SI = P × R × T ÷ 100 = 2000 × 5 × 3 ÷ 100 = ₹300.'),
  mcq('DEV-003', 'Quantitative Aptitude', 'Average', 'What is the average of 12, 15, 18, 21 and 24?',
    ['16', '17', '18', '19'], 2, 'Sum = 90 and there are 5 numbers, so the average is 90 ÷ 5 = 18.'),
  mcq('DEV-004', 'Reasoning', 'Series', 'Find the next number: 2, 6, 12, 20, 30, ?', ['40', '42', '44', '36'], 1,
    'The differences are 4, 6, 8, 10, so the next difference is 12: 30 + 12 = 42.', 'medium'),
  mcq('DEV-005', 'Reasoning', 'Coding-Decoding', 'If CAT is coded as DBU, how is DOG coded?',
    ['EPH', 'DPH', 'EOH', 'FPH'], 0, 'Each letter moves one place forward: D→E, O→P, G→H, giving EPH.'),
  mcq('DEV-006', 'Reasoning', 'Direction Sense',
    'Ravi walks 5 km north, turns right and walks 3 km, then turns right and walks 5 km. How far is he from his starting point?',
    ['8 km', '13 km', '3 km', '5 km'], 2,
    'North 5 km, then east 3 km, then south 5 km. The north and south walks cancel out, leaving him 3 km east of the start.', 'medium'),
  mcq('DEV-007', 'English', 'Synonyms', 'Choose the word closest in meaning to "Abundant".',
    ['Scarce', 'Plentiful', 'Rare', 'Meagre'], 1, '"Abundant" means existing in large quantities, i.e. plentiful.'),
  mcq('DEV-008', 'English', 'Antonyms', 'Choose the word opposite in meaning to "Ancient".',
    ['Old', 'Antique', 'Modern', 'Aged'], 2, '"Ancient" means very old; its opposite is "modern".'),
  mcq('DEV-009', 'English', 'One Word Substitution', 'A person who cannot read or write:',
    ['Illiterate', 'Ignorant', 'Innocent', 'Amateur'], 0, 'A person unable to read or write is "illiterate".'),
  mcq('DEV-010', 'General Awareness', 'Indian Polity', 'Which Article of the Constitution of India abolishes untouchability?',
    ['Article 14', 'Article 17', 'Article 21', 'Article 32'], 1,
    'Article 17 abolishes untouchability and forbids its practice in any form.'),
  mcq('DEV-011', 'General Awareness', 'Geography', 'What is the capital of the Andaman and Nicobar Islands?',
    ['Sri Vijaya Puram', 'Car Nicobar', 'Diglipur', 'Mayabunder'], 0,
    'The capital, earlier called Port Blair, was renamed Sri Vijaya Puram in September 2024.'),
  mcq('DEV-012', 'General Awareness', 'General Science', 'What is the chemical symbol of sodium?',
    ['So', 'Sd', 'Na', 'S'], 2, 'Sodium has the symbol Na, from its Latin name "natrium".'),
  {
    id: 'DEV-013', examCodes: ALL, subject: 'Quantitative Aptitude', topic: 'Simplification', language: 'en',
    text: 'Calculate 15 × 12.', explanation: '15 × 12 = 15 × 10 + 15 × 2 = 150 + 30 = 180.', solutionSteps: ['15 × 10 = 150', '15 × 2 = 30', '150 + 30 = 180'],
    difficulty: 'easy', source: src, status: 'published', type: 'numerical', correctValue: 180, tolerance: 0,
  },
  {
    id: 'DEV-014', examCodes: ALL, subject: 'Quantitative Aptitude', topic: 'Simplification', language: 'en',
    text: 'What is 7 × 8?', explanation: '', solutionSteps: [], difficulty: 'easy', source: src, status: 'draft',
    type: 'mcq', options: ['54', '56', '58', '64'], correctOption: 1,
  },
]
