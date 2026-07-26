import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, describe, expect, it } from 'vitest';
import { discoverProject } from '../src/index.js';
import { collectSources } from '../src/rules/source-files.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');
const tempDirs: string[] = [];

const makeTempProject = async (): Promise<string> => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'shadscan-vue-test-'));
  tempDirs.push(dir);
  await fs.writeFile(
    path.join(dir, 'package.json'),
    JSON.stringify({ name: 'temp', dependencies: { vue: '^3.0.0' } }),
  );
  return dir;
};

afterAll(async () => {
  await Promise.all(tempDirs.map((dir) => fs.rm(dir, { recursive: true, force: true })));
});

describe('collectSources', () => {
  it('collects vue/ts/html sources deterministically and caches per discovery', async () => {
    const discovery = await discoverProject(path.join(fixturesDir, 'vite-vue-minimal'));
    const first = await collectSources(discovery);
    const second = await collectSources(discovery);
    expect(second).toBe(first);
    const paths = first.files.map((file) => file.relPath);
    expect(paths).toContain('src/App.vue');
    expect(paths).toContain('src/main.ts');
    expect(paths).toContain('index.html');
    expect([...paths].sort()).toEqual(paths);
    expect(first.coverage.status).toBe('complete');
  });

  it('rejects symlinked files and marks coverage partial', async () => {
    const dir = await makeTempProject();
    await fs.writeFile(path.join(dir, 'real.ts'), 'export const a = 1;');
    await fs.symlink(path.join(dir, 'real.ts'), path.join(dir, 'linked.ts'));
    const discovery = await discoverProject(dir);
    const collected = await collectSources(discovery);
    expect(collected.files.map((file) => file.relPath)).toEqual(['real.ts']);
    expect(collected.coverage.status).toBe('partial');
    expect(collected.coverage.warnings.some((warning) => warning.includes('linked.ts'))).toBe(true);
  });

  it('caps the file count and reports partial coverage', async () => {
    const dir = await makeTempProject();
    for (let index = 0; index < 5; index += 1) {
      await fs.writeFile(path.join(dir, `file-${index}.ts`), `export const v${index} = ${index};`);
    }
    const discovery = await discoverProject(dir);
    const collected = await collectSources(discovery, {
      maxFiles: 3,
      maxFileBytes: 1024,
      maxTotalBytes: 4096,
    });
    expect(collected.files.length).toBe(3);
    expect(collected.coverage.status).toBe('partial');
  });

  it('ignores illustrative directories but keeps real app code', async () => {
    const dir = await makeTempProject();
    for (const sub of ['components/demo', 'components/examples', 'demos', 'components']) {
      await fs.mkdir(path.join(dir, sub), { recursive: true });
    }
    await fs.writeFile(
      path.join(dir, 'components/demo/ButtonDemo.vue'),
      '<template><b /></template>',
    );
    await fs.writeFile(
      path.join(dir, 'components/examples/Card.vue'),
      '<template><b /></template>',
    );
    await fs.writeFile(path.join(dir, 'demos/Sink.vue'), '<template><b /></template>');
    await fs.mkdir(path.join(dir, 'components/_internal'), { recursive: true });
    await fs.writeFile(
      path.join(dir, 'components/_internal/Sink.vue'),
      '<template><b /></template>',
    );
    await fs.writeFile(path.join(dir, 'components/Real.vue'), '<template><b /></template>');
    await fs.writeFile(path.join(dir, 'components/DemoBanner.vue'), '<template><b /></template>');
    const discovery = await discoverProject(dir);
    const collected = await collectSources(discovery);
    expect(collected.files.map((file) => file.relPath)).toEqual([
      'components/DemoBanner.vue',
      'components/Real.vue',
    ]);
  });

  it('ignores node_modules, dist and test files', async () => {
    const dir = await makeTempProject();
    await fs.mkdir(path.join(dir, 'node_modules/pkg'), { recursive: true });
    await fs.mkdir(path.join(dir, 'dist'), { recursive: true });
    await fs.writeFile(path.join(dir, 'node_modules/pkg/index.ts'), 'export {};');
    await fs.writeFile(path.join(dir, 'dist/out.ts'), 'export {};');
    await fs.writeFile(path.join(dir, 'app.spec.ts'), 'export {};');
    await fs.writeFile(path.join(dir, 'app.ts'), 'export {};');
    const discovery = await discoverProject(dir);
    const collected = await collectSources(discovery);
    expect(collected.files.map((file) => file.relPath)).toEqual(['app.ts']);
  });
});
