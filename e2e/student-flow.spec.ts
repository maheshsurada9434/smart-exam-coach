import { readFileSync } from 'node:fs'
import { expect, test } from '@playwright/test'
import { answerCorrectly, chooseExam, loadSample, nav, option } from './helpers'

// The 12-step journey from the specification, section 25, on the production build.
test('new student: practice → dashboard → planner → revision → mock → backup → restore', async ({ page }) => {
  // 1. A new student opens the application.
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Welcome to Smart Exam Coach' })).toBeVisible()

  // 2. The student selects an examination (and loads the labelled sample questions).
  await chooseExam(page)
  await loadSample(page)

  // 3–5. Practice session; answers are recorded.
  await nav(page, 'Practice')
  await page.getByRole('radio', { name: 'One topic' }).check()
  await page.getByLabel('Topic').selectOption('Percentage')
  await page.getByRole('button', { name: /Start practice/ }).click()
  await expect(page.getByText('What is 20% of 150?')).toBeVisible()
  await option(page, '30').check()
  await page.getByRole('button', { name: 'Check answer' }).click()
  await expect(page.getByText('Correct', { exact: true })).toBeVisible()
  await expect(page.getByText(/150 × 20 ÷ 100 = 30/)).toBeVisible()
  await page.getByRole('button', { name: 'Finish' }).click()
  await expect(page.getByRole('heading', { name: 'Practice results' })).toBeVisible()

  await nav(page, 'Practice')
  await page.getByRole('radio', { name: 'One topic' }).check()
  await page.getByLabel('Topic').selectOption('Average')
  await page.getByRole('button', { name: /Start practice/ }).click()
  await option(page, '16').check() // wrong on purpose
  await page.getByRole('button', { name: 'Check answer' }).click()
  await expect(page.getByText('Incorrect', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Finish' }).click()

  // 6. The dashboard updates from the recorded attempts.
  await nav(page, 'Dashboard')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByText('Questions attempted').locator('..')).toContainText('2')
  await expect(page.getByText('50%', { exact: true })).toBeVisible()

  // 7. The planner recommends a suitable task (the wrong answer is due for revision).
  await nav(page, 'Study Planner')
  await expect(page.getByText(/1 revision item is due today/).first()).toBeVisible()

  // 8. The student completes revision.
  await nav(page, 'Revision')
  await page.getByRole('button', { name: 'Start review (1)' }).click()
  await option(page, '18').check()
  await page.getByRole('button', { name: 'Check answer' }).click()
  await page.getByRole('button', { name: /^Good/ }).click()
  await expect(page.getByRole('heading', { name: 'Review finished' })).toBeVisible()

  // 9–10. Mock test: answer one question correctly, submit, check score and review.
  await nav(page, 'Mock Tests')
  await page.getByRole('button', { name: 'Start partial test' }).click()
  await expect(page.getByRole('timer')).toBeVisible()
  await expect(page.getByText('Correct answer')).toHaveCount(0) // no answers during the test
  const first = (await page.locator('main p.text-base').first().textContent())!.trim()
  await answerCorrectly(page, first)
  await page.getByRole('button', { name: 'Submit test' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Submit', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Mock test result' })).toBeVisible()
  // 13 published sample questions × 2 marks; one correct, none wrong.
  await expect(page.getByText('2 / 26').first()).toBeVisible()
  await expect(page.getByText('Correct answer').first()).toBeVisible()

  // 11. Export a backup.
  await nav(page, 'Settings')
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Download backup' }).click()])
  const file = await download.path()
  const backup = JSON.parse(readFileSync(file, 'utf8'))
  expect([backup.app, backup.kind, backup.version]).toEqual(['smart-exam-coach', 'student-backup', 1])
  expect(backup.data.attempts.length).toBeGreaterThanOrEqual(3)

  // 12. Lose the browser data, then validate and restore the backup.
  await page.evaluate(
    () =>
      new Promise((resolve) => {
        const r = indexedDB.deleteDatabase('smart-exam-coach')
        r.onsuccess = r.onerror = () => resolve(null)
      }),
  )
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Welcome to Smart Exam Coach' })).toBeVisible()
  await nav(page, 'Settings')
  await page.locator('input[type=file]').setInputFiles(file)
  await expect(page.getByText(/Backup from/)).toBeVisible()
  await page.getByRole('button', { name: 'Replace my data' }).click()
  await page.getByRole('dialog').getByRole('button', { name: 'Replace', exact: true }).click()
  await expect(page.getByText(/Restored \d+ records/)).toBeVisible()
  await nav(page, 'Dashboard')
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible()
  await expect(page.getByText('Questions attempted').locator('..')).toContainText(String(backup.data.attempts.length))
})
