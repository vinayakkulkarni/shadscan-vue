import type { AuditRule } from '../../audit.js';
import type { ParsedFile } from '../../parse/project-files.js';

const NUXT_CONFIG_PATTERN = /^nuxt\.config\.[cm]?[jt]s$/u;

/** `app: { head: { title | titleTemplate } }` inside nuxt.config. */
const NUXT_HEAD_TITLE_PATTERN = /head\s*:\s*\{[\s\S]*?\b(?:title|titleTemplate)\s*:/u;

/** `useSeoMeta({ title })` or `useHead({ ... title ... })` with a title key. */
const USE_SEO_META_TITLE_PATTERN = /useSeoMeta\s*\(\s*\{[\s\S]*?\btitle\s*:/u;
const USE_HEAD_TITLE_PATTERN = /useHead\s*\(\s*\{[\s\S]*?\btitle\s*:/u;

const HTML_TITLE_PATTERN = /<title\b[^>]*>([\s\S]*?)<\/title>/iu;
const HTML_DESCRIPTION_PATTERN = /<meta\b[^>]*\bname=["']description["'][^>]*>/iu;

const isNuxtHeadHost = (relPath: string): boolean =>
  relPath === 'app.vue' ||
  relPath === 'app/app.vue' ||
  relPath.startsWith('layouts/') ||
  relPath.startsWith('app/layouts/') ||
  relPath.startsWith('pages/') ||
  relPath.startsWith('app/pages/');

const nuxtMetadataFound = (files: readonly ParsedFile[]): boolean => {
  for (const file of files) {
    if (NUXT_CONFIG_PATTERN.test(file.relPath) && NUXT_HEAD_TITLE_PATTERN.test(file.text)) {
      return true;
    }
    if (
      isNuxtHeadHost(file.relPath) &&
      (USE_SEO_META_TITLE_PATTERN.test(file.text) || USE_HEAD_TITLE_PATTERN.test(file.text))
    ) {
      return true;
    }
  }
  return false;
};

export const metadataConfigured: AuditRule = {
  id: 'metadata-configured',
  title: 'Document metadata is configured',
  description:
    'Confirms the app declares a document title and description so pages have meaningful metadata for browsers, search, and sharing.',
  category: 'foundation',
  severity: 'warning',
  confidence: 'high',
  maxScore: 3,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ discovery, sources, result }) => {
    const files = await sources();

    if (discovery.adapter === 'nuxt') {
      if (nuxtMetadataFound(files)) {
        return result.pass();
      }
      return result.fail([
        {
          message: 'No document title metadata was found.',
          evidence: [{ path: 'nuxt.config.ts' }],
          remediation:
            "Set `app: { head: { title: '...' } }` in nuxt.config, or call `useSeoMeta({ title, description })` in app.vue, a layout, or a page.",
        },
      ]);
    }

    const htmlFiles = files.filter((file) => file.kind === 'html');
    for (const file of htmlFiles) {
      const titleMatch = HTML_TITLE_PATTERN.exec(file.text);
      const hasTitle = titleMatch !== null && titleMatch[1]!.trim().length > 0;
      const hasDescription = HTML_DESCRIPTION_PATTERN.test(file.text);
      if (hasTitle && hasDescription) {
        return result.pass();
      }
      if (hasTitle || hasDescription) {
        const missing = hasTitle ? 'a meta description' : 'a non-empty <title>';
        return result.fail([
          {
            message: `The HTML document is missing ${missing}.`,
            evidence: [{ path: file.relPath }],
            remediation: 'Add a non-empty <title> and a <meta name="description"> to index.html.',
          },
        ]);
      }
    }

    return result.fail([
      {
        message: 'The HTML document is missing a non-empty <title> and a meta description.',
        evidence: [{ path: htmlFiles[0]?.relPath ?? 'index.html' }],
        remediation: 'Add a non-empty <title> and a <meta name="description"> to index.html.',
      },
    ]);
  },
};
