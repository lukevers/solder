// vite.config.ts
import { execSync } from 'node:child_process'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/**
 * Resolve the app version string injected into the client bundle.
 *
 * During local development we keep this as the stable literal `dev` so the UI
 * does not fluctuate across file edits. Production builds use the current
 * short git commit hash so exported artifacts can be traced back to source.
 */
function resolveAppVersion(command: 'serve' | 'build'): string {
  if (command === 'serve') {
    return 'dev'
  }

  try {
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
    }).trim()
  } catch {
    return 'build'
  }
}

export default defineConfig(({ command }) => ({
  define: {
    __APP_VERSION__: JSON.stringify(resolveAppVersion(command)),
  },
  plugins: [react()],
  worker: { format: 'es' },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  },
}))
