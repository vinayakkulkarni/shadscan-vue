import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { discoverProject, gradeFor, runAudit, type AuditRule } from '../src/index.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

const rule = (overrides: Partial<AuditRule>): AuditRule => ({
  id: 'test-rule',
  title: 'Test rule',
  description: 'A test rule.',
  category: 'foundation',
  severity: 'warning',
  confidence: 'high',
  maxScore: 4,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: (context) => context.result.pass(),
  ...overrides,
});

const viteFixture = () => discoverProject(path.join(fixturesDir, 'vite-vue-minimal'));

describe('runAudit normalization', () => {
  it('scores 100 and grade A when every rule passes', async () => {
    const report = await runAudit(await viteFixture(), [rule({ id: 'a' }), rule({ id: 'b' })]);
    expect(report.score).toBe(100);
    expect(report.grade).toBe('A');
  });

  it('converts low-confidence failures into advisories (score-neutral)', async () => {
    const report = await runAudit(await viteFixture(), [
      rule({
        id: 'low-conf',
        confidence: 'low',
        run: (context) => context.result.fail([{ message: 'suspicious', evidence: [] }]),
      }),
    ]);
    const outcome = report.outcomes[0]!;
    expect(outcome.status).toBe('advisory');
    expect(report.score).toBe(100);
  });

  it('treats maxScore 0 rules as advisory-only', async () => {
    const report = await runAudit(await viteFixture(), [
      rule({
        id: 'zero-point',
        maxScore: 0,
        run: (context) => context.result.fail([{ message: 'zero', evidence: [] }]),
      }),
      rule({ id: 'scored' }),
    ]);
    expect(report.outcomes[0]!.status).toBe('advisory');
    expect(report.outcomes[0]!.impactsScore).toBe(false);
    expect(report.score).toBe(100);
  });

  it('removes not-applicable rules from the denominator', async () => {
    const report = await runAudit(await viteFixture(), [
      rule({
        id: 'na',
        run: (context) => context.result.notApplicable(),
      }),
      rule({ id: 'passing' }),
    ]);
    expect(report.score).toBe(100);
  });

  it('excludes rules whose adapter does not match', async () => {
    const report = await runAudit(await viteFixture(), [
      rule({ id: 'nuxt-only', adapters: ['nuxt'] }),
    ]);
    expect(report.outcomes).toHaveLength(0);
    expect(report.score).toBeUndefined();
  });

  it('weights categories and renormalizes when some are inactive', async () => {
    // foundation (w20) fails everything; forms (w10) passes everything.
    const report = await runAudit(await viteFixture(), [
      rule({
        id: 'foundation-fail',
        category: 'foundation',
        run: (context) => context.result.fail([{ message: 'broken', evidence: [] }]),
      }),
      rule({ id: 'forms-pass', category: 'forms' }),
    ]);
    // 0*20 + 100*10 over weight 30 => 33.33 -> 33
    expect(report.score).toBe(33);
    expect(report.grade).toBe('F');
  });

  it('captures rule exceptions as advisories with a warning', async () => {
    const report = await runAudit(await viteFixture(), [
      rule({
        id: 'thrower',
        run: () => {
          throw new Error('boom');
        },
      }),
    ]);
    expect(report.outcomes[0]!.status).toBe('advisory');
    expect(report.warnings.some((warning) => warning.includes('thrower'))).toBe(true);
  });

  it('filters to a single category when requested', async () => {
    const report = await runAudit(
      await viteFixture(),
      [
        rule({ id: 'foundation-a', category: 'foundation' }),
        rule({ id: 'forms-a', category: 'forms' }),
      ],
      { category: 'forms' },
    );
    expect(report.outcomes).toHaveLength(1);
    expect(report.outcomes[0]!.rule.id).toBe('forms-a');
    expect(report.categories).toHaveLength(1);
    expect(report.score).toBe(100);
  });
});

describe('gradeFor', () => {
  it('maps boundaries correctly', () => {
    expect(gradeFor(90)).toBe('A');
    expect(gradeFor(89)).toBe('B');
    expect(gradeFor(80)).toBe('B');
    expect(gradeFor(79)).toBe('C');
    expect(gradeFor(70)).toBe('C');
    expect(gradeFor(69)).toBe('D');
    expect(gradeFor(60)).toBe('D');
    expect(gradeFor(59)).toBe('F');
  });
});
