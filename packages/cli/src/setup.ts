import { promises as fs } from 'node:fs';
import path from 'node:path';
import { CliError } from './cli-error.js';

const HOOK_MARKER = '# shadscan-vue';

const HOOK_BODY = `${HOOK_MARKER}
npx --yes shadscan-vue --fail-under 70 --no-interactive
`;

export interface SetupResult {
  hookPath: string;
  action: 'created' | 'appended' | 'already-present';
}

const gitDirOf = async (rootDir: string): Promise<string> => {
  const gitPath = path.join(rootDir, '.git');
  let stats;
  try {
    stats = await fs.stat(gitPath);
  } catch {
    throw new CliError(
      'not-a-project',
      `No .git directory was found in ${rootDir}. Run this inside a git repository.`,
    );
  }
  if (stats.isDirectory()) {
    return gitPath;
  }
  // Worktrees and submodules store a `gitdir:` pointer instead of a directory.
  const pointer = await fs.readFile(gitPath, 'utf8');
  const match = /^gitdir:\s*(.+)$/mu.exec(pointer);
  if (match === null) {
    throw new CliError('not-a-project', `Could not resolve the git directory for ${rootDir}.`);
  }
  return path.resolve(rootDir, match[1]!.trim());
};

export const installPreCommitHook = async (rootDir: string): Promise<SetupResult> => {
  const gitDir = await gitDirOf(rootDir);
  const hooksDir = path.join(gitDir, 'hooks');
  await fs.mkdir(hooksDir, { recursive: true });
  const hookPath = path.join(hooksDir, 'pre-commit');

  let existing: string | undefined;
  try {
    existing = await fs.readFile(hookPath, 'utf8');
  } catch {
    existing = undefined;
  }

  if (existing === undefined) {
    await fs.writeFile(hookPath, `#!/bin/sh\n${HOOK_BODY}`, { mode: 0o755 });
    return { hookPath, action: 'created' };
  }

  if (existing.includes(HOOK_MARKER)) {
    return { hookPath, action: 'already-present' };
  }

  const separator = existing.endsWith('\n') ? '' : '\n';
  await fs.appendFile(hookPath, `${separator}\n${HOOK_BODY}`);
  await fs.chmod(hookPath, 0o755);
  return { hookPath, action: 'appended' };
};
