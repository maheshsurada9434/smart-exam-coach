import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

// Project site lives at https://<user>.github.io/smart-exam-coach/
export default defineConfig({
  base: '/smart-exam-coach/',
  plugins: [react()],
  test: { environment: 'jsdom', setupFiles: ['./src/test/setup.ts'], css: false },
})
