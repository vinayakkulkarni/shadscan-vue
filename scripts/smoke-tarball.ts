import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const cliDir = path.join(repoRoot, 'packages', 'cli');

const run = (command: string, args: string[], cwd: string): string =>
  execFileSync(command, args, { cwd, encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });

const runAllowingFailure = (
  command: string,
  args: string[],
  cwd: string,
): { stdout: string; status: number } => {
  try {
    return { stdout: run(command, args, cwd), status: 0 };
  } catch (error) {
    const failure = error as { stdout?: string; status?: number };
    return { stdout: failure.stdout ?? '', status: failure.status ?? 1 };
  }
};

const check = (label: string, condition: boolean, detail?: string): void => {
  if (condition) {
    process.stdout.write(`  ok   ${label}\n`);
    return;
  }
  process.stdout.write(`  FAIL ${label}${detail === undefined ? '' : ` — ${detail}`}\n`);
  process.exitCode = 1;
};

process.stdout.write('Packing shadscan-vue\n');
for (const entry of readdirSync(cliDir)) {
  if (entry.endsWith('.tgz')) {
    rmSync(path.join(cliDir, entry));
  }
}
run('pnpm', ['pack'], cliDir);
const tarball = readdirSync(cliDir).find((entry) => entry.endsWith('.tgz'));
if (tarball === undefined) {
  throw new Error('pnpm pack produced no tarball');
}
const tarballPath = path.join(cliDir, tarball);

const shipped = run('tar', ['-tzf', tarballPath], cliDir)
  .split('\n')
  .filter((line) => line.length > 0)
  .map((line) => line.replace(/^package\//u, ''));

process.stdout.write(`Verifying tarball contents (${shipped.length} files)\n`);
for (const required of [
  'bin/shadscan-vue.mjs',
  'dist/index.js',
  'dist/index.d.ts',
  'package.json',
  'README.md',
  'LICENSE.md',
  'THIRD_PARTY_NOTICES.md',
]) {
  check(`ships ${required}`, shipped.includes(required));
}
check(
  'ships no source or test files',
  !shipped.some((entry) => entry.startsWith('src/') || entry.startsWith('test/')),
);

const consumer = mkdtempSync(path.join(os.tmpdir(), 'shadscan-smoke-'));
try {
  process.stdout.write(`Installing into a clean consumer at ${consumer}\n`);
  writeFileSync(
    path.join(consumer, 'package.json'),
    JSON.stringify({ name: 'shadscan-smoke-consumer', private: true, version: '1.0.0' }),
  );
  run('npm', ['install', tarballPath, '--no-audit', '--no-fund'], consumer);

  const target = path.join(consumer, 'target');
  cpSync(path.join(repoRoot, 'qa', 'vite-app'), target, {
    recursive: true,
    filter: (source) => !source.includes('node_modules') && !source.includes(`${path.sep}dist`),
  });

  const bin = path.join(consumer, 'node_modules', '.bin', 'shadscan-vue');
  process.stdout.write('Running the installed binary\n');

  const version = run(bin, ['--version'], consumer);
  check('reports its version', version.includes('0.1.0'), version.trim());

  const human = run(bin, ['target'], consumer);
  check('renders a score banner', human.includes('Score'));
  check('renders findings', human.includes('Findings'));
  check('stays silent about roast when piped', !human.includes('costume'));

  const ci = execFileSync(bin, ['target'], {
    cwd: consumer,
    encoding: 'utf8',
    env: { ...process.env, CI: '1' },
  });
  check('stays silent about roast in CI', !ci.includes('costume'));

  const report = JSON.parse(run(bin, ['target', '--json'], consumer)) as {
    schemaVersion: number;
    score: number;
    findings: unknown[];
    framework: { adapter: string };
  };
  check('emits schema version 1', report.schemaVersion === 1);
  check('detects the vite-vue adapter', report.framework.adapter === 'vite-vue');
  check('reports every rule', report.findings.length === 51, `${report.findings.length} findings`);

  const prompt = run(bin, ['target', '--prompt'], consumer);
  check(
    'emits a delimited agent data block',
    prompt.includes('<shadscan-vue-data format="application/json">'),
  );

  const catalog = JSON.parse(run(bin, ['rules', '--format', 'json'], consumer)) as {
    ruleCount: number;
  };
  check('prints the rule catalog', catalog.ruleCount === 51);

  check(
    'exits non-zero below the threshold',
    runAllowingFailure(bin, ['target', '--fail-under', '100'], consumer).status === 1,
  );
  check(
    'exits zero above the threshold',
    runAllowingFailure(bin, ['target', '--fail-under', '1'], consumer).status === 0,
  );
  check('rejects setup without a mode', runAllowingFailure(bin, ['setup'], consumer).status === 1);
} finally {
  rmSync(consumer, { recursive: true, force: true });
  rmSync(tarballPath, { force: true });
}

process.stdout.write(
  process.exitCode === 1 ? '\nTarball smoke test failed\n' : '\nTarball smoke test passed\n',
);
