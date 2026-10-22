import { mkdirSync } from 'node:fs'
import { expect, test, type Page } from '@playwright/test'
import { chooseExam, loadSample, nav, option } from './helpers'

// Screenshots for design review (published to the `screenshots` branch by CI). Reduced motion keeps them stable.
mkdirSync('screenshots', { recursive: true })
const shot = (page: Page, name: string) => page.screenshot({ path: `screenshots/${name}.png` })

async function seed(page: Page) {
  await page.goto('./')
  await chooseExam(page)
  await loadSample(page)
  await nav(page, 'Practice')
  await page.getByRole('radio', { name: 'One topic' }).check()
  await page.getByRole('combobox', { name: /^Topic/ }).selectOption('Percentage')
  await page.getByRole('button', { name: /Start practice/ }).click()
  await option(page, '30').check()
  await page.getByRole('button', { name: 'Check answer' }).click()
  await expect(page.getByText('Correct', { exact: true })).toBeVisible()
}

for (const theme of ['light', 'dark'] as const) {
  test(`desktop screenshots (${theme})`, async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: theme })
    await page.setViewportSize({ width: 1280, height: 820 })
    await page.goto('./')
    if (theme === 'dark') await page.getByRole('button', { name: 'Switch to dark mode' }).click()
    await shot(page, `desktop-${theme}-welcome`)
    await seed(page)
    await shot(page, `desktop-${theme}-practice`)
    await nav(page, 'Dashboard')
    await expect(page.getByText(/Recommended next/)).toBeVisible()
    await shot(page, `desktop-${theme}-dashboard`)
    await nav(page, 'Mock Tests')
    await page.getByRole('button', { name: 'Start partial test' }).click()
    await expect(page.getByRole('timer')).toBeVisible()
    await shot(page, `desktop-${theme}-mock`)
  })
}

test('phone screenshots (light)', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('./')
  await shot(page, 'phone-light-welcome')
  await page.goto('./#/settings')
  await page.getByLabel('Target exam').selectOption('SSC_CGL')
  await page.getByRole('button', { name: 'Save preferences' }).click()
  await page.getByRole('link', { name: 'Open question bank' }).click()
  await page.getByRole('button', { name: 'Load development sample' }).click()
  await expect(page.getByText('Added 14 sample questions')).toBeVisible()
  await page.goto('./#/practice')
  await page.getByRole('radio', { name: 'One topic' }).check()
  await page.getByRole('combobox', { name: /^Topic/ }).selectOption('Percentage')
  await page.getByRole('button', { name: /Start practice/ }).click()
  await option(page, '30').check()
  await page.getByRole('button', { name: 'Check answer' }).click()
  await shot(page, 'phone-light-practice')
  await page.goto('./#/')
  await expect(page.getByText(/Recommended next/)).toBeVisible()
  await shot(page, 'phone-light-dashboard')
})
