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
    // Generated artifacts are byte-compared against a fresh run, and QA apps are
    // scan targets whose evidence is reported by line number, so reformatting
    // either would look like a change or silently invalidate qa/EXPECTED.md.
    ignorePatterns: [
      'dist',
      'node_modules',
      'coverage',
      'pnpm-lock.yaml',
      '**/test/fixtures',
      'qa',
      ...generatedFiles,
    ],
  },
});
