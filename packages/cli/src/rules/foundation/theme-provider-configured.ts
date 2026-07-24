import type { AuditRule } from '../../audit.js';
import type { ParsedFile } from '../../parse/project-files.js';

const COLOR_MODE_MODULE = '@nuxtjs/color-mode';
const NUXT_CONFIG_PATTERN = /^nuxt\.config\.[cm]?[jt]s$/u;

/** Manual `documentElement.classList` dark-mode toggling. */
const MANUAL_DARK_TOGGLE_PATTERN =
  /documentElement[\s\S]{0,40}classList[\s\S]{0,60}\b(?:dark|theme)\b/u;

const importsThemeComposable = (file: ParsedFile): boolean =>
  file.imports.some(
    (entry) =>
      entry.moduleSpecifier === '@vueuse/core' &&
      entry.named.some((name) => name === 'useColorMode' || name === 'useDark'),
  );

export const themeProviderConfigured: AuditRule = {
  id: 'theme-provider-configured',
  title: 'A theme provider or theme management is configured',
  description:
    'Confirms the app ships light/dark theme management: the Nuxt color-mode module, a @vueuse/core useColorMode/useDark composable, or a manual documentElement dark-class toggle.',
  category: 'foundation',
  severity: 'warning',
  confidence: 'high',
  maxScore: 5,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ discovery, sources, result }) => {
    if (discovery.dependencies[COLOR_MODE_MODULE] !== undefined) {
      return result.pass();
    }

    const files = await sources();

    for (const file of files) {
      if (NUXT_CONFIG_PATTERN.test(file.relPath) && file.text.includes(COLOR_MODE_MODULE)) {
        return result.pass();
      }
      if (importsThemeComposable(file)) {
        return result.pass();
      }
      if (MANUAL_DARK_TOGGLE_PATTERN.test(file.text)) {
        return result.pass();
      }
    }

    return result.fail([
      {
        message: 'No theme provider or theme management was found.',
        evidence: [{ path: 'package.json' }],
        remediation:
          "Add '@nuxtjs/color-mode' to your Nuxt modules, use `useColorMode`/`useDark` from '@vueuse/core', or wire a manual `document.documentElement.classList` dark-mode toggle.",
      },
    ]);
  },
};
