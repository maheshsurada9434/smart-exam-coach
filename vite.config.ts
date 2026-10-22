import { defineConfig } from 'vitest/config'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'

// Writes precache.json (every built file) for the service worker in public/sw.js.
const precacheList = (): Plugin => ({
  name: 'precache-list',
  apply: 'build',
  generateBundle(_, bundle) {
    const files = [...Object.keys(bundle), 'manifest.webmanifest', 'favicon.svg', 'icon-192.png', 'icon-512.png', 'templates/questions-template.csv', 'templates/content-template.csv', 'data/starter-questions.json', 'data/starter-content.json']
    this.emitFile({ type: 'asset', fileName: 'precache.json', source: JSON.stringify(files.filter((f) => f !== 'index.html')) })
  },
})

// Project site lives at https://<user>.github.io/smart-exam-coach/
export default defineConfig({
  base: '/smart-exam-coach/',
  plugins: [react(), precacheList()],
  define: { __BUILD_ID__: JSON.stringify(Date.now().toString(36)) },
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], css: false, include: ['src/**/*.test.{ts,tsx}'] },
})
