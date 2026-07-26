import { promises as fs } from 'node:fs';
import path from 'node:path';
import { glob } from 'tinyglobby';
import { compareCodeUnits } from '../deterministic-order.js';
import type { ProjectDiscovery } from '../discovery.js';
import {
  MAX_FILE_BYTES,
  MAX_SOURCE_FILES,
  MAX_TOTAL_BYTES,
  type SourceCoverage,
} from '../source-requirements.js';

export type SourceKind = 'vue' | 'ts' | 'js' | 'html';

export interface SourceFile {
  /** Absolute path. */
  path: string;
  /** Project-root-relative posix path. */
  relPath: string;
  kind: SourceKind;
  text: string;
}

export interface StyleFile {
  path: string;
  relPath: string;
  text: string;
}

export interface CollectedSources {
  files: SourceFile[];
  styles: StyleFile[];
  coverage: SourceCoverage;
}

const SOURCE_DIRS = [
  'app',
  'pages',
  'src',
  'components',
  'lib',
  'layouts',
  'composables',
  'plugins',
  'middleware',
  'utils',
  'server',
];

const SOURCE_PATTERNS = [
  '*.{js,jsx,ts,tsx,vue}',
  ...SOURCE_DIRS.map((dir) => `${dir}/**/*.{js,jsx,ts,tsx,vue}`),
  'index.html',
];

const STYLE_PATTERNS = [
  '*.css',
  ...['app', 'src', 'components', 'styles', 'assets'].map((dir) => `${dir}/**/*.css`),
];

const IGNORE_PATTERNS = [
  '**/node_modules/**',
  '**/.git/**',
  '**/.nuxt/**',
  '**/.output/**',
  '**/.data/**',
  '**/dist/**',
  '**/coverage/**',
  '**/fixtures/**',
  '**/__tests__/**',
  '**/__mocks__/**',
  '**/__registry__/**',
  // Illustrative code documents an API rather than shipping a surface, so a
  // deliberately minimal example is not a defect. Component libraries keep
  // hundreds of these, and auditing them buries the findings that matter.
  // Directory names only: a component called DemoBanner.vue is real code.
  '**/demo/**',
  '**/demos/**',
  '**/example/**',
  '**/examples/**',
  // A leading underscore marks a directory as private across Vue, Nuxt and
  // Vite conventions, so it holds scaffolding rather than a shipped surface.
  '**/_*/**',
  '**/*.spec.*',
  '**/*.test.*',
  '**/*.stories.*',
  '**/*.generated.*',
];

export interface SourceLimits {
  maxFiles: number;
  maxFileBytes: number;
  maxTotalBytes: number;
}

const DEFAULT_LIMITS: SourceLimits = {
  maxFiles: MAX_SOURCE_FILES,
  maxFileBytes: MAX_FILE_BYTES,
  maxTotalBytes: MAX_TOTAL_BYTES,
};

const kindOf = (relPath: string): SourceKind => {
  if (relPath.endsWith('.vue')) {
    return 'vue';
  }
  if (relPath.endsWith('.html')) {
    return 'html';
  }
  if (/\.(?:ts|tsx|mts|cts)$/u.test(relPath)) {
    return 'ts';
  }
  return 'js';
};

interface SafeReadResult {
  files: { relPath: string; absPath: string; size: number }[];
  warnings: string[];
  partial: boolean;
}

/**
 * Resolve candidate paths safely: reject symlinks and anything whose real
 * path escapes the project root, enforce per-file and total budgets.
 */
const resolveCandidates = async (
  rootDir: string,
  relPaths: string[],
  limits: SourceLimits,
): Promise<SafeReadResult> => {
  const sorted = [...relPaths].sort(compareCodeUnits);
  const warnings: string[] = [];
  let partial = false;

  let capped = sorted;
  if (sorted.length > limits.maxFiles) {
    capped = sorted.slice(0, limits.maxFiles);
    partial = true;
    warnings.push(
      `Scan limited to ${limits.maxFiles} files (${sorted.length} matched). Source coverage is partial.`,
    );
  }

  const files: SafeReadResult['files'] = [];
  let totalBytes = 0;
  for (const relPath of capped) {
    const absPath = path.join(rootDir, relPath);
    let lstat;
    try {
      lstat = await fs.lstat(absPath);
    } catch {
      continue;
    }
    if (lstat.isSymbolicLink() || !lstat.isFile()) {
      partial = true;
      warnings.push(`Skipped unsafe path (symlink or non-file): ${relPath}`);
      continue;
    }
    let realPath;
    try {
      realPath = await fs.realpath(absPath);
    } catch {
      continue;
    }
    if (realPath !== absPath && !realPath.startsWith(rootDir + path.sep)) {
      partial = true;
      warnings.push(`Skipped path outside the project root: ${relPath}`);
      continue;
    }
    if (lstat.size > limits.maxFileBytes) {
      partial = true;
      warnings.push(`Skipped oversized file (> ${limits.maxFileBytes} bytes): ${relPath}`);
      continue;
    }
    if (totalBytes + lstat.size > limits.maxTotalBytes) {
      partial = true;
      warnings.push('Total source budget exceeded. Remaining files were skipped.');
      break;
    }
    totalBytes += lstat.size;
    files.push({ relPath, absPath, size: lstat.size });
  }

  return { files, warnings, partial };
};

const textCache = new WeakMap<ProjectDiscovery, Promise<CollectedSources>>();

export const collectSources = (
  discovery: ProjectDiscovery,
  limits: SourceLimits = DEFAULT_LIMITS,
): Promise<CollectedSources> => {
  const cached = textCache.get(discovery);
  if (cached !== undefined) {
    return cached;
  }
  const promise = collectSourcesUncached(discovery, limits);
  textCache.set(discovery, promise);
  return promise;
};

const collectSourcesUncached = async (
  discovery: ProjectDiscovery,
  limits: SourceLimits,
): Promise<CollectedSources> => {
  const { rootDir } = discovery;
  // Symlinks are matched by the glob but rejected below with a warning, so
  // omitted paths always surface as partial coverage instead of vanishing.
  const globOptions = {
    cwd: rootDir,
    ignore: IGNORE_PATTERNS,
    absolute: false,
    dot: false,
    onlyFiles: true,
  };
  const [sourceMatches, styleMatches] = await Promise.all([
    glob(SOURCE_PATTERNS, globOptions),
    glob(STYLE_PATTERNS, globOptions),
  ]);

  const sourceResult = await resolveCandidates(rootDir, sourceMatches, limits);
  const styleResult = await resolveCandidates(rootDir, styleMatches, limits);

  const files: SourceFile[] = [];
  for (const candidate of sourceResult.files) {
    const text = await fs.readFile(candidate.absPath, 'utf8');
    const relPosix = candidate.relPath.split(path.sep).join('/');
    files.push({
      path: candidate.absPath,
      relPath: relPosix,
      kind: kindOf(relPosix),
      text,
    });
  }
  const styles: StyleFile[] = [];
  for (const candidate of styleResult.files) {
    const text = await fs.readFile(candidate.absPath, 'utf8');
    styles.push({
      path: candidate.absPath,
      relPath: candidate.relPath.split(path.sep).join('/'),
      text,
    });
  }

  const warnings = [...sourceResult.warnings, ...styleResult.warnings];
  const totalBytes = [...sourceResult.files, ...styleResult.files].reduce(
    (sum, file) => sum + file.size,
    0,
  );
  return {
    files,
    styles,
    coverage: {
      status: sourceResult.partial || styleResult.partial ? 'partial' : 'complete',
      fileCount: files.length,
      totalBytes,
      warnings,
    },
  };
};
