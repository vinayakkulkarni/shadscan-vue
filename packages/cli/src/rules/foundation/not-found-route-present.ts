import type { AuditRule } from '../../audit.js';
import type { ParsedFile } from '../../parse/project-files.js';

const isNuxtErrorFile = (relPath: string): boolean =>
  relPath === 'error.vue' || relPath === 'app/error.vue';

/** Vue Router catch-all route shapes. */
const CATCH_ALL_PATTERNS = [
  /:pathMatch\(\.\*\)/u,
  /\/:catchAll/u,
  /path\s*:\s*['"]\*['"]/u,
  /path\s*:\s*['"]\/:pathMatch/u,
];

const NOT_FOUND_IMPORT_PATTERN = /\bNotFound\b/u;

const looksLikeRouter = (file: ParsedFile): boolean =>
  file.relPath.includes('router') ||
  file.text.includes('createRouter') ||
  file.text.includes('createWebHistory') ||
  file.text.includes('createWebHashHistory');

const routerHasCatchAll = (files: readonly ParsedFile[]): boolean => {
  for (const file of files) {
    if (file.kind !== 'ts' && file.kind !== 'js') {
      continue;
    }
    if (!looksLikeRouter(file)) {
      continue;
    }
    if (CATCH_ALL_PATTERNS.some((pattern) => pattern.test(file.text))) {
      return true;
    }
    if (NOT_FOUND_IMPORT_PATTERN.test(file.text)) {
      return true;
    }
  }
  return false;
};

export const notFoundRoutePresent: AuditRule = {
  id: 'not-found-route-present',
  title: 'A not-found route is present',
  description:
    'Confirms unmatched routes are handled: a Nuxt error.vue page, or a Vue Router catch-all route / NotFound view in the router configuration.',
  category: 'foundation',
  severity: 'warning',
  confidence: 'high',
  maxScore: 3,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ discovery, sources, result }) => {
    const files = await sources();

    if (discovery.adapter === 'nuxt') {
      if (files.some((file) => isNuxtErrorFile(file.relPath))) {
        return result.pass();
      }
      return result.fail([
        {
          message: 'No Nuxt error page was found to handle unmatched routes.',
          evidence: [{ path: 'error.vue' }],
          remediation:
            'Add an error.vue (or app/error.vue) at the project root to render a 404/500 fallback.',
        },
      ]);
    }

    if (routerHasCatchAll(files)) {
      return result.pass();
    }
    return result.fail([
      {
        message: 'No catch-all route or NotFound view was found in the router configuration.',
        evidence: [{ path: 'src/router.ts' }],
        remediation:
          "Add a catch-all route (path: '/:pathMatch(.*)*') that renders a NotFound view.",
      },
    ]);
  },
};
