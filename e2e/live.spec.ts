import { expect, test } from '@playwright/test'

// Runs only after deploy, against the real GitHub Pages URL (E2E_BASE_URL).
test('live site: assets, routing, IndexedDB, service worker and offline', async ({ page, context }) => {
  const failed: string[] = []
  page.on('response', (r) => r.status() >= 400 && failed.push(`${r.status()} ${r.url()}`))

  await page.goto('./')
  await expect(page.getByRole('heading', { name: /Welcome to Smart Exam Coach|Dashboard/ })).toBeVisible()
  const css = await page.evaluate(() => getComputedStyle(document.documentElement).backgroundColor)
  expect(css, 'stylesheet loaded').not.toBe('rgba(0, 0, 0, 0)')

  // Internal navigation and refresh on a deep link.
  await page.goto('./#/syllabus')
  await expect(page.getByRole('heading', { name: 'Syllabus', level: 1 })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Syllabus', level: 1 })).toBeVisible()

  // IndexedDB: a saved setting survives a reload.
  await page.goto('./#/settings')
  await page.getByLabel('Study minutes per day').fill('75')
  await page.getByRole('button', { name: 'Save preferences' }).click()
  await expect(page.getByText('Settings saved')).toBeVisible()
  await page.reload()
  await expect(page.getByLabel('Study minutes per day')).toHaveValue('75')

  // Service worker and offline mode.
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  await page.reload()
  await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true)
  await context.setOffline(true)
  await page.reload() // full page load with no network: served by the service worker
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible()
  await page.goto('./#/practice')
  await expect(page.getByRole('heading', { name: 'Practice', level: 1 })).toBeVisible()
  await context.setOffline(false)

  expect(failed, failed.join('\n')).toEqual([])
})
