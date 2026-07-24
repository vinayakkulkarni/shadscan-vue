import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { discoverProject, runAudit, type AuditRule } from '../src/index.js';
import { dialogsHaveAccessibleNames } from '../src/rules/accessibility/dialogs-have-accessible-names.js';
import { headingStructureSane } from '../src/rules/accessibility/heading-structure-sane.js';
import { iconButtonsHaveLabels } from '../src/rules/accessibility/icon-buttons-have-labels.js';
import { iframesHaveTitle } from '../src/rules/accessibility/iframes-have-title.js';
import { interactiveElementsAreSemantic } from '../src/rules/accessibility/interactive-elements-are-semantic.js';
import { linksHaveAccessibleNames } from '../src/rules/accessibility/links-have-accessible-names.js';
import { navLandmarksHaveNames } from '../src/rules/accessibility/nav-landmarks-have-names.js';
import { noNestedInteractiveControls } from '../src/rules/accessibility/no-nested-interactive-controls.js';
import { noPositiveTabindex } from '../src/rules/accessibility/no-positive-tabindex.js';

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'fixtures',
  'rules',
  'a11y',
);

const outcomeOf = async (fixture: string, rule: AuditRule) => {
  const discovery = await discoverProject(path.join(fixturesDir, fixture));
  const report = await runAudit(discovery, [rule]);
  const outcome = report.outcomes[0];
  if (outcome === undefined) {
    throw new Error(`Rule ${rule.id} did not run for fixture ${fixture}`);
  }
  return outcome;
};

describe('icon-buttons-have-labels', () => {
  it('fails unlabelled icon-only controls but not labelled text buttons', async () => {
    const outcome = await outcomeOf('iconbtn-fail', iconButtonsHaveLabels);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings).toHaveLength(2);
    expect(outcome.findings[0]!.evidence[0]!.line).toBe(3);
    expect(outcome.findings[1]!.evidence[0]!.line).toBe(4);
  });

  it('passes aria-label, bound label, and sr-only text', async () => {
    expect((await outcomeOf('iconbtn-pass', iconButtonsHaveLabels)).status).toBe('pass');
  });
});

describe('links-have-accessible-names', () => {
  it('fails icon-only and unlabelled-image links', async () => {
    const outcome = await outcomeOf('link-fail', linksHaveAccessibleNames);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings).toHaveLength(2);
  });

  it('passes text, aria-label, and described-image links', async () => {
    expect((await outcomeOf('link-pass', linksHaveAccessibleNames)).status).toBe('pass');
  });
});

describe('nav-landmarks-have-names', () => {
  it('fails when multiple navs are unnamed', async () => {
    const outcome = await outcomeOf('nav-fail', navLandmarksHaveNames);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings).toHaveLength(2);
  });

  it('passes when each nav is named', async () => {
    expect((await outcomeOf('nav-pass', navLandmarksHaveNames)).status).toBe('pass');
  });

  it('passes a single unnamed nav', async () => {
    expect((await outcomeOf('nav-single', navLandmarksHaveNames)).status).toBe('pass');
  });
});

describe('no-positive-tabindex', () => {
  it('fails a positive tabindex only', async () => {
    const outcome = await outcomeOf('tabindex-fail', noPositiveTabindex);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings).toHaveLength(1);
    expect(outcome.findings[0]!.message).toContain('tabindex="3"');
  });

  it('passes zero and negative values', async () => {
    expect((await outcomeOf('tabindex-pass', noPositiveTabindex)).status).toBe('pass');
  });
});

describe('iframes-have-title', () => {
  it('fails an untitled iframe', async () => {
    expect((await outcomeOf('iframe-fail', iframesHaveTitle)).status).toBe('fail');
  });

  it('passes a titled iframe', async () => {
    expect((await outcomeOf('iframe-pass', iframesHaveTitle)).status).toBe('pass');
  });
});

describe('interactive-elements-are-semantic', () => {
  it('fails clickable non-semantic elements and lists what is missing', async () => {
    const outcome = await outcomeOf('semantic-fail', interactiveElementsAreSemantic);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings).toHaveLength(2);
    expect(outcome.findings[0]!.message).toContain('an interactive role');
    expect(outcome.findings[1]!.message).toContain('a keyboard handler');
  });

  it('passes native controls and fully wired custom controls', async () => {
    expect((await outcomeOf('semantic-pass', interactiveElementsAreSemantic)).status).toBe('pass');
  });
});

describe('no-nested-interactive-controls', () => {
  it('fails a link nested inside a button', async () => {
    const outcome = await outcomeOf('nested-fail', noNestedInteractiveControls);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.message).toContain('nested inside <button>');
  });

  it('passes sibling controls', async () => {
    expect((await outcomeOf('nested-pass', noNestedInteractiveControls)).status).toBe('pass');
  });
});

describe('heading-structure-sane', () => {
  it('fails a page with no h1 and a skipped level', async () => {
    const outcome = await outcomeOf('heading-fail', headingStructureSane);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings).toHaveLength(2);
    expect(outcome.findings[1]!.message).toContain('h2 to h4');
  });

  it('passes a coherent outline', async () => {
    expect((await outcomeOf('heading-pass', headingStructureSane)).status).toBe('pass');
  });

  it('exempts components from the missing-h1 check', async () => {
    expect((await outcomeOf('heading-component', headingStructureSane)).status).toBe('pass');
  });
});

describe('dialogs-have-accessible-names', () => {
  it('fails a shadcn dialog with no title', async () => {
    const outcome = await outcomeOf('dialog-fail', dialogsHaveAccessibleNames);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.evidence[0]!.path).toBe('src/App.vue');
  });

  it('passes when a title component is rendered', async () => {
    expect((await outcomeOf('dialog-pass', dialogsHaveAccessibleNames)).status).toBe('pass');
  });

  it('audits raw reka-ui primitives', async () => {
    expect((await outcomeOf('dialog-reka', dialogsHaveAccessibleNames)).status).toBe('fail');
  });

  it('accepts aria-label as an accessible name', async () => {
    expect((await outcomeOf('dialog-arialabel', dialogsHaveAccessibleNames)).status).toBe('pass');
  });

  it('audits Nuxt auto-imported dialogs with no import statement', async () => {
    expect((await outcomeOf('dialog-nuxt-fail', dialogsHaveAccessibleNames)).status).toBe('fail');
  });

  it('is not applicable without dialogs', async () => {
    expect((await outcomeOf('dialog-na', dialogsHaveAccessibleNames)).status).toBe(
      'not-applicable',
    );
  });
});
