import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliBin = path.join(repoRoot, 'packages', 'cli', 'bin', 'shadscan-vue.mjs');
const apps = ['vite-app', 'nuxt-app'] as const;

interface Finding {
  id: string;
  category: string;
  status: string;
  evidence: { path: string; line?: number }[];
}

interface Report {
  score: number | null;
  grade: string | null;
  rulesetVersion: string;
  schemaVersion: number;
  framework: { adapter: string };
  coverage: { status: string; fileCount: number };
  categories: { title: string; score: number | null; ruleCount: number }[];
  findings: Finding[];
}

const scan = (app: string): Report => {
  const stdout = execFileSync('node', [cliBin, path.join('qa', app), '--json'], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  return JSON.parse(stdout) as Report;
};

const evidenceCell = (finding: Finding): string => {
  if (finding.evidence.length === 0) {
    return '—';
  }
  return finding.evidence
    .slice(0, 3)
    .map(({ path: file, line }) => `\`${file}${line === undefined ? '' : `:${line}`}\``)
    .join(', ');
};

const lines: string[] = [
  '# Expected scan results',
  '',
  'Generated from the built CLI against both QA apps. This file is the oracle for',
  'the end-to-end suite: a diff here means a rule changed behaviour against real',
  'shadcn-vue and shadcn-nuxt code.',
  '',
  'Regenerate with `pnpm qa:expected` after an intentional rule change.',
  '',
];

for (const app of apps) {
  const report = scan(app);
  lines.push(
    `## ${app}`,
    '',
    `- adapter: \`${report.framework.adapter}\``,
    `- score: **${report.score ?? 'unassessed'}/100** (grade ${report.grade ?? '—'})`,
    `- files scanned: ${report.coverage.fileCount} (${report.coverage.status} coverage)`,
    `- ruleset: ${report.rulesetVersion} · report schema: ${report.schemaVersion}`,
    '',
    '| Category | Score | Rules |',
    '| --- | ---: | ---: |',
  );
  for (const category of report.categories) {
    lines.push(`| ${category.title} | ${category.score ?? '—'} | ${category.ruleCount} |`);
  }
  lines.push('');

  const groups = [
    ['fail', 'Failing'],
    ['advisory', 'Advisory'],
    ['pass', 'Passing'],
    ['not-applicable', 'Not applicable'],
  ] as const;

  for (const [status, heading] of groups) {
    const group = report.findings.filter((finding) => finding.status === status);
    if (group.length === 0) {
      continue;
    }
    lines.push(`### ${heading} (${group.length})`, '');
    if (status === 'fail' || status === 'advisory') {
      lines.push('| Rule | Category | Evidence |', '| --- | --- | --- |');
      for (const finding of group) {
        lines.push(`| \`${finding.id}\` | ${finding.category} | ${evidenceCell(finding)} |`);
      }
    } else {
      lines.push(group.map((finding) => `\`${finding.id}\``).join(', '));
    }
    lines.push('');
  }
}

writeFileSync(path.join(repoRoot, 'qa', 'EXPECTED.md'), lines.join('\n'));
process.stdout.write('qa/EXPECTED.md regenerated\n');
