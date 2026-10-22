import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'
import { chooseExam, loadSample } from './helpers'

const ROUTES = ['', 'planner', 'practice', 'mock-tests', 'revision', 'performance', 'syllabus', 'bookmarks', 'settings', 'question-bank', 'content']

test('deep links and refreshes work on the static host', async ({ page }) => {
  await page.goto('./#/syllabus')
  await expect(page.getByRole('heading', { name: 'Syllabus', level: 1 })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Syllabus', level: 1 })).toBeVisible()
})

for (const width of [320, 375]) {
  test(`no horizontal scrolling at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 740 })
    await page.goto('./')
    await chooseExamMobile(page)
    for (const r of ROUTES) {
      await page.goto(`./#/${r}`)
      await expect(page.locator('main h1').first()).toBeVisible()
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)
      expect(overflow, `/${r} overflows by ${overflow}px`).toBeLessThanOrEqual(0)
    }
  })
}

// Mobile has no sidebar, so set the exam through the Settings page directly.
async function chooseExamMobile(page: import('@playwright/test').Page) {
  await page.goto('./#/settings')
  await page.getByLabel('Target exam').selectOption('SSC_CGL')
  await page.getByRole('button', { name: 'Save preferences' }).click()
  await expect(page.getByText('Settings saved')).toBeVisible()
}

test('respects prefers-reduced-motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto('./')
  const ms = await page.locator('main').evaluate((el) => parseFloat(getComputedStyle(el).animationDuration) * 1000)
  expect(ms).toBeLessThan(1)
})

for (const theme of ['light', 'dark'] as const) {
  test(`no serious or critical accessibility violations (${theme})`, async ({ page }) => {
    await page.goto('./')
    await chooseExam(page)
    await loadSample(page)
    if (theme === 'dark') await page.getByRole('button', { name: 'Switch to dark mode' }).click()
    const problems: string[] = []
    for (const r of ROUTES) {
      await page.goto(`./#/${r}`)
      await expect(page.locator('main h1').first()).toBeVisible()
      await page.waitForTimeout(300) // let entrance animations finish before checking contrast
      const res = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze()
      for (const v of res.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical'))
        problems.push(`/${r}: ${v.id} (${v.impact}) ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)
    }
    expect(problems, problems.join('\n')).toEqual([])
  })
}

test('works offline after the first visit', async ({ page, context }) => {
  await page.goto('./')
  await expect(page.getByRole('heading', { name: 'Welcome to Smart Exam Coach' })).toBeVisible()
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload() // now controlled by the service worker
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Welcome to Smart Exam Coach' })).toBeVisible()
  await page.goto('./#/practice') // lazily loaded screen, precached at install
  await expect(page.getByRole('heading', { name: 'Practice', level: 1 })).toBeVisible()
  await context.setOffline(false)
})
