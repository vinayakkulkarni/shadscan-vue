import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parse as parseJsonc, type ParseError } from 'jsonc-parser';
import type { AuditRule } from '../../audit.js';
import type { ShadcnAliases } from '../../discovery.js';

interface TsConfigShape {
  compilerOptions?: { paths?: Record<string, unknown> };
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

const readPaths = async (rootDir: string): Promise<{ found: boolean; keys: string[] }> => {
  for (const file of ['tsconfig.json', 'jsconfig.json']) {
    let raw: string;
    try {
      raw = await fs.readFile(path.join(rootDir, file), 'utf8');
    } catch {
      continue;
    }
    const errors: ParseError[] = [];
    const parsed = parseJsonc(raw, errors, { allowTrailingComma: true }) as
      | TsConfigShape
      | undefined;
    const paths = parsed?.compilerOptions?.paths;
    const keys = paths !== undefined && typeof paths === 'object' ? Object.keys(paths) : [];
    return { found: true, keys };
  }
  return { found: false, keys: [] };
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

    const { found, keys } = await readPaths(discovery.rootDir);
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
