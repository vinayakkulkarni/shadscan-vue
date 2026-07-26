import type { AuditRule } from '../../audit.js';
import type { Finding } from '../rule-result.js';
import { isPageFile } from './polish-shared.js';

const TITLE_PATTERN = /\b(?:title|titleTemplate)\s*:/u;
const DESCRIPTION_PATTERN = /\bdescription\s*:/u;
// definePageMeta is deliberately excluded: it configures routing (layout,
// middleware, validate) and does not emit a title or description, so counting
// it as a metadata call reports "missing title and description" on pages that
// never declared metadata at all.
const HEAD_CALL_PATTERN = /\b(?:useSeoMeta|useHead)\s*\(/u;

export const metadataTitleDescriptionComplete: AuditRule = {
  id: 'metadata-title-description-complete',
  title: 'Routable pages declare a title and description',
  description:
    'Every routable page should set its own title and description so search results and browser tabs are not inherited from a generic app-level default.',
  category: 'production-polish',
  severity: 'warning',
  confidence: 'medium',
  maxScore: 3,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const pages = files.filter((file) => file.kind === 'vue' && isPageFile(file.relPath));
    if (pages.length === 0) {
      return result.notApplicable();
    }

    const findings: Finding[] = [];
    for (const page of pages) {
      const declaresHead = HEAD_CALL_PATTERN.test(page.text);
      if (!declaresHead) {
        findings.push({
          message: 'Page does not declare its own metadata.',
          evidence: [{ path: page.relPath }],
          remediation:
            'Call useSeoMeta({ title, description }) (or useHead) in this page so it does not inherit generic app metadata.',
        });
        continue;
      }
      const missing: string[] = [];
      if (!TITLE_PATTERN.test(page.text)) {
        missing.push('title');
      }
      if (!DESCRIPTION_PATTERN.test(page.text)) {
        missing.push('description');
      }
      if (missing.length > 0) {
        findings.push({
          message: `Page metadata is missing ${missing.join(' and ')}.`,
          evidence: [{ path: page.relPath }],
          remediation: `Add ${missing.join(' and ')} to the page metadata call.`,
        });
      }
    }

    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
