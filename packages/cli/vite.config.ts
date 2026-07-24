import { defineConfig } from 'vite-plus';

export default defineConfig({
  pack: {
    entry: ['src/index.ts'],
    format: ['esm'],
    platform: 'neutral',
    sourcemap: true,
    dts: true,
    deps: {
      neverBundle: [
        '@vue/compiler-dom',
        '@vue/compiler-sfc',
        'cac',
        'cross-spawn',
        'jsonc-parser',
        'picocolors',
        'tinyglobby',
        'typescript',
        'zod',
        /^node:/,
      ],
    },
  },
  lint: {
    plugins: ['typescript', 'import'],
    ignorePatterns: ['dist', 'node_modules', 'coverage', 'test/fixtures', 'bin'],
  },
  fmt: {
    printWidth: 100,
    semi: true,
    singleQuote: true,
    tabWidth: 2,
    trailingComma: 'all',
    bracketSpacing: true,
    arrowParens: 'always',
    endOfLine: 'lf',
    ignorePatterns: ['dist', 'node_modules', 'coverage', 'pnpm-lock.yaml', 'test/fixtures'],
  },
});
