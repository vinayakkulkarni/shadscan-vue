import type { AuditRule } from '../../audit.js';
import type { ParsedFile } from '../../parse/project-files.js';

/**
 * Detects the conventional Cmd/Ctrl+K shortcut that opens the command menu:
 * either a keydown handler that checks `metaKey || ctrlKey` with the `k` key,
 * calls `preventDefault`, and toggles state; or a VueUse `useMagicKeys`
 * `Meta+K` / `Ctrl+K` binding watched to toggle state.
 */

const MODIFIER_PATTERN = /metaKey|ctrlKey/u;
const K_KEY_PATTERN = /\.key\s*===\s*['"]k['"]|key\s*===\s*['"]k['"]/iu;
const PREVENT_DEFAULT_PATTERN = /preventDefault\s*\(/u;
const TOGGLE_PATTERN = /\.value\s*=|=\s*!|toggle|open\s*=|\bset[A-Z]/u;
const KEYDOWN_PATTERN = /keydown/u;

// useMagicKeys exposes a combination both as a string key (`keys['Meta+K']`)
// and as a destructured snake_case ref (`const { meta_k } = useMagicKeys()`).
// Matching only the string form misses the destructured idiom, which is the
// one VueUse documents first.
const MAGIC_KEYS_CMD_K_PATTERN =
  /useMagicKeys[\s\S]*?(?:(?:Meta|Cmd|Ctrl|Control)\s*\+\s*K|\b(?:meta|cmd|ctrl|control)_k\b)/iu;
const WATCH_PATTERN = /\bwatch\s*\(/u;

const isSourceFile = (file: ParsedFile): boolean =>
  file.kind === 'vue' || file.kind === 'ts' || file.kind === 'js';

const detectKeydownFlow = (text: string): boolean =>
  KEYDOWN_PATTERN.test(text) &&
  MODIFIER_PATTERN.test(text) &&
  K_KEY_PATTERN.test(text) &&
  PREVENT_DEFAULT_PATTERN.test(text) &&
  TOGGLE_PATTERN.test(text);

const detectMagicKeysFlow = (text: string): boolean =>
  MAGIC_KEYS_CMD_K_PATTERN.test(text) && WATCH_PATTERN.test(text);

export const commandMenuHotkeyPresent: AuditRule = {
  id: 'command-menu-hotkey-present',
  title: 'The command menu opens with Cmd/Ctrl+K',
  description:
    'The command palette should be reachable via the conventional Cmd/Ctrl+K shortcut that prevents the default action and toggles the menu open.',
  category: 'interaction',
  severity: 'warning',
  confidence: 'high',
  maxScore: 4,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const match = files.find(
      (file) =>
        isSourceFile(file) && (detectKeydownFlow(file.text) || detectMagicKeysFlow(file.text)),
    );

    if (match !== undefined) {
      return result.pass();
    }

    return result.fail([
      {
        message: 'No complete mounted Cmd/Ctrl+K command-menu shortcut was found.',
        evidence: [],
        remediation:
          'Add a keydown handler that checks `(e.metaKey || e.ctrlKey) && e.key === "k"`, calls `e.preventDefault()`, and toggles the command menu — or use VueUse `useMagicKeys` with a `Meta+K`/`Ctrl+K` watcher.',
      },
    ]);
  },
};
