import { defineConfig } from 'vite-plus';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    exclude: ['test/fixtures/**'],
    testTimeout: 30_000,
    maxWorkers: 2,
  },
});
