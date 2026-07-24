import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CliError, discoverProject } from '../src/index.js';

const fixturesDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures');

describe('discoverProject', () => {
  it('detects a vite-vue app with shadcn config', async () => {
    const discovery = await discoverProject(path.join(fixturesDir, 'vite-vue-minimal'));
    expect(discovery.adapter).toBe('vite-vue');
    expect(discovery.packageName).toBe('vite-vue-minimal');
    expect(discovery.packageManager).toBe('pnpm');
    expect(discovery.shadcn.configPresent).toBe(true);
    expect(discovery.shadcn.confidence).toBe('high');
    expect(discovery.shadcn.style).toBe('new-york');
    expect(discovery.shadcn.uiAlias).toBe('@/components/ui');
  });

  it('detects a nuxt app without shadcn config', async () => {
    const discovery = await discoverProject(path.join(fixturesDir, 'nuxt-minimal'));
    expect(discovery.adapter).toBe('nuxt');
    expect(discovery.packageManager).toBe('npm');
    expect(discovery.shadcn.configPresent).toBe(false);
    expect(discovery.shadcn.confidence).toBe('low');
    expect(discovery.warnings.length).toBeGreaterThan(0);
  });

  it('rejects a project without vue', async () => {
    await expect(discoverProject(path.join(fixturesDir, 'unsupported'))).rejects.toThrowError(
      CliError,
    );
    await expect(discoverProject(path.join(fixturesDir, 'unsupported'))).rejects.toMatchObject({
      code: 'unsupported-project',
    });
  });

  it('rejects a missing directory', async () => {
    await expect(discoverProject(path.join(fixturesDir, 'does-not-exist'))).rejects.toMatchObject({
      code: 'invalid-path',
    });
  });
});
