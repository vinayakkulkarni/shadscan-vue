import type { AuditRule } from '../../audit.js';
import type { Finding } from '../rule-result.js';

const STARTER_PATTERNS: { pattern: RegExp; label: string }[] = [
  { pattern: /\bVite\s*\+\s*Vue\b/iu, label: 'Vite + Vue starter heading' },
  { pattern: /\bYou did it!\b/iu, label: 'Nuxt welcome copy' },
  { pattern: /Welcome to your Nuxt (?:app|application)/iu, label: 'Nuxt welcome copy' },
  { pattern: /\bLorem ipsum\b/iu, label: 'placeholder lorem ipsum copy' },
  {
    pattern: /Recommended IDE Setup/iu,
    label: 'scaffolded README copy rendered in the UI',
  },
  {
    pattern: /Click on the Vite and Vue logos to learn more/iu,
    label: 'Vite starter copy',
  },
  { pattern: /Check out\s+<a[^>]*>\s*create-vue/iu, label: 'create-vue starter copy' },
  { pattern: /\bTODO:?\s*replace\b/iu, label: 'unreplaced TODO placeholder' },
  { pattern: /\byour-domain\.com\b/iu, label: 'placeholder domain' },
];

/**
 * example.com appears legitimately in input placeholders (you@example.com is
 * the conventional email hint), so it only counts as leftover scaffolding when
 * it is a real destination.
 */
const PLACEHOLDER_DOMAIN_AS_DESTINATION =
  /(?:href|src|action|:to|\bto)\s*=\s*["'][^"']*example\.com/iu;

export const noStarterCopy: AuditRule = {
  id: 'no-starter-copy',
  title: 'No scaffolded starter copy remains',
  description:
    'Detects leftover framework starter text, placeholder domains, and lorem ipsum that ships to users when a scaffold is never replaced.',
  category: 'production-polish',
  severity: 'warning',
  confidence: 'high',
  maxScore: 3,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const findings: Finding[] = [];

    for (const file of files) {
      if (file.kind !== 'vue' && file.kind !== 'html') {
        continue;
      }
      const templateText =
        file.kind === 'vue' ? (file.sfc?.descriptor.template?.content ?? '') : file.text;
      if (templateText.length === 0) {
        continue;
      }
      const checks = [
        ...STARTER_PATTERNS,
        { pattern: PLACEHOLDER_DOMAIN_AS_DESTINATION, label: 'placeholder domain' },
      ];
      for (const { pattern, label } of checks) {
        const match = pattern.exec(templateText);
        if (match === null) {
          continue;
        }
        const offsetInFile = file.text.indexOf(match[0]);
        const line =
          offsetInFile >= 0 ? file.text.slice(0, offsetInFile).split('\n').length : undefined;
        findings.push({
          message: `Scaffolded starter content is still rendered (${label}).`,
          evidence: [{ path: file.relPath, line }],
          remediation: 'Replace the scaffolded copy with real product content.',
        });
        break;
      }
    }

    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
