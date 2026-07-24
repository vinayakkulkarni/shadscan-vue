import type { AuditRule } from '../../audit.js';
import { forEachElement, isShellFile, staticClassList } from './polish-shared.js';

const BREAKPOINT_CLASS = /^(?:sm|md|lg|xl|2xl):/u;
const CONTAINER_QUERY_CLASS = /^@(?:sm|md|lg|xl):/u;

export const responsiveShellPresent: AuditRule = {
  id: 'responsive-shell-present',
  title: 'App shell adapts across breakpoints',
  description:
    'The app shell should change layout across breakpoints instead of rendering one fixed desktop composition on every viewport.',
  category: 'production-polish',
  severity: 'warning',
  confidence: 'medium',
  maxScore: 3,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const shellFiles = files.filter(
      (file) => file.sfc?.templateAst !== undefined && isShellFile(file.relPath),
    );
    if (shellFiles.length === 0) {
      return result.notApplicable();
    }

    let responsiveTokens = 0;
    forEachElement(shellFiles, (element) => {
      for (const token of staticClassList(element)) {
        if (BREAKPOINT_CLASS.test(token) || CONTAINER_QUERY_CLASS.test(token)) {
          responsiveTokens += 1;
        }
      }
    });

    const usesMediaQuery = shellFiles.some((file) =>
      /@media[^{]*\((?:min|max)-width|useMediaQuery|useBreakpoints/u.test(file.text),
    );

    if (responsiveTokens > 0 || usesMediaQuery) {
      return result.pass();
    }

    return result.fail([
      {
        message: 'The app shell declares no responsive behavior at any breakpoint.',
        evidence: shellFiles.map((file) => ({ path: file.relPath })),
        remediation:
          'Add breakpoint-aware layout to the shell (Tailwind sm:/md:/lg: utilities, container queries, or a media-query composable).',
      },
    ]);
  },
};
