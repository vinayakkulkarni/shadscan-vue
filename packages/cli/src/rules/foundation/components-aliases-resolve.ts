import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse as parseJsonc, type ParseError } from 'jsonc-parser';
import type { AuditRule } from '../../audit.js';
import type { ShadcnAliases } from '../../discovery.js';

interface TsConfigShape {
  compilerOptions?: { paths?: Record<string, unknown> };
  references?: { path?: string }[];
  extends?: string | string[];
}

/** The lookup prefix an alias needs covered, e.g. `@/components` → `@/`. */
const aliasPrefix = (alias: string): string => {
  const slash = alias.indexOf('/');
  if (slash === -1) {
    return alias;
  }
  return alias.slice(0, slash + 1);
};

/** A paths key covers an alias prefix, e.g. `@/*` covers `@/`. */
const pathKeyCovers = (pathKey: string, prefix: string): boolean => {
  const normalizedKey = pathKey.endsWith('*') ? pathKey.slice(0, -1) : pathKey;
  return normalizedKey === prefix || prefix.startsWith(normalizedKey);
};

const readConfig = async (filePath: string): Promise<TsConfigShape | undefined> => {
  let raw: string;
  try {
    raw = await fs.readFile(filePath, 'utf8');
  } catch {
    return undefined;
  }
  const errors: ParseError[] = [];
  return parseJsonc(raw, errors, { allowTrailingComma: true }) as TsConfigShape | undefined;
};

const pathKeysOf = (config: TsConfigShape | undefined): string[] => {
  const paths = config?.compilerOptions?.paths;
  return paths !== undefined && typeof paths === 'object' ? Object.keys(paths) : [];
};

/**
 * A Nuxt root tsconfig is a project-references stub: the real path mappings
 * live in the generated .nuxt configs it points at. Follow `references` and
 * `extends` one level so generated mappings count.
 */
interface ResolvedPaths {
  found: boolean;
  keys: string[];
  referencedConfigsNotYetGenerated: string[];
}

const readPaths = async (rootDir: string): Promise<ResolvedPaths> => {
  for (const file of ['tsconfig.json', 'jsconfig.json']) {
    const config = await readConfig(path.join(rootDir, file));
    if (config === undefined) {
      continue;
    }

    const keys = new Set(pathKeysOf(config));
    const referencedConfigsNotYetGenerated: string[] = [];
    const linked = [
      ...(Array.isArray(config.references)
        ? config.references
            .map((reference) => reference?.path)
            .filter((value): value is string => typeof value === 'string')
        : []),
      ...(typeof config.extends === 'string' ? [config.extends] : (config.extends ?? [])),
    ];

    for (const target of linked) {
      const resolved = path.resolve(rootDir, target);
      const candidate = resolved.endsWith('.json')
        ? resolved
        : path.join(resolved, 'tsconfig.json');
      const linkedConfig = await readConfig(candidate);
      if (linkedConfig === undefined) {
        referencedConfigsNotYetGenerated.push(path.relative(rootDir, candidate));
        continue;
      }
      for (const key of pathKeysOf(linkedConfig)) {
        keys.add(key);
      }
    }

    return { found: true, keys: [...keys], referencedConfigsNotYetGenerated };
  }
  return { found: false, keys: [], referencedConfigsNotYetGenerated: [] };
};

const aliasValues = (aliases: ShadcnAliases): string[] =>
  Object.values(aliases).filter((value): value is string => typeof value === 'string');

export const componentsAliasesResolve: AuditRule = {
  id: 'components-aliases-resolve',
  title: 'Shadcn aliases resolve to path mappings',
  description:
    'When components.json configures import aliases, tsconfig.json or jsconfig.json must declare matching compilerOptions.paths so the aliases resolve at build time.',
  category: 'foundation',
  severity: 'warning',
  confidence: 'high',
  maxScore: 2,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ discovery, result }) => {
    if (!discovery.shadcn.configPresent) {
      return result.notApplicable();
    }
    const aliases = aliasValues(discovery.shadcn.aliases);
    if (aliases.length === 0) {
      return result.notApplicable();
    }

    const { found, keys, referencedConfigsNotYetGenerated } = await readPaths(discovery.rootDir);
    if (!found) {
      return result.fail([
        {
          message:
            'Shadcn aliases are configured, but no tsconfig.json or jsconfig.json path mappings were found.',
          evidence: [{ path: 'tsconfig.json' }],
          remediation:
            'Add a `compilerOptions.paths` entry (e.g. `"@/*": ["./src/*"]`) to tsconfig.json or jsconfig.json.',
        },
      ]);
    }

    const prefixes = [...new Set(aliases.map(aliasPrefix))];
    const uncovered = prefixes.filter((prefix) => !keys.some((key) => pathKeyCovers(key, prefix)));
    if (uncovered.length > 0) {
      if (referencedConfigsNotYetGenerated.length > 0) {
        return result.advisory([
          {
            message: `Alias resolution could not be verified: ${referencedConfigsNotYetGenerated
              .map((file) => `"${file}"`)
              .join(
                ', ',
              )} ${referencedConfigsNotYetGenerated.length === 1 ? 'has' : 'have'} not been generated yet.`,
            evidence: [{ path: 'tsconfig.json' }],
            remediation:
              'Run the framework prepare step (for Nuxt, `nuxt prepare`) so generated path mappings exist, then re-run the scan.',
          },
        ]);
      }
      return result.fail([
        {
          message: `Shadcn alias ${uncovered.length === 1 ? 'prefix' : 'prefixes'} ${uncovered
            .map((prefix) => `"${prefix}"`)
            .join(', ')} ${uncovered.length === 1 ? 'is' : 'are'} not covered by any path mapping.`,
          evidence: [{ path: 'tsconfig.json' }],
          remediation:
            'Add a matching `compilerOptions.paths` entry for each shadcn alias prefix (e.g. `"@/*": ["./src/*"]`).',
        },
      ]);
    }

    return result.pass();
  },
};
