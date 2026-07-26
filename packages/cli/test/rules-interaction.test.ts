import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { AuditRule } from '../src/audit.js';
import { discoverProject, runAudit } from '../src/index.js';
import { commandMenuHotkeyPresent } from '../src/rules/interaction/command-menu-hotkey-present.js';
import { commandMenuPresent } from '../src/rules/interaction/command-menu-present.js';
import { destructiveActionsConfirmed } from '../src/rules/interaction/destructive-actions-confirmed.js';
import { focusVisibleNotSuppressed } from '../src/rules/interaction/focus-visible-not-suppressed.js';
import { globalHotkeysAreSafe } from '../src/rules/interaction/global-hotkeys-are-safe.js';
import { itemsBelongToGroups } from '../src/rules/interaction/items-belong-to-groups.js';
import { mobileNavPresent } from '../src/rules/interaction/mobile-nav-present.js';
import { themeHotkeyPresent } from '../src/rules/interaction/theme-hotkey-present.js';

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'fixtures',
  'rules',
  'interaction',
);

const allRules: readonly AuditRule[] = [
  themeHotkeyPresent,
  commandMenuPresent,
  commandMenuHotkeyPresent,
  globalHotkeysAreSafe,
  mobileNavPresent,
  focusVisibleNotSuppressed,
  itemsBelongToGroups,
  destructiveActionsConfirmed,
];

const outcomeOf = async (fixture: string, ruleId: string) => {
  const discovery = await discoverProject(path.join(fixturesDir, fixture));
  const report = await runAudit(discovery, allRules);
  const outcome = report.outcomes.find((entry) => entry.rule.id === ruleId);
  if (outcome === undefined) {
    throw new Error(`No outcome for ${ruleId}`);
  }
  return outcome;
};

describe('theme-hotkey-present', () => {
  it('passes for keydown handler with typing guard', async () => {
    expect((await outcomeOf('theme-hotkey-pass', 'theme-hotkey-present')).status).toBe('pass');
  });

  it('passes for useMagicKeys + watch with activeElement guard', async () => {
    expect((await outcomeOf('theme-hotkey-magickeys-pass', 'theme-hotkey-present')).status).toBe(
      'pass',
    );
  });

  it('fails when the shortcut has no typing-target guard', async () => {
    const outcome = await outcomeOf('theme-hotkey-noguard-fail', 'theme-hotkey-present');
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.message).toContain('No safe dark-mode keyboard shortcut');
  });

  it('fails when no theme shortcut exists', async () => {
    expect((await outcomeOf('theme-hotkey-missing-fail', 'theme-hotkey-present')).status).toBe(
      'fail',
    );
  });
});

describe('command-menu-present', () => {
  it('passes for a complete command dialog', async () => {
    expect((await outcomeOf('command-menu-pass', 'command-menu-present')).status).toBe('pass');
  });

  it('fails when parts are missing', async () => {
    const outcome = await outcomeOf('command-menu-partial-fail', 'command-menu-present');
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.message).toContain(
      'command module is installed but no template assembles it',
    );
  });

  it('fails when no command module is used', async () => {
    expect((await outcomeOf('command-menu-none-fail', 'command-menu-present')).status).toBe('fail');
  });
});

describe('command-menu-hotkey-present', () => {
  it('passes for Cmd/Ctrl+K keydown handler', async () => {
    expect((await outcomeOf('command-hotkey-pass', 'command-menu-hotkey-present')).status).toBe(
      'pass',
    );
  });

  it('passes for useMagicKeys Meta+K watch', async () => {
    expect(
      (await outcomeOf('command-hotkey-magickeys-pass', 'command-menu-hotkey-present')).status,
    ).toBe('pass');
  });

  it('fails when the shortcut is absent', async () => {
    const outcome = await outcomeOf('command-hotkey-fail', 'command-menu-hotkey-present');
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.message).toContain('Cmd/Ctrl+K command-menu shortcut');
  });
});

