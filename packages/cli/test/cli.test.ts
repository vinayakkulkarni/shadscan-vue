import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { run } from '../src/cli.js';
import { resolveOutputFormat } from '../src/output-format.js';
import { CliError } from '../src/cli-error.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const viteFixture = path.join(fixturesDir, 'vite-vue-minimal');

interface CapturedIo {
  stdout: string;
  stderr: string;
}

const captureRun = async (argv: string[]): Promise<CapturedIo & { code: number }> => {
  const io: CapturedIo = { stdout: '', stderr: '' };
  const originalOut = process.stdout.write.bind(process.stdout);
  const originalErr = process.stderr.write.bind(process.stderr);
  process.stdout.write = ((chunk: string | Uint8Array): boolean => {
    io.stdout += String(chunk);
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: string | Uint8Array): boolean => {
    io.stderr += String(chunk);
    return true;
  }) as typeof process.stderr.write;
  try {
    const code = await run(['node', 'shadscan-vue', ...argv]);
    return { ...io, code };
  } finally {
    process.stdout.write = originalOut;
    process.stderr.write = originalErr;
  }
};

describe('resolveOutputFormat', () => {
  it('defaults to human', () => {
    expect(resolveOutputFormat({})).toBe('human');
  });

  it('accepts --format and aliases', () => {
    expect(resolveOutputFormat({ format: 'json' })).toBe('json');
    expect(resolveOutputFormat({ json: true })).toBe('json');
    expect(resolveOutputFormat({ prompt: true })).toBe('prompt');
  });

  it('rejects conflicts and unknown formats', () => {
    expect(() => resolveOutputFormat({ format: 'json', json: true })).toThrowError(CliError);
    expect(() => resolveOutputFormat({ json: true, prompt: true })).toThrowError(CliError);
    expect(() => resolveOutputFormat({ format: 'yaml' })).toThrowError(CliError);
  });
});

describe('cli run', () => {
  it('scans a fixture and exits 0 with a human report', async () => {
    const { code, stdout } = await captureRun([viteFixture]);
    expect(code).toBe(0);
    expect(stdout).toContain('Score');
    expect(stdout).toContain('images-have-alt');
  });

  it('emits schema-valid JSON with --json', async () => {
    const { code, stdout } = await captureRun([viteFixture, '--json']);
    expect(code).toBe(0);
    const parsed = JSON.parse(stdout) as Record<string, unknown>;
    expect(parsed.schemaVersion).toBe(1);
    expect(parsed.score).toBeTypeOf('number');
    expect(parsed.grade).toBeTypeOf('string');
    expect(Array.isArray(parsed.findings)).toBe(true);
    expect(Array.isArray(parsed.categories)).toBe(true);
    const framework = parsed.framework as Record<string, unknown>;
    expect(framework.adapter).toBe('vite-vue');
  });

  it('emits a prompt with embedded data block', async () => {
    const { code, stdout } = await captureRun([viteFixture, '--prompt']);
    expect(code).toBe(0);
    expect(stdout).toContain('<shadscan-vue-data format="application/json">');
    expect(stdout).toContain('[fix] images-have-alt');
  });

  it('fails with exit 1 when --fail-under is not met', async () => {
    const { code, stderr } = await captureRun([viteFixture, '--fail-under', '100']);
    expect(code).toBe(1);
    expect(stderr).toContain('--fail-under failed');
  });

  it('passes --fail-under when threshold is met', async () => {
    const { code } = await captureRun([viteFixture, '--fail-under', '1']);
    expect(code).toBe(0);
  });

  it('rejects invalid --fail-under values', async () => {
    const { code, stderr } = await captureRun([viteFixture, '--fail-under', '150']);
    expect(code).toBe(1);
    expect(stderr).toContain('integer from 0 to 100');
  });

  it('rejects conflicting output flags with a JSON error envelope', async () => {
    const { code, stderr } = await captureRun([viteFixture, '--json', '--prompt']);
    expect(code).toBe(1);
    const parsed = JSON.parse(stderr) as { error: { code: string }; schemaVersion: number };
    expect(parsed.error.code).toBe('conflicting-flags');
    expect(parsed.schemaVersion).toBe(1);
  });

  it('rejects unknown categories', async () => {
    const { code, stderr } = await captureRun([viteFixture, '--category', 'nope']);
    expect(code).toBe(1);
    expect(stderr).toContain('Unknown category');
  });

  it('filters rules with --category', async () => {
    const { code, stdout } = await captureRun([
      viteFixture,
      '--category',
      'accessibility',
      '--json',
    ]);
    expect(code).toBe(0);
    const parsed = JSON.parse(stdout) as { findings: { category: string }[] };
    expect(parsed.findings.length).toBeGreaterThan(0);
    expect(parsed.findings.every((finding) => finding.category === 'accessibility')).toBe(true);
  });

  it('reports unsupported projects with exit 1', async () => {
    const { code, stderr } = await captureRun([path.join(fixturesDir, 'unsupported')]);
    expect(code).toBe(1);
    expect(stderr).toContain('shadscan-vue');
  });
});
