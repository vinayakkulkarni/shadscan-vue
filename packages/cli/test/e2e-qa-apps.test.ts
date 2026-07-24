import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const cliBin = path.join(repoRoot, 'packages', 'cli', 'bin', 'shadscan-vue.mjs');
const expectedPath = path.join(repoRoot, 'qa', 'EXPECTED.md');

const cliIsBuilt = existsSync(path.join(repoRoot, 'packages', 'cli', 'dist', 'index.js'));
const qaAppsExist = existsSync(path.join(repoRoot, 'qa', 'vite-app', 'package.json'));

interface RunResult {
  stdout: string;
  status: number;
}

const runCli = (args: string[]): RunResult => {
  try {
    const stdout = execFileSync('node', [cliBin, ...args], {
      cwd: repoRoot,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
    });
    return { stdout, status: 0 };
  } catch (error) {
    const failure = error as { stdout?: string; status?: number };
    return { stdout: failure.stdout ?? '', status: failure.status ?? 1 };
  }
};

interface Finding {
  id: string;
  status: string;
  evidence: { path: string; line?: number }[];
}

const scan = (app: string): { score: number; findings: Finding[] } => {
  const { stdout, status } = runCli([path.join('qa', app), '--json']);
  expect(status).toBe(0);
  return JSON.parse(stdout) as { score: number; findings: Finding[] };
};

const expectedScore = (app: string): number => {
  const doc = readFileSync(expectedPath, 'utf8');
  const section = doc.split(`## ${app}`)[1] ?? '';
  const match = /score: \*\*(\d+)\/100\*\*/u.exec(section);
  if (match === null) {
    throw new Error(`No expected score recorded for ${app}`);
  }
  return Number(match[1]);
};

const expectedFailingRules = (app: string): string[] => {
  const doc = readFileSync(expectedPath, 'utf8');
  const section = doc.split(`## ${app}`)[1] ?? '';
  const failing = section.split('### Failing')[1]?.split('###')[0] ?? '';
  return [...failing.matchAll(/^\|\s*`([\w-]+)`\s*\|/gmu)].map((match) => match[1]!);
};

describe.skipIf(!cliIsBuilt || !qaAppsExist)('end-to-end scans of real shadcn apps', () => {
  for (const app of ['vite-app', 'nuxt-app']) {
    describe(app, () => {
      it('matches the score recorded in qa/EXPECTED.md', () => {
        expect(scan(app).score).toBe(expectedScore(app));
      });

      it('fails exactly the rules recorded in qa/EXPECTED.md', () => {
        const actual = scan(app)
          .findings.filter((finding) => finding.status === 'fail')
          .map((finding) => finding.id)
          .sort();
        expect(actual).toEqual([...expectedFailingRules(app)].sort());
      });

      it('reports every planted violation with file and line evidence', () => {
        const failures = scan(app).findings.filter((finding) => finding.status === 'fail');
        const lineScoped = failures.filter((finding) =>
          finding.evidence.some((entry) => entry.line !== undefined),
        );
        expect(lineScoped.length).toBeGreaterThanOrEqual(6);
        for (const finding of lineScoped) {
          for (const entry of finding.evidence) {
            expect(existsSync(path.join(repoRoot, 'qa', app, entry.path))).toBe(true);
          }
        }
      });

      it('exits non-zero for an unreachable threshold and zero for a reachable one', () => {
        expect(runCli([path.join('qa', app), '--fail-under', '100']).status).toBe(1);
        expect(runCli([path.join('qa', app), '--fail-under', '1']).status).toBe(0);
      });

      it('emits a paste-ready agent prompt with an embedded data block', () => {
        const { stdout, status } = runCli([path.join('qa', app), '--prompt']);
        expect(status).toBe(0);
        expect(stdout).toContain('<shadscan-vue-data format="application/json">');
        expect(stdout).toContain('[fix] ');
      });

      it('renders a human report with a score banner', () => {
        const { stdout, status } = runCli([path.join('qa', app)]);
        expect(status).toBe(0);
        expect(stdout).toContain('Score');
        expect(stdout).toContain('Findings');
      });
    });
  }

  it('detects the correct adapter for each app', () => {
    const vite = JSON.parse(runCli([path.join('qa', 'vite-app'), '--json']).stdout) as {
      framework: { adapter: string };
    };
    const nuxt = JSON.parse(runCli([path.join('qa', 'nuxt-app'), '--json']).stdout) as {
      framework: { adapter: string };
    };
    expect(vite.framework.adapter).toBe('vite-vue');
    expect(nuxt.framework.adapter).toBe('nuxt');
  });
});
