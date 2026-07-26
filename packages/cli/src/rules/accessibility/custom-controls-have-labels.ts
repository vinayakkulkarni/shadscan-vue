import type { AuditRule } from '../../audit.js';
import { elementLine, findAttribute, pascalToKebab } from '../../parse/sfc.js';
import { isGeneratedUiPrimitive } from '../generated-ui.js';
import type { Finding } from '../rule-result.js';
import { forEachElement, hasAriaName } from './a11y-shared.js';

/**
 * Controls that render no intrinsic text, so a screen reader has nothing to
 * announce unless the author supplies a name. SelectTrigger is included rather
 * than Select because the trigger is the focusable control.
 */
const CUSTOM_CONTROL_TAGS = new Set([
  'checkbox',
  'combobox',
  'input-otp',
  'radio-group',
  'select-trigger',
  'slider',
  'switch',
  'toggle',
]);

const LABEL_TAGS = new Set(['label', 'form-label', 'field-label']);

const isCustomControl = (tag: string): boolean => CUSTOM_CONTROL_TAGS.has(pascalToKebab(tag));

export const customControlsHaveLabels: AuditRule = {
  id: 'custom-controls-have-labels',
  title: 'Custom controls have accessible labels',
  description:
    'Controls such as Checkbox, Switch, Slider, and SelectTrigger render no text of their own, so each needs a label, an aria-label, or an aria-labelledby reference.',
  category: 'accessibility',
  severity: 'error',
  confidence: 'medium',
  maxScore: 4,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();

    const labelTargets = new Map<string, Set<string>>();
    forEachElement(files, (element, file) => {
      if (!LABEL_TAGS.has(pascalToKebab(element.tag))) {
        return;
      }
      const target = findAttribute(element, 'for')?.static;
      if (target === undefined) {
        return;
      }
      const targets = labelTargets.get(file.relPath) ?? new Set<string>();
      targets.add(target);
      labelTargets.set(file.relPath, targets);
    });

    const findings: Finding[] = [];
    let evaluated = 0;

    forEachElement(files, (element, file, ancestors) => {
      if (!isCustomControl(element.tag) || isGeneratedUiPrimitive(file.relPath)) {
        return;
      }
      evaluated += 1;

      const id = findAttribute(element, 'id')?.static;
      const labelledByFor = id !== undefined && labelTargets.get(file.relPath)?.has(id) === true;
      const wrappedInLabel = ancestors.some((ancestor) =>
        LABEL_TAGS.has(pascalToKebab(ancestor.tag)),
      );

      if (labelledByFor || wrappedInLabel || hasAriaName(element)) {
        return;
      }

      findings.push({
        message: `<${element.tag}> has no accessible name.`,
        evidence: [{ path: file.relPath, line: elementLine(element) }],
        remediation:
          'Associate a <Label for="…"> with the control id, wrap the control in a label, or add aria-label / aria-labelledby.',
      });
    });

    if (evaluated === 0) {
      return result.notApplicable();
    }
    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
