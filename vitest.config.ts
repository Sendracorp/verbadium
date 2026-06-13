import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/* Unit/integration layer: pure logic, no browser. Browser flows live in
   tests/e2e and run under Playwright Test instead. */
export default defineConfig({
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
});
