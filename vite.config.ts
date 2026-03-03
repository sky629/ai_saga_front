import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sentryVitePlugin } from '@sentry/vite-plugin'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    sentryVitePlugin({
      authToken: process.env.SENTRY_AUTH_TOKEN,
      org: process.env.SENTRY_ORG,
      project: process.env.SENTRY_PROJECT,
      release: {
        name: process.env.VITE_RELEASE || process.env.RELEASE,
      },
      sourcemaps: {
        assets: './dist/**',
      },
      telemetry: false,
      disable:
        !process.env.SENTRY_AUTH_TOKEN ||
        !process.env.SENTRY_ORG ||
        !process.env.SENTRY_PROJECT,
    }),
  ],
  build: {
    sourcemap: true,
  },
})
