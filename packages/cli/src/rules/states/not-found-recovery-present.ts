import type { AuditRule } from '../../audit.js';
import type { ParsedFile } from '../../parse/project-files.js';
import { collectTemplateElements, isNuxtErrorFile } from './states-shared.js';

const LINK_TAGS = new Set(['NuxtLink', 'nuxt-link', 'RouterLink', 'router-link', 'a']);
const BACK_HANDLER = /(?:history\.back|\$router\.back|router\.back|navigateTo\(\s*['"]\/)/u;
const SEARCH_INPUT = /type=['"]search['"]|role=['"]search['"]/u;

const isNotFoundSurface = (file: ParsedFile): boolean =>
  isNuxtErrorFile(file.relPath) || /not-?found|404/iu.test(file.relPath);

export const notFoundRecoveryPresent: AuditRule = {
  id: 'not-found-recovery-present',
  title: 'Not-found pages offer recovery',
  description:
    'A not-found page should route the user back into the product through navigation, a back action, or search rather than ending the session.',
  category: 'states',
  severity: 'warning',
  confidence: 'high',
  maxScore: 3,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const surfaces = files.filter(
      (file) =>
        file.kind === 'vue' && file.sfc?.templateAst !== undefined && isNotFoundSurface(file),
    );
    if (surfaces.length === 0) {
      return result.notApplicable();
    }

    const elements = collectTemplateElements(surfaces);
    const findings = [];

    for (const file of surfaces) {
      const hasLink = elements.some(
        (entry) => entry.file.relPath === file.relPath && LINK_TAGS.has(entry.element.tag),
      );
      const hasBack = BACK_HANDLER.test(file.text);
      const hasSearch = SEARCH_INPUT.test(file.text);
      if (!hasLink && !hasBack && !hasSearch) {
        findings.push({
          message: 'Not-found UI has no navigation, back, or search recovery action.',
          evidence: [{ path: file.relPath }],
          remediation:
            'Offer a link home, a back action, or a search field so the user can continue.',
        });
      }
    }

    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
