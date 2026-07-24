import type { AuditRule } from '../../audit.js';
import type { ParsedFile } from '../../parse/project-files.js';
import type { Finding } from '../rule-result.js';

/**
 * Audits global `keydown` listeners for two safety hazards:
 *  - a `window`/`document` `addEventListener('keydown', ...)` with no matching
 *    `removeEventListener` (leaked listener), and
 *  - a bare printable single-key shortcut with no typing-target guard.
 *
 * VueUse helpers (`useEventListener`, `onKeyStroke`, `useMagicKeys`) auto-clean
 * and are treated as safe. Projects with no global hotkeys pass.
 */

const GLOBAL_KEYDOWN_PATTERN =
  /(?:window|document)\s*\.\s*addEventListener\s*\(\s*['"]keydown['"]/gu;
const REMOVE_KEYDOWN_PATTERN = /removeEventListener\s*\(\s*['"]keydown['"]/u;

const TYPING_GUARD_PATTERN =
  /\b(?:INPUT|TEXTAREA|SELECT)\b|isContentEditable|tagName|contentEditable|activeElement/u;

// Bare printable single-key comparisons like `e.key === 'a'`. Modifier-gated
// shortcuts (metaKey/ctrlKey/altKey) and non-printable keys are excluded.
const PRINTABLE_SINGLE_KEY_PATTERN = /\.key\s*===\s*['"][a-z0-9]['"]/iu;
const MODIFIER_PATTERN = /metaKey|ctrlKey|altKey/u;

const isSourceFile = (file: ParsedFile): boolean =>
  file.kind === 'vue' || file.kind === 'ts' || file.kind === 'js';

const lineOf = (text: string, index: number): number => text.slice(0, index).split('\n').length;

export const globalHotkeysAreSafe: AuditRule = {
  id: 'global-hotkeys-are-safe',
  title: 'Global keyboard shortcuts are registered safely',
  description:
    'Global keydown listeners must be cleaned up on unmount and must not hijack bare printable keys while the user is typing. VueUse listener helpers, which clean up automatically, are treated as safe.',
  category: 'interaction',
  severity: 'warning',
  confidence: 'medium',
  maxScore: 3,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const failures: Finding[] = [];

    for (const file of files) {
      if (!isSourceFile(file)) {
        continue;
      }
      const text = file.text;
      const matches = [...text.matchAll(GLOBAL_KEYDOWN_PATTERN)];
      if (matches.length === 0) {
        continue;
      }

      const hasRemoval = REMOVE_KEYDOWN_PATTERN.test(text);
      if (!hasRemoval) {
        failures.push({
          message: `A global keydown listener in ${file.relPath} is never removed, leaking across unmounts.`,
          evidence: [{ path: file.relPath, line: lineOf(text, matches[0]!.index) }],
          remediation:
            'Remove the listener in onUnmounted/onBeforeUnmount, or use VueUse `useEventListener`/`onKeyStroke` which clean up automatically.',
        });
      }

      const hasBarePrintable =
        PRINTABLE_SINGLE_KEY_PATTERN.test(text) && !MODIFIER_PATTERN.test(text);
      if (hasBarePrintable && !TYPING_GUARD_PATTERN.test(text)) {
        failures.push({
          message: `A bare printable single-key shortcut in ${file.relPath} has no typing-target guard.`,
          evidence: [{ path: file.relPath, line: lineOf(text, matches[0]!.index) }],
          remediation:
            'Guard the handler so it ignores events whose target is an INPUT, TEXTAREA, SELECT, or contenteditable element, or gate the shortcut behind a modifier key.',
        });
      }
    }

    if (failures.length > 0) {
      return result.fail(failures);
    }
    return result.pass();
  },
};
