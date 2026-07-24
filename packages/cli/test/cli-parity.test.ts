import { execFileSync } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { CATEGORIES } from '../src/audit.js';
import { buildRuleCatalog, renderCatalogMarkdown } from '../src/rule-catalog.js';
import { renderHuman } from '../src/render-human.js';
import { roastLine } from '../src/roast.js';
import { defaultRules } from '../src/rules/index.js';
import { scanProject } from '../src/scan.js';
import { installPreCommitHook } from '../src/setup.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const fixturesDir = path.join(here, 'fixtures');
const tempDirs: string[] = [];

const makeGitRepo = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'shadscan-setup-'));
  tempDirs.push(dir);
  execFileSync('git', ['init', '-q'], { cwd: dir });
  return dir;
};

afterAll(async () => {
  await Promise.all(tempDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe('rule catalog', () => {
  it('covers every registered rule exactly once', () => {
    const catalog = buildRuleCatalog();
    const catalogued = catalog.categories.flatMap((category) =>
      category.rules.map((rule) => rule.id),
    );
    expect(catalog.ruleCount).toBe(defaultRules.length);
    expect(catalogued.sort()).toEqual(defaultRules.map((rule) => rule.id).sort());
    expect(new Set(catalogued).size).toBe(catalogued.length);
  });

  it('preserves category order and weights from the scoring model', () => {
    const catalog = buildRuleCatalog();
    expect(catalog.categories.map((category) => category.id)).toEqual(
      CATEGORIES.map((category) => category.id),
    );
    expect(catalog.categories.map((category) => category.weight)).toEqual(
      CATEGORIES.map((category) => category.weight),
    );
  });

  it('sums points per category from the rules themselves', () => {
    for (const category of buildRuleCatalog().categories) {
      const expected = defaultRules
        .filter((rule) => rule.category === category.id)
        .reduce((sum, rule) => sum + rule.maxScore, 0);
      expect(category.totalPoints).toBe(expected);
    }
  });

  it('renders markdown containing every rule id and a category index', () => {
    const markdown = renderCatalogMarkdown(buildRuleCatalog());
    for (const rule of defaultRules) {
      expect(markdown).toContain(`\`${rule.id}\``);
    }
    for (const category of CATEGORIES) {
      expect(markdown).toContain(`## ${category.title}`);
    }
  });
});

describe('roast copy', () => {
  it('is deterministic for the same inputs', () => {
    expect(roastLine('F', 'forms')).toBe(roastLine('F', 'forms'));
  });

  it('names the weakest category below grade A', () => {
    const line = roastLine('D', 'accessibility');
    expect(line).toContain('Assistive technology');
  });

  it('does not pile on at grade A', () => {
    expect(roastLine('A', 'forms')).toBe('Nothing left to roast. Ship it.');
  });

  it('returns nothing when the score is unassessed', () => {
    expect(roastLine(undefined, 'forms')).toBeUndefined();
  });
});

describe('human renderer roast toggle', () => {
  const caps = { isTTY: false, isCI: true, color: false, unicode: false };

  it('omits roast copy by default', async () => {
    const result = await scanProject(path.join(fixturesDir, 'vite-vue-minimal'));
    const output = renderHuman(result, '0.1.0', caps);
    expect(output).toContain('Score');
    expect(output).not.toContain('costume');
  });

  it('includes roast copy when enabled', async () => {
    const result = await scanProject(path.join(fixturesDir, 'vite-vue-minimal'));
    const output = renderHuman(result, '0.1.0', caps, true);
    const grade = result.report.grade;
    expect(grade).toBeDefined();
    expect(output).toContain(roastLine(grade, undefined)!.split(' ')[0]!);
  });
});

describe('setup --pre-commit', () => {
  it('creates an executable hook when none exists', async () => {
    const dir = await makeGitRepo();
    const outcome = await installPreCommitHook(dir);
    expect(outcome.action).toBe('created');
    const contents = await fs.readFile(outcome.hookPath, 'utf8');
    expect(contents).toContain('#!/bin/sh');
    expect(contents).toContain('shadscan-vue');
    const stats = await fs.stat(outcome.hookPath);
    expect(stats.mode & 0o111).toBeGreaterThan(0);
  });

  it('appends to an existing hook without discarding it', async () => {
    const dir = await makeGitRepo();
    const hookPath = path.join(dir, '.git', 'hooks', 'pre-commit');
    await fs.mkdir(path.dirname(hookPath), { recursive: true });
    await fs.writeFile(hookPath, '#!/bin/sh\necho existing\n', { mode: 0o755 });

    const outcome = await installPreCommitHook(dir);
    expect(outcome.action).toBe('appended');
    const contents = await fs.readFile(hookPath, 'utf8');
    expect(contents).toContain('echo existing');
    expect(contents).toContain('shadscan-vue');
  });

  it('is idempotent', async () => {
    const dir = await makeGitRepo();
    await installPreCommitHook(dir);
    const second = await installPreCommitHook(dir);
    expect(second.action).toBe('already-present');
    const contents = await fs.readFile(second.hookPath, 'utf8');
    expect(contents.match(/shadscan-vue/gu)?.length).toBe(2);
  });

  it('refuses to run outside a git repository', async () => {
    const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'shadscan-nogit-'));
    tempDirs.push(dir);
    await expect(installPreCommitHook(dir)).rejects.toMatchObject({ code: 'not-a-project' });
  });
});
