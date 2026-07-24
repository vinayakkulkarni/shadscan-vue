import path from 'node:path';
import type { AuditRule } from '../../audit.js';
import type { ParsedFile } from '../../parse/project-files.js';

const COLOR_MODE_MODULE = '@nuxtjs/color-mode';

/** Direct theme usage: a @vueuse color-mode composable or a manual dark toggle. */
const usesThemeComposable = (file: ParsedFile): boolean =>
  file.imports.some(
    (entry) =>
      entry.moduleSpecifier === '@vueuse/core' &&
      entry.named.some((name) => name === 'useColorMode' || name === 'useDark'),
  );

const MANUAL_DARK_TOGGLE_PATTERN =
  /documentElement[\s\S]{0,40}classList[\s\S]{0,60}\b(?:dark|theme)\b/u;

const usesThemeDirectly = (file: ParsedFile): boolean =>
  usesThemeComposable(file) || MANUAL_DARK_TOGGLE_PATTERN.test(file.text);

const isNuxtShell = (relPath: string): boolean =>
  relPath === 'app.vue' ||
  relPath === 'app/app.vue' ||
  relPath.startsWith('layouts/') ||
  relPath.startsWith('app/layouts/');

const isViteShell = (relPath: string): boolean =>
  /(?:^|\/)App\.vue$/u.test(relPath) || /(?:^|\/)main\.[cm]?[jt]s$/u.test(relPath);

/**
 * Best-effort resolution of an import specifier to a collected ParsedFile.
 * Relative specifiers resolve against the importer directory; aliased or bare
 * specifiers fall back to a path-suffix match.
 */
const resolveImport = (
  importerRelPath: string,
  moduleSpecifier: string,
  files: readonly ParsedFile[],
): ParsedFile | undefined => {
  const withoutExt = (relPath: string): string => relPath.replace(/\.[^./]+$/u, '');
  if (moduleSpecifier.startsWith('./') || moduleSpecifier.startsWith('../')) {
    const importerDir = path.posix.dirname(importerRelPath);
    const target = withoutExt(path.posix.normalize(path.posix.join(importerDir, moduleSpecifier)));
    return files.find(
      (file) =>
        withoutExt(file.relPath) === target || withoutExt(file.relPath) === `${target}/index`,
    );
  }
  const aliasStripped = moduleSpecifier.replace(/^(?:@|~|#)\/?/u, '');
  const tail = withoutExt(aliasStripped);
  if (tail.length === 0) {
    return undefined;
  }
  return files.find((file) => {
    const base = withoutExt(file.relPath);
    return base === tail || base.endsWith(`/${tail}`);
  });
};

const shellWiresTheme = (
  files: readonly ParsedFile[],
  isShell: (relPath: string) => boolean,
): boolean => {
  const shellFiles = files.filter((file) => isShell(file.relPath));
  for (const shell of shellFiles) {
    if (usesThemeDirectly(shell)) {
      return true;
    }
    for (const entry of shell.imports) {
      const target = resolveImport(shell.relPath, entry.moduleSpecifier, files);
      if (target !== undefined && usesThemeDirectly(target)) {
        return true;
      }
    }
  }
  return false;
};

export const themeProviderMountedInShell: AuditRule = {
  id: 'theme-provider-mounted-in-shell',
  title: 'The theme provider is mounted in the app shell',
  description:
    'Confirms theme management is actually wired into the app shell (app.vue/layout or App.vue/main.ts), not merely present somewhere in the codebase.',
  category: 'foundation',
  severity: 'warning',
  confidence: 'high',
  maxScore: 3,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ discovery, sources, result }) => {
    const files = await sources();

    if (discovery.adapter === 'nuxt') {
      if (
        discovery.dependencies[COLOR_MODE_MODULE] !== undefined ||
        files.some(
          (file) =>
            /^nuxt\.config\.[cm]?[jt]s$/u.test(file.relPath) &&
            file.text.includes(COLOR_MODE_MODULE),
        )
      ) {
        return result.pass();
      }
      if (shellWiresTheme(files, isNuxtShell)) {
        return result.pass();
      }
      return result.fail([
        {
          message: 'The app shell does not wire up the theme provider.',
          evidence: [{ path: 'app.vue' }],
          remediation:
            "Add the '@nuxtjs/color-mode' module, or call your theme composable from app.vue or a layout.",
        },
      ]);
    }

    if (shellWiresTheme(files, isViteShell)) {
      return result.pass();
    }
    return result.fail([
      {
        message: 'The app shell does not wire up the theme provider.',
        evidence: [{ path: 'src/App.vue' }],
        remediation:
          'Call your theme composable (or class-toggle helper) from App.vue or the main.ts entry, or a component they import.',
      },
    ]);
  },
};
