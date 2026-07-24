import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse as parseJsonc, type ParseError } from 'jsonc-parser';
import { CliError } from './cli-error.js';

export type AdapterId = 'nuxt' | 'vite-vue' | 'generic-vue';
export type PackageManagerId = 'pnpm' | 'yarn' | 'npm' | 'bun' | 'unknown';

export interface ShadcnAliases {
  utils?: string;
  components?: string;
  ui?: string;
  lib?: string;
  composables?: string;
}

export interface ShadcnDiscovery {
  /** components.json exists and parsed cleanly. */
  configPresent: boolean;
  confidence: 'high' | 'low';
  style?: string;
  tailwindCss?: string;
  aliases: ShadcnAliases;
  /** Resolved alias for ui components (aliases.ui or `${aliases.components}/ui`). */
  uiAlias?: string;
  /** shadcn-nuxt module dependency detected. */
  nuxtModule: boolean;
  /** Statically-read shadcn-nuxt component prefix, when determinable. */
  nuxtPrefix?: string;
}

export interface ProjectDiscovery {
  /** Absolute real path of the scanned project root. */
  rootDir: string;
  packageName: string;
  packageManager: PackageManagerId;
  adapter: AdapterId;
  /** Merged dependencies + devDependencies from package.json. */
  dependencies: Record<string, string>;
  shadcn: ShadcnDiscovery;
  warnings: string[];
}

const readTextIfExists = async (filePath: string): Promise<string | undefined> => {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return undefined;
  }
};

const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const detectPackageManager = async (
  rootDir: string,
  packageManagerField: string | undefined,
): Promise<PackageManagerId> => {
  if (await fileExists(path.join(rootDir, 'pnpm-lock.yaml'))) {
    return 'pnpm';
  }
  if (await fileExists(path.join(rootDir, 'yarn.lock'))) {
    return 'yarn';
  }
  if (await fileExists(path.join(rootDir, 'package-lock.json'))) {
    return 'npm';
  }
  if (
    (await fileExists(path.join(rootDir, 'bun.lock'))) ||
    (await fileExists(path.join(rootDir, 'bun.lockb')))
  ) {
    return 'bun';
  }
  const prefix = packageManagerField?.split('@')[0];
  if (prefix === 'pnpm' || prefix === 'yarn' || prefix === 'npm' || prefix === 'bun') {
    return prefix;
  }
  return 'unknown';
};

const detectAdapter = (dependencies: Record<string, string>): AdapterId => {
  if (dependencies.nuxt !== undefined || dependencies['nuxt-nightly'] !== undefined) {
    return 'nuxt';
  }
  if (dependencies.vue !== undefined && dependencies.vite !== undefined) {
    return 'vite-vue';
  }
  if (dependencies.vue !== undefined) {
    return 'generic-vue';
  }
  throw new CliError(
    'unsupported-project',
    'This project does not declare a vue or nuxt dependency. shadscan-vue audits shadcn-vue and shadcn-nuxt apps.',
  );
};

interface ComponentsJsonShape {
  style?: unknown;
  tailwind?: { css?: unknown };
  aliases?: Record<string, unknown>;
}

const readShadcnConfig = async (
  rootDir: string,
  dependencies: Record<string, string>,
  warnings: string[],
): Promise<ShadcnDiscovery> => {
  const nuxtModule = dependencies['shadcn-nuxt'] !== undefined;
  const base: ShadcnDiscovery = {
    configPresent: false,
    confidence: 'low',
    aliases: {},
    nuxtModule,
  };

  if (nuxtModule) {
    base.nuxtPrefix = await readNuxtShadcnPrefix(rootDir);
  }

  const raw = await readTextIfExists(path.join(rootDir, 'components.json'));
  if (raw === undefined) {
    warnings.push(
      'components.json was not found at the project root. shadcn component detection runs with low confidence.',
    );
    return base;
  }

  const errors: ParseError[] = [];
  const parsed = parseJsonc(raw, errors, { allowTrailingComma: true }) as
    | ComponentsJsonShape
    | undefined;
  if (errors.length > 0 || parsed === undefined || typeof parsed !== 'object') {
    warnings.push(
      'components.json could not be parsed. shadcn component detection runs with low confidence.',
    );
    return base;
  }

  const aliases: ShadcnAliases = {};
  if (parsed.aliases !== undefined) {
    for (const key of ['utils', 'components', 'ui', 'lib', 'composables'] as const) {
      const value = parsed.aliases[key];
      if (typeof value === 'string' && value.length > 0) {
        aliases[key] = value;
      }
    }
  }
  const uiAlias =
    aliases.ui ?? (aliases.components !== undefined ? `${aliases.components}/ui` : undefined);

  return {
    configPresent: true,
    confidence: 'high',
    style: typeof parsed.style === 'string' ? parsed.style : undefined,
    tailwindCss: typeof parsed.tailwind?.css === 'string' ? parsed.tailwind.css : undefined,
    aliases,
    uiAlias,
    nuxtModule,
    nuxtPrefix: base.nuxtPrefix,
  };
};

const NUXT_CONFIG_FILES = [
  'nuxt.config.ts',
  'nuxt.config.js',
  'nuxt.config.mts',
  'nuxt.config.mjs',
];

/**
 * Best-effort static read of the shadcn-nuxt `prefix` option. Returns
 * undefined when the config cannot be determined statically.
 */
const readNuxtShadcnPrefix = async (rootDir: string): Promise<string | undefined> => {
  for (const file of NUXT_CONFIG_FILES) {
    const text = await readTextIfExists(path.join(rootDir, file));
    if (text === undefined) {
      continue;
    }
    const match = /shadcn\s*:\s*\{[^}]*prefix\s*:\s*['"]([^'"]*)['"]/su.exec(text);
    if (match !== null) {
      return match[1];
    }
  }
  return undefined;
};

export const discoverProject = async (inputPath: string): Promise<ProjectDiscovery> => {
  const resolved = path.resolve(process.cwd(), inputPath);
  let rootDir: string;
  try {
    rootDir = await fs.realpath(resolved);
  } catch {
    throw new CliError('invalid-path', `Project directory does not exist: ${resolved}`);
  }
  let stats;
  try {
    stats = await fs.stat(rootDir);
  } catch {
    throw new CliError('invalid-path', `Project directory does not exist: ${resolved}`);
  }
  if (!stats.isDirectory()) {
    throw new CliError('invalid-path', `Project path is not a directory: ${resolved}`);
  }

  const packageJsonText = await readTextIfExists(path.join(rootDir, 'package.json'));
  if (packageJsonText === undefined) {
    throw new CliError(
      'not-a-project',
      `No package.json was found in ${rootDir}. Point shadscan-vue at a Vue or Nuxt package root.`,
    );
  }

  let packageJson: {
    name?: unknown;
    packageManager?: unknown;
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  };
  try {
    packageJson = JSON.parse(packageJsonText) as typeof packageJson;
  } catch {
    throw new CliError('invalid-package-json', `package.json in ${rootDir} is not valid JSON.`);
  }

  const dependencies: Record<string, string> = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  const adapter = detectAdapter(dependencies);
  const warnings: string[] = [];
  const shadcn = await readShadcnConfig(rootDir, dependencies, warnings);
  const packageManager = await detectPackageManager(
    rootDir,
    typeof packageJson.packageManager === 'string' ? packageJson.packageManager : undefined,
  );

  return {
    rootDir,
    packageName: typeof packageJson.name === 'string' ? packageJson.name : '(unnamed)',
    packageManager,
    adapter,
    dependencies,
    shadcn,
    warnings,
  };
};
