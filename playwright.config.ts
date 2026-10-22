import { defineConfig, devices } from '@playwright/test'

// Runs against the production build (`vite preview`) under the same /smart-exam-coach/ base path as GitHub Pages.
export default defineConfig({
  testDir: 'e2e',
  timeout: 90_000,
  retries: 0,
  reporter: [['github'], ['list']],
  use: { baseURL: 'http://localhost:4173/smart-exam-coach/', trace: 'retain-on-failure' },
  webServer: {
    command: 'npm run preview -- --port 4173 --strictPort',
    url: 'http://localhost:4173/smart-exam-coach/',
    reuseExistingServer: false,
    timeout: 60_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
})
