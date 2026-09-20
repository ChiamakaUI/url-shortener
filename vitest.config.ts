import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: 'postgresql://postgres:password@localhost:5433/url_shortener',
      BASE_URL: 'http://localhost:3000'
    },
  },
})