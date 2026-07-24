import type { AuditRule } from '../../audit.js';
import type { ParsedFile } from '../../parse/project-files.js';

const HTML_LANG_PATTERN = /<html[^>]*\slang=["']([^"']+)["']/iu;
const HTML_TAG_PATTERN = /<html[\s>]/iu;
const NUXT_CONFIG_LANG_PATTERN = /htmlAttrs\s*:\s*\{[^}]*lang\s*:\s*['"]([^'"]+)['"]/su;
const USE_HEAD_LANG_PATTERN = /htmlAttrs\s*:\s*\{[^}]*lang\s*:/su;

const findNuxtLang = (files: readonly ParsedFile[]): boolean => {
  for (const file of files) {
    const isConfig = /^nuxt\.config\.[cm]?[jt]s$/u.test(file.relPath);
    const isAppConfig = /^app\.config\.[cm]?[jt]s$/u.test(file.relPath);
    const isShellVue =
      file.relPath === 'app.vue' ||
      file.relPath === 'app/app.vue' ||
      file.relPath.startsWith('layouts/') ||
      file.relPath.startsWith('app/layouts/');
    if (!isConfig && !isAppConfig && !isShellVue) {
      continue;
    }
    if (NUXT_CONFIG_LANG_PATTERN.test(file.text) || USE_HEAD_LANG_PATTERN.test(file.text)) {
      return true;
    }
  }
  return false;
};

export const htmlLangPresent: AuditRule = {
  id: 'html-lang-present',
  title: 'Document declares a language',
  description:
    'The document root must declare a meaningful lang attribute so assistive technology can select the right voice and hyphenation.',
  category: 'accessibility',
  severity: 'error',
  confidence: 'high',
  maxScore: 2,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ discovery, sources, result }) => {
    const files = await sources();

    if (discovery.adapter === 'nuxt') {
      if (findNuxtLang(files)) {
        return result.pass();
      }
      return result.fail([
        {
          message: 'The Nuxt app does not declare a document language.',
          evidence: [{ path: 'nuxt.config.ts' }],
          remediation:
            "Set `app: { head: { htmlAttrs: { lang: 'en' } } }` in nuxt.config, or call `useHead({ htmlAttrs: { lang: 'en' } })` in app.vue.",
        },
      ]);
    }

    const htmlFiles = files.filter((file) => file.kind === 'html');
    for (const file of htmlFiles) {
      const match = HTML_LANG_PATTERN.exec(file.text);
      if (match !== null && match[1]!.trim().length > 0) {
        return result.pass();
      }
    }
    const evidence = htmlFiles.find((file) => HTML_TAG_PATTERN.test(file.text));
    return result.fail([
      {
        message: 'The HTML document root does not declare a language.',
        evidence: [{ path: evidence?.relPath ?? 'index.html' }],
        remediation: 'Add `lang="en"` (or the correct language) to the `<html>` element.',
      },
    ]);
  },
};
