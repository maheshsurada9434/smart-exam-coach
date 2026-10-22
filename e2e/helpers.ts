import { expect, type Page } from '@playwright/test'

export const nav = (page: Page, name: string) =>
  page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name, exact: true }).click()

export async function chooseExam(page: Page, code = 'SSC_CGL') {
  await nav(page, 'Settings')
  await page.getByLabel('Target exam').selectOption(code)
  await page.getByRole('button', { name: 'Save preferences' }).click()
  await expect(page.getByText('Settings saved')).toBeVisible()
}

export async function loadSample(page: Page) {
  await nav(page, 'Settings')
  await page.getByRole('link', { name: 'Open question bank' }).click()
  await page.getByRole('button', { name: 'Load development sample' }).click()
  await expect(page.getByText('Added 14 sample questions')).toBeVisible()
}

/** Correct answers of the published DEV sample questions (see src/data/dev-questions.ts). */
export const SAMPLE_ANSWERS: Record<string, string | number> = {
  'What is 20% of 150?': '30',
  'What is the simple interest on ₹2,000 at 5% per annum for 3 years?': '₹300',
  'What is the average of 12, 15, 18, 21 and 24?': '18',
  'Find the next number: 2, 6, 12, 20, 30, ?': '42',
  'If CAT is coded as DBU, how is DOG coded?': 'EPH',
  'Ravi walks 5 km north, turns right and walks 3 km, then turns right and walks 5 km. How far is he from his starting point?': '3 km',
  'Choose the word closest in meaning to "Abundant".': 'Plentiful',
  'Choose the word opposite in meaning to "Ancient".': 'Modern',
  'A person who cannot read or write:': 'Illiterate',
  'Which Article of the Constitution of India abolishes untouchability?': 'Article 17',
  'What is the capital of the Andaman and Nicobar Islands?': 'Sri Vijaya Puram',
  'What is the chemical symbol of sodium?': 'Na',
  'Calculate 15 × 12.': 180,
}

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Picks an option by its exact text ("B. 30" -> 30). */
export const option = (page: Page, text: string) => page.getByRole('radio', { name: new RegExp(`^[A-F]\\. ${escape(text)}$`) })

export async function answerCorrectly(page: Page, questionText: string) {
  const a = SAMPLE_ANSWERS[questionText]
  if (a === undefined) throw new Error(`No known answer for: ${questionText}`)
  if (typeof a === 'number') await page.getByLabel('Your answer').fill(String(a))
  else await option(page, a).check()
}
