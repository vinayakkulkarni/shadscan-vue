import type { AuditRule } from '../../audit.js';
import type { Finding } from '../rule-result.js';

const GLOBAL_KEY_BINDING =
  /addEventListener\s*\(\s*['"]keydown['"]|onKeyStroke\s*\(|useEventListener\s*\([^,]*,\s*['"]keydown['"]/u;

const MAGIC_KEYS_SINGLE_LETTER =
  /\{\s*[^}]*\b(?<!meta_)(?<!ctrl_)(?<!alt_)(?<!shift_)[a-z]\b[^}]*\}\s*=\s*useMagicKeys/u;

/**
 * A shortcut that fires while the user is typing steals the keystroke. The
 * guard is a check that the event target is not a field: tagName against
 * INPUT/TEXTAREA/SELECT, an instanceof against the matching element type, a
 * closest()/matches() selector, or isContentEditable.
 */
const TYPING_GUARD =
  /\b(?:INPUT|TEXTAREA|SELECT)\b|HTML(?:Input|TextArea|Select)Element|(?:closest|matches)\s*\(\s*['"][^'"]*(?:input|textarea|select)|isContentEditable|contenteditable/iu;

const MODIFIER = /metaKey|ctrlKey|altKey|\b(?:meta|ctrl|alt)_/u;

/**
 * Escape, Enter, Tab and the arrows are expected to work while a field has
 * focus — Escape closing a dialog is correct behaviour, not a stolen
 * keystroke. A handler that only reacts to those needs no typing guard.
 */
const NAVIGATION_KEYS = /^(?:Escape|Enter|Tab|Arrow[A-Za-z]+|Home|End|Page[A-Za-z]+)$/u;

const reactsOnlyToNavigationKeys = (text: string): boolean => {
  const compared = [...text.matchAll(/\.key\s*===\s*['"]([^'"]+)['"]/gu)].map((match) => match[1]!);
  return compared.length > 0 && compared.every((key) => NAVIGATION_KEYS.test(key));
};

const lineOf = (text: string, pattern: RegExp): number => {
  const index = text.search(pattern);
  if (index < 0) {
    return 1;
  }
  return text.slice(0, index).split('\n').length;
};

export const typingTargetGuard: AuditRule = {
  id: 'typing-target-guard',
  title: 'Global shortcuts ignore keystrokes aimed at a field',
  description:
    'A global single-key shortcut should not fire while the user is typing. Handlers bound to the document need a check that the event target is not an input, textarea, select, or contenteditable element.',
  category: 'interaction',
  severity: 'warning',
  confidence: 'medium',
  maxScore: 3,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const findings: Finding[] = [];
    let evaluated = 0;

    for (const file of files) {
      if (file.kind !== 'vue' && file.kind !== 'ts' && file.kind !== 'js') {
        continue;
      }

      const bindsGlobalKey = GLOBAL_KEY_BINDING.test(file.text);
      const bindsBareLetter = MAGIC_KEYS_SINGLE_LETTER.test(file.text);
      if (!bindsGlobalKey && !bindsBareLetter) {
        continue;
      }

      // A modifier combination (Cmd+K) does not collide with typing.
      if (!bindsBareLetter && MODIFIER.test(file.text) && !GLOBAL_KEY_BINDING.test(file.text)) {
        continue;
      }

      if (reactsOnlyToNavigationKeys(file.text)) {
        continue;
      }

      evaluated += 1;
      if (TYPING_GUARD.test(file.text)) {
        continue;
      }

      findings.push({
        message: 'A global key handler has no guard for keystrokes aimed at a field.',
        evidence: [
          {
            path: file.relPath,
            line: lineOf(file.text, bindsGlobalKey ? GLOBAL_KEY_BINDING : MAGIC_KEYS_SINGLE_LETTER),
          },
        ],
        remediation:
          'Return early when the event target is an input, textarea, select, or contenteditable element before acting on the key.',
      });
    }

    if (evaluated === 0) {
      return result.notApplicable();
    }
    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
