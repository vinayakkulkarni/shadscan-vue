import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { discoverProject, runAudit, type AuditRule } from '../src/index.js';
import { fieldErrorsRendered } from '../src/rules/forms/field-errors-rendered.js';
import { formButtonsHaveExplicitType } from '../src/rules/forms/form-buttons-have-explicit-type.js';
import { formsHaveLabels } from '../src/rules/forms/forms-have-labels.js';
import { groupedControlsHaveLegend } from '../src/rules/forms/grouped-controls-have-legend.js';
import { invalidFieldsAssociatedWithErrors } from '../src/rules/forms/invalid-fields-associated-with-errors.js';
import { personalDataAutocompletePresent } from '../src/rules/forms/personal-data-autocomplete-present.js';
import { validationWiredToForm } from '../src/rules/forms/validation-wired-to-form.js';

const fixturesDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  'fixtures',
  'rules',
  'forms',
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

describe('forms-have-labels', () => {
  it('fails unlabelled controls and ignores hidden inputs', async () => {
    const outcome = await outcomeOf('labels-fail', formsHaveLabels);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings).toHaveLength(2);
    expect(outcome.findings[0]!.evidence[0]!.line).toBe(3);
  });

  it('passes label-for, wrapping label, and aria-label', async () => {
    expect((await outcomeOf('labels-pass', formsHaveLabels)).status).toBe('pass');
  });
});

describe('form-buttons-have-explicit-type', () => {
  it('fails a typeless button inside a form', async () => {
    const outcome = await outcomeOf('btntype-fail', formButtonsHaveExplicitType);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings).toHaveLength(1);
    expect(outcome.findings[0]!.evidence[0]!.line).toBe(4);
  });

  it('passes when every button declares a type', async () => {
    expect((await outcomeOf('btntype-pass', formButtonsHaveExplicitType)).status).toBe('pass');
  });
});

describe('field-errors-rendered', () => {
  it('fails when a validation library renders no messages', async () => {
    expect((await outcomeOf('errors-fail', fieldErrorsRendered)).status).toBe('fail');
  });

  it('passes when FormMessage is rendered', async () => {
    expect((await outcomeOf('errors-pass', fieldErrorsRendered)).status).toBe('pass');
  });

  it('is not applicable without a validation library', async () => {
    expect((await outcomeOf('errors-na', fieldErrorsRendered)).status).toBe('not-applicable');
  });
});

describe('invalid-fields-associated-with-errors', () => {
  it('fails a field with nearby errors but no aria wiring', async () => {
    const outcome = await outcomeOf('assoc-fail', invalidFieldsAssociatedWithErrors);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.message).toContain('aria-invalid');
  });

  it('passes when controls are wrapped in FormControl', async () => {
    expect((await outcomeOf('errors-pass', invalidFieldsAssociatedWithErrors)).status).toBe('pass');
  });

  it('is not applicable without rendered errors', async () => {
    expect((await outcomeOf('errors-na', invalidFieldsAssociatedWithErrors)).status).toBe(
      'not-applicable',
    );
  });
});

describe('grouped-controls-have-legend', () => {
  it('fails a fieldset with no legend', async () => {
    expect((await outcomeOf('legend-fail', groupedControlsHaveLegend)).status).toBe('fail');
  });

  it('passes a fieldset with a legend', async () => {
    expect((await outcomeOf('legend-pass', groupedControlsHaveLegend)).status).toBe('pass');
  });

  it('is not applicable without groups', async () => {
    expect((await outcomeOf('labels-pass', groupedControlsHaveLegend)).status).toBe(
      'not-applicable',
    );
  });
});

describe('personal-data-autocomplete-present', () => {
  it('fails personal-data fields with no autocomplete', async () => {
    const outcome = await outcomeOf('autocomplete-fail', personalDataAutocompletePresent);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings).toHaveLength(2);
  });

  it('passes when tokens are declared', async () => {
    expect((await outcomeOf('autocomplete-pass', personalDataAutocompletePresent)).status).toBe(
      'pass',
    );
  });
});

describe('validation-wired-to-form', () => {
  it('fails a bare submit handler when a validation library is installed', async () => {
    const outcome = await outcomeOf('wired-fail', validationWiredToForm);
    expect(outcome.status).toBe('fail');
    expect(outcome.findings[0]!.message).toContain('not wired');
  });

  it('passes when the form submits through handleSubmit', async () => {
    expect((await outcomeOf('errors-pass', validationWiredToForm)).status).toBe('pass');
  });

  it('is not applicable without a validation library', async () => {
    expect((await outcomeOf('errors-na', validationWiredToForm)).status).toBe('not-applicable');
  });
});
