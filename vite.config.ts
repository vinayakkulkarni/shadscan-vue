import { defineConfig } from 'vite-plus';

const generatedFiles = ['qa/EXPECTED.md', 'docs/RULES.md'];

export default defineConfig({
  lint: {
    plugins: ['typescript', 'import'],
    ignorePatterns: ['dist', 'node_modules', 'coverage', 'qa', '**/test/fixtures'],
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
    // Generated artifacts are byte-compared against a fresh run, so reformatting
    // them would make every regeneration look like a change.
    ignorePatterns: [
      'dist',
      'node_modules',
      'coverage',
      'pnpm-lock.yaml',
      '**/test/fixtures',
      'qa/*/src',
      'qa/*/app',
      ...generatedFiles,
    ],
  },
});
