import { defineConfig, devices } from '@playwright/test'

// Runs against the production build (`vite preview`) under the same /smart-exam-coach/ base path as GitHub Pages.
// With E2E_BASE_URL set (after deploy), only the live smoke test runs, against the real site.
const live = process.env.E2E_BASE_URL

export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  retries: 0,
  reporter: [['github'], ['list']],
  use: { baseURL: live ?? 'http://localhost:4173/smart-exam-coach/', trace: 'retain-on-failure' },
  testMatch: live ? 'live.spec.ts' : undefined,
  testIgnore: live ? undefined : 'live.spec.ts',
  webServer: live ? undefined : {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/smart-exam-coach/',
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
