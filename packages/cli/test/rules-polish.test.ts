import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { discoverProject, runAudit, type AuditRule } from '../src/index.js';
import { animationsRespectReducedMotion } from '../src/rules/production-polish/animations-respect-reduced-motion.js';
import { buttonIconsHaveDataIcon } from '../src/rules/production-polish/button-icons-have-data-icon.js';
import { metadataTitleDescriptionComplete } from '../src/rules/production-polish/metadata-title-description-complete.js';
import { mobileOverflowAbsent } from '../src/rules/production-polish/mobile-overflow-absent.js';
import { noStarterCopy } from '../src/rules/production-polish/no-starter-copy.js';
import { pointerTargetSizePasses } from '../src/rules/production-polish/pointer-target-size-passes.js';
import { publicAppSeoFilesPresent } from '../src/rules/production-polish/public-app-seo-files-present.js';
import { responsiveShellPresent } from '../src/rules/production-polish/responsive-shell-present.js';
import { socialPreviewPresent } from '../src/rules/production-polish/social-preview-present.js';

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'fixtures',
  'rules',
  'polish',
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

describe('no-starter-copy', () => {
  it('fails on leftover scaffold copy with evidence', async () => {
    const outcome = await outcomeOf('starter-fail', noStarterCopy);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.evidence[0]!.path).toBe('src/App.vue');
    expect(outcome.findings[0]!.message).toContain('Vite + Vue');
  });

  it('passes on real product copy', async () => {
    expect((await outcomeOf('starter-pass', noStarterCopy)).status).toBe('pass');
  });
});

describe('public-app-seo-files-present', () => {
  it('fails when robots and sitemap are absent', async () => {
    const outcome = await outcomeOf('seo-fail', publicAppSeoFilesPresent);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings).toHaveLength(2);
  });

  it('passes when both static files exist', async () => {
    expect((await outcomeOf('seo-pass', publicAppSeoFilesPresent)).status).toBe('pass');
  });
});

describe('social-preview-present', () => {
  it('fails when only a title is declared', async () => {
    const outcome = await outcomeOf('social-fail', socialPreviewPresent);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.message).toContain('preview image');
  });

  it('passes with og title and image', async () => {
    expect((await outcomeOf('social-pass', socialPreviewPresent)).status).toBe('pass');
  });
});

describe('metadata-title-description-complete', () => {
  it('fails when a page declares no metadata', async () => {
    const outcome = await outcomeOf('pagemeta-fail', metadataTitleDescriptionComplete);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.evidence[0]!.path).toBe('pages/index.vue');
  });

  it('fails when description is missing', async () => {
    const outcome = await outcomeOf('pagemeta-partial', metadataTitleDescriptionComplete);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.message).toContain('description');
  });

  it('passes when title and description are declared', async () => {
    expect((await outcomeOf('pagemeta-pass', metadataTitleDescriptionComplete)).status).toBe(
      'pass',
    );
  });

  it('is not applicable without routable pages', async () => {
    expect((await outcomeOf('starter-pass', metadataTitleDescriptionComplete)).status).toBe(
      'not-applicable',
    );
  });
});

describe('responsive-shell-present', () => {
  it('fails on a shell with no breakpoint behavior', async () => {
    expect((await outcomeOf('responsive-fail', responsiveShellPresent)).status).toBe('fail');
  });

  it('passes when the shell adapts across breakpoints', async () => {
    expect((await outcomeOf('responsive-pass', responsiveShellPresent)).status).toBe('pass');
  });
});

describe('mobile-overflow-absent', () => {
  it('fails on fixed widths wider than a phone viewport', async () => {
    const outcome = await outcomeOf('overflow-fail', mobileOverflowAbsent);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings).toHaveLength(2);
    expect(outcome.findings[0]!.evidence[0]!.line).toBe(2);
  });

  it('passes when fixed widths are breakpoint-scoped', async () => {
    expect((await outcomeOf('overflow-pass', mobileOverflowAbsent)).status).toBe('pass');
  });
});

describe('animations-respect-reduced-motion', () => {
  it('fails on unguarded continuous animation', async () => {
    const outcome = await outcomeOf('motion-fail', animationsRespectReducedMotion);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.message).toContain('animate-spin');
  });

  it('passes when guarded by motion-safe', async () => {
    expect((await outcomeOf('motion-pass', animationsRespectReducedMotion)).status).toBe('pass');
  });

  it('is not applicable without animation', async () => {
    expect((await outcomeOf('motion-na', animationsRespectReducedMotion)).status).toBe(
      'not-applicable',
    );
  });
});

describe('pointer-target-size-passes', () => {
  it('fails on undersized controls', async () => {
    const outcome = await outcomeOf('target-fail', pointerTargetSizePasses);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.message).toContain('16px');
  });

  it('passes on adequately sized controls', async () => {
    expect((await outcomeOf('target-pass', pointerTargetSizePasses)).status).toBe('pass');
  });

  it('is not applicable without statically sized controls', async () => {
    expect((await outcomeOf('starter-pass', pointerTargetSizePasses)).status).toBe(
      'not-applicable',
    );
  });
});

describe('button-icons-have-data-icon', () => {
  it('fails when a control icon is exposed to assistive technology', async () => {
    const outcome = await outcomeOf('dataicon-fail', buttonIconsHaveDataIcon);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.evidence[0]!.line).toBe(2);
  });

  it('passes when the icon is hidden', async () => {
    expect((await outcomeOf('dataicon-pass', buttonIconsHaveDataIcon)).status).toBe('pass');
  });
});
