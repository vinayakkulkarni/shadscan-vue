import type { AuditRule } from '../../audit.js';
import type { ParsedFile } from '../../parse/project-files.js';

const COLOR_MODE_MODULE = '@nuxtjs/color-mode';

/** Client-side theme reads that flash without an SSR-safe inline script. */
const CLIENT_THEME_READ_PATTERN = /\blocalStorage\b|\bmatchMedia\s*\(/u;

/** An inline head script touching documentElement/classList before hydration. */
const INLINE_HEAD_SCRIPT_PATTERN =
  /useHead\s*\(\s*\{[\s\S]*?\bscript\s*:[\s\S]*?\binnerHTML\b[\s\S]*?(?:documentElement|classList)/u;

const usesColorModeModule = (
  discovery: { dependencies: Record<string, string> },
  files: readonly ParsedFile[],
): boolean =>
  discovery.dependencies[COLOR_MODE_MODULE] !== undefined ||
  files.some(
    (file) =>
      /^nuxt\.config\.[cm]?[jt]s$/u.test(file.relPath) && file.text.includes(COLOR_MODE_MODULE),
  );

export const themeHydrationSafe: AuditRule = {
  id: 'theme-hydration-safe',
  title: 'Theme state is hydration-safe',
  description:
    'For Nuxt apps, confirms theme state is read in an SSR-safe way: via the color-mode module, or a manual client-side theme read guarded by an inline head script that runs before hydration.',
  category: 'foundation',
  severity: 'warning',
  confidence: 'high',
  maxScore: 2,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ discovery, sources, result }) => {
    if (discovery.adapter !== 'nuxt') {
      return result.notApplicable();
    }

    const files = await sources();

    if (usesColorModeModule(discovery, files)) {
      return result.pass();
    }

    const clientThemeRead = files.some((file) => CLIENT_THEME_READ_PATTERN.test(file.text));
    if (!clientThemeRead) {
      return result.notApplicable();
    }

    if (files.some((file) => INLINE_HEAD_SCRIPT_PATTERN.test(file.text))) {
      return result.pass();
    }

    return result.fail([
      {
        message:
          'Theme state is read client-side without an SSR-safe inline script; users will see a flash of the wrong theme.',
        evidence: [{ path: 'app.vue' }],
        remediation:
          "Use the '@nuxtjs/color-mode' module, or inject an inline head script (useHead script innerHTML) that sets the theme class on documentElement before hydration.",
      },
    ]);
  },
};
