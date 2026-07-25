import { defineConfig } from 'vite-plus';

const generatedFiles = [
  'qa/EXPECTED.md',
  'docs/RULES.md',
  'apps/www/app/data/rules.json',
  'packages/cli/CHANGELOG.md',
  '.release-please-manifest.json',
];

export default defineConfig({
  lint: {
    plugins: ['typescript', 'import'],
    ignorePatterns: ['dist', 'node_modules', 'coverage', 'qa', '**/test/fixtures', '.agents'],
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
    // Generated artifacts are byte-compared against a fresh run, QA apps are
    // scan targets whose evidence is reported by line number, and release-please
    // rewrites its own files on every release, so reformatting any of them
    // either looks like a change or silently invalidates qa/EXPECTED.md.
    ignorePatterns: [
      'dist',
      'node_modules',
      'coverage',
      'pnpm-lock.yaml',
      '**/test/fixtures',
      'qa',
      '.agents',
      '.claude',
      'skills-lock.json',
      ...generatedFiles,
    ],
  },
});
