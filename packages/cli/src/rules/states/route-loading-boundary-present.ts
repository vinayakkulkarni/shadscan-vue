import type { AuditRule } from '../../audit.js';
import type { ParsedFile } from '../../parse/project-files.js';
import { isNuxtShellFile } from './states-shared.js';

const NUXT_LOADING_INDICATOR_PATTERN = /<NuxtLoadingIndicator\b|<nuxt-loading-indicator\b/u;

/** Vue Router lazy route: `() => import(...)` inside a router-like file. */
const LAZY_ROUTE_PATTERN = /\(\s*\)\s*=>\s*import\s*\(/u;
const ROUTER_PROGRESS_PATTERN = /\.beforeEach\s*\(/u;
const SUSPENSE_FALLBACK_PATTERN = /#fallback\b|v-slot:fallback\b/u;

const looksLikeRouter = (file: ParsedFile): boolean =>
  file.relPath.includes('router') ||
  file.text.includes('createRouter') ||
  file.text.includes('createWebHistory') ||
  file.text.includes('createWebHashHistory');

export const routeLoadingBoundaryPresent: AuditRule = {
  id: 'route-loading-boundary-present',
  title: 'Route transitions expose a loading boundary',
  description:
    'Navigations should surface progress: a <NuxtLoadingIndicator> for Nuxt, or a router progress hook / top-level Suspense fallback for lazy-loaded Vue Router routes.',
  category: 'states',
  severity: 'warning',
  confidence: 'medium',
  maxScore: 4,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ discovery, sources, result }) => {
    const files = await sources();

    if (discovery.adapter === 'nuxt') {
      const hasIndicator = files.some(
        (file) => isNuxtShellFile(file.relPath) && NUXT_LOADING_INDICATOR_PATTERN.test(file.text),
      );
      if (hasIndicator) {
        return result.pass();
      }
      return result.fail([
        {
          message: 'Route transitions have no loading indicator.',
          evidence: [{ path: 'app.vue' }],
          remediation:
            'Add <NuxtLoadingIndicator /> to app.vue or a layout to surface navigation progress.',
        },
      ]);
    }

    if (discovery.adapter === 'vite-vue') {
      const routerFiles = files.filter(
        (file) => (file.kind === 'ts' || file.kind === 'js') && looksLikeRouter(file),
      );
      const hasLazyRoutes = routerFiles.some((file) => LAZY_ROUTE_PATTERN.test(file.text));
      if (!hasLazyRoutes) {
        return result.notApplicable();
      }
      const hasProgress = routerFiles.some((file) => ROUTER_PROGRESS_PATTERN.test(file.text));
      const hasSuspenseFallback = files.some(
        (file) => file.kind === 'vue' && SUSPENSE_FALLBACK_PATTERN.test(file.text),
      );
      if (hasProgress || hasSuspenseFallback) {
        return result.pass();
      }
      return result.fail([
        {
          message: 'Route transitions have no loading indicator.',
          evidence: [{ path: routerFiles[0]?.relPath ?? 'src/router.ts' }],
          remediation:
            'Add a router.beforeEach progress hook, or wrap <RouterView> in a <Suspense> with a #fallback slot.',
        },
      ]);
    }

    return result.notApplicable();
  },
};