describe('global-hotkeys-are-safe', () => {
  it('passes for VueUse auto-cleaned listeners', async () => {
    expect((await outcomeOf('global-hotkeys-safe-pass', 'global-hotkeys-are-safe')).status).toBe(
      'pass',
    );
  });

  it('passes when there are no global hotkeys', async () => {
    expect((await outcomeOf('global-hotkeys-none-pass', 'global-hotkeys-are-safe')).status).toBe(
      'pass',
    );
  });

  it('fails when a listener is not removed', async () => {
    expect((await outcomeOf('global-hotkeys-leak-fail', 'global-hotkeys-are-safe')).status).toBe(
      'fail',
    );
  });

  it('fails for a bare printable single-key shortcut without a guard', async () => {
    expect(
      (await outcomeOf('global-hotkeys-bareprintable-fail', 'global-hotkeys-are-safe')).status,
    ).toBe('fail');
  });
});

describe('mobile-nav-present', () => {
  it('passes for a responsive Sheet trigger', async () => {
    expect((await outcomeOf('mobile-nav-pass', 'mobile-nav-present')).status).toBe('pass');
  });

  it('passes for a responsive fixed bottom nav', async () => {
    expect((await outcomeOf('mobile-nav-bottom-pass', 'mobile-nav-present')).status).toBe('pass');
  });

  it('is not-applicable when there is no navigation', async () => {
    expect((await outcomeOf('mobile-nav-none-na', 'mobile-nav-present')).status).toBe(
      'not-applicable',
    );
  });

  it('fails when nav has no responsive trigger', async () => {
    const outcome = await outcomeOf('mobile-nav-notrigger-fail', 'mobile-nav-present');
    expect(outcome.status).toBe('fail');
  });
});

describe('focus-visible-not-suppressed', () => {
  it('passes when a focus replacement is in the same class list', async () => {
    expect((await outcomeOf('focus-visible-pass', 'focus-visible-not-suppressed')).status).toBe(
      'pass',
    );
  });

  it('passes when CSS provides a :focus-visible replacement', async () => {
    expect((await outcomeOf('focus-visible-css-pass', 'focus-visible-not-suppressed')).status).toBe(
      'pass',
    );
  });

  it('passes (excludes) files under components/ui', async () => {
    expect(
      (await outcomeOf('focus-visible-ui-excluded-pass', 'focus-visible-not-suppressed')).status,
    ).toBe('pass');
  });

  it('fails when outline is suppressed with no replacement', async () => {
    const outcome = await outcomeOf(
      'focus-visible-suppressed-fail',
      'focus-visible-not-suppressed',
    );
    expect(outcome.status).toBe('fail');
    expect(outcome.findings.length).toBeGreaterThan(0);
  });
});

describe('items-belong-to-groups', () => {
  it('passes when items sit inside their content wrappers', async () => {
    expect((await outcomeOf('items-groups-pass', 'items-belong-to-groups')).status).toBe('pass');
  });

  it('is advisory when an item is misplaced in the same file', async () => {
    const outcome = await outcomeOf('items-groups-advisory', 'items-belong-to-groups');
    expect(outcome.status).toBe('advisory');
    expect(outcome.findings.length).toBeGreaterThan(0);
  });

  it('is advisory when the parent chain leaves the file', async () => {
    const outcome = await outcomeOf('items-groups-crossfile-advisory', 'items-belong-to-groups');
    expect(outcome.status).toBe('advisory');
    expect(outcome.findings[0]!.message).toContain('composed across component boundaries');
  });
});

describe('destructive-actions-confirmed', () => {
  it('passes when a destructive action has correlated confirmation', async () => {
    expect(
      (await outcomeOf('destructive-confirmed-pass', 'destructive-actions-confirmed')).status,
    ).toBe('pass');
  });

  it('passes when there are no destructive actions', async () => {
    expect((await outcomeOf('destructive-none-pass', 'destructive-actions-confirmed')).status).toBe(
      'pass',
    );
  });

  it('is advisory when a destructive action is unconfirmed', async () => {
    const outcome = await outcomeOf(
      'destructive-unconfirmed-advisory',
      'destructive-actions-confirmed',
    );
    expect(outcome.status).toBe('advisory');
    expect(outcome.findings[0]!.message).toContain('without correlated confirmation');
  });
});
