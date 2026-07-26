import type { AuditRule } from '../../audit.js';
import type { ParsedFile } from '../../parse/project-files.js';
import type { Finding } from '../rule-result.js';
import { isPageFile } from './polish-shared.js';

const TITLE_PATTERN = /\b(?:title|titleTemplate)\s*:/u;
const DESCRIPTION_PATTERN = /\bdescription\s*:/u;
// definePageMeta is deliberately excluded: it configures routing (layout,
// middleware, validate) and does not emit a title or description, so counting
// it as a metadata call reports "missing title and description" on pages that
// never declared metadata at all.
const HEAD_CALL_PATTERN = /\b(?:useSeoMeta|useHead)\s*\(/u;

const COMPOSABLE_PATH = /(?:^|\/)composables\//u;
const EXPORTED_COMPOSABLE = /export\s+(?:const|function|async\s+function)\s+(use[A-Z]\w*)/gu;

/**
 * A page that redirects during setup never renders, so a crawler follows the
 * redirect and reads the destination's metadata instead. Demanding a title and
 * description for it reports a failure with nothing to fix.
 */
const REDIRECT_ONLY = /await\s+navigateTo\s*\(|definePageMeta\s*\(\s*\{[^}]*\bredirect\s*:/su;

/**
 * Extracting the head call into a `usePageSeo`-style composable is the
 * documented Nuxt pattern, so a page that calls one of those wrappers has
 * declared its metadata just as surely as one calling useSeoMeta inline.
 * Collect every project composable that reaches a head call, then treat a call
 * to it as a metadata declaration.
 */
const seoComposableNames = (files: readonly ParsedFile[]): Set<string> => {
  const names = new Set<string>();
  for (const file of files) {
    if (!COMPOSABLE_PATH.test(file.relPath) || !HEAD_CALL_PATTERN.test(file.text)) {
      continue;
    }
    for (const match of file.text.matchAll(EXPORTED_COMPOSABLE)) {
      names.add(match[1]!);
    }
  }
  return names;
};

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

    const wrappers = seoComposableNames(files);
    const wrapperCall =
      wrappers.size > 0 ? new RegExp(`\\b(?:${[...wrappers].join('|')})\\s*\\(`, 'u') : undefined;

    const findings: Finding[] = [];
    for (const page of pages) {
      if (REDIRECT_ONLY.test(page.text)) {
        continue;
      }
      const declaresHead =
        HEAD_CALL_PATTERN.test(page.text) || wrapperCall?.test(page.text) === true;
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
