import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['test/fixtures/**'],
    testTimeout: 30_000,
    maxWorkers: 2,
  },
});
