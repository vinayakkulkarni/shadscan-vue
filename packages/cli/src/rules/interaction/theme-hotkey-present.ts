import type { AuditRule } from '../../audit.js';
import type { ParsedFile } from '../../parse/project-files.js';

/**
 * Detects a keyboard shortcut that toggles the color theme, and requires a
 * typing-target guard so the shortcut does not fire while the user types.
 *
 * Detection is source-regex based and evidence-driven. A file qualifies when a
 * keyboard trigger (native keydown handler, `@keydown` template binding, or a
 * VueUse `onKeyStroke`/`useMagicKeys` shortcut on a `d`-ish key) is correlated
 * with a theme toggle in the same file. The shortcut must also be guarded
 * against typing targets, except for the `useMagicKeys` + `watch` pattern where
 * the guard is expressed via an `activeElement` check.
 */

const THEME_TOGGLE_PATTERN = /toggleDark|colorMode|isDark|classList\b[^\n]*['"]dark['"]/u;

const KEYDOWN_HANDLER_PATTERN = /addEventListener\s*\(\s*['"]keydown['"]/u;
const KEYDOWN_TEMPLATE_PATTERN = /@keydown\b|v-on:keydown\b/u;
const ON_KEYSTROKE_D_PATTERN = /onKeyStroke\s*\(\s*['"]d['"]/u;
const MAGIC_KEYS_PATTERN = /useMagicKeys\s*\(/u;
const MAGIC_KEYS_D_PATTERN = /useMagicKeys|keys\s*(?:\.|\[)\s*['"]?d['"]?/u;

/** A `d`-ish key referenced somewhere for keydown/onKeyStroke flows. */
const D_KEY_PATTERN = /\.key\s*===\s*['"]d['"]|key\s*===\s*['"]d['"]|['"]d['"]/u;

const TYPING_GUARD_PATTERN =
  /\b(?:INPUT|TEXTAREA|SELECT)\b|isContentEditable|tagName|contentEditable/u;
const ACTIVE_ELEMENT_PATTERN = /activeElement/u;

const isSourceFile = (file: ParsedFile): boolean =>
  file.kind === 'vue' || file.kind === 'ts' || file.kind === 'js';

interface Detection {
  hasTrigger: boolean;
  guarded: boolean;
}

const detectInFile = (file: ParsedFile): Detection => {
  const text = file.text;
  if (!THEME_TOGGLE_PATTERN.test(text)) {
    return { hasTrigger: false, guarded: false };
  }

  const usesMagicKeys = MAGIC_KEYS_PATTERN.test(text);
  const hasKeydownHandler = KEYDOWN_HANDLER_PATTERN.test(text);
  const hasKeydownTemplate = KEYDOWN_TEMPLATE_PATTERN.test(text);
  const hasOnKeyStroke = ON_KEYSTROKE_D_PATTERN.test(text);
  const hasMagicD = usesMagicKeys && MAGIC_KEYS_D_PATTERN.test(text);

  // The trigger must plausibly involve a `d`-ish key.
  const referencesDKey = D_KEY_PATTERN.test(text);
  const hasTrigger =
    (hasKeydownHandler && referencesDKey) ||
    (hasKeydownTemplate && referencesDKey) ||
    hasOnKeyStroke ||
    hasMagicD;

  if (!hasTrigger) {
    return { hasTrigger: false, guarded: false };
  }

  // useMagicKeys + watch pattern: the guard is an activeElement check.
  const guarded = usesMagicKeys
    ? ACTIVE_ELEMENT_PATTERN.test(text) || TYPING_GUARD_PATTERN.test(text)
    : TYPING_GUARD_PATTERN.test(text);

  return { hasTrigger: true, guarded };
};

export const themeHotkeyPresent: AuditRule = {
  id: 'theme-hotkey-present',
  title: 'A safe dark-mode keyboard shortcut exists',
  description:
    'A keyboard shortcut should toggle the color theme, guarded so it does not fire while the user is typing in an input, textarea, select, or contenteditable element.',
  category: 'interaction',
  severity: 'warning',
  confidence: 'high',
  maxScore: 5,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    let guardedMatch: ParsedFile | undefined;
    let unguardedMatch: ParsedFile | undefined;

    for (const file of files) {
      if (!isSourceFile(file)) {
        continue;
      }
      const detection = detectInFile(file);
      if (!detection.hasTrigger) {
        continue;
      }
      if (detection.guarded) {
        guardedMatch = file;
        break;
      }
      unguardedMatch ??= file;
    }

    if (guardedMatch !== undefined) {
      return result.pass();
    }

    return result.fail([
      {
        message: 'No safe dark-mode keyboard shortcut was found.',
        evidence: unguardedMatch !== undefined ? [{ path: unguardedMatch.relPath }] : [],
        remediation:
          'Add a keydown shortcut (for example the "d" key) that toggles dark mode, and guard it so it ignores events whose target is an INPUT, TEXTAREA, SELECT, or contenteditable element.',
      },
    ]);
  },
};
