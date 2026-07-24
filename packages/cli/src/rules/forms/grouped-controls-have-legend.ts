import type { ElementNode } from '@vue/compiler-dom';
import type { AuditRule } from '../../audit.js';
import { pascalToKebab } from '../../parse/sfc.js';
import type { Finding } from '../rule-result.js';
import {
  attributeValue,
  collectFormElements,
  elementText,
  hasAnyAttribute,
  inputType,
  isInsideTag,
} from './forms-shared.js';

const containsLegend = (element: ElementNode): boolean =>
  element.children.some((child) => {
    if (child.type !== 1) {
      return false;
    }
    if (child.tag === 'legend') {
      return elementText(child).length > 0;
    }
    return containsLegend(child);
  });

export const groupedControlsHaveLegend: AuditRule = {
  id: 'grouped-controls-have-legend',
  title: 'Grouped controls declare a group label',
  description:
    'Radio groups and fieldsets need a group-level name, otherwise each option is announced without the question it answers.',
  category: 'forms',
  severity: 'warning',
  confidence: 'medium',
  maxScore: 2,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const elements = collectFormElements(files);

    const fieldsets = elements.filter(({ element }) => element.tag === 'fieldset');
    const radios = elements.filter(
      ({ element }) => element.tag === 'input' && inputType(element) === 'radio',
    );
    const radioGroups = elements.filter(
      ({ element }) => pascalToKebab(element.tag) === 'radio-group',
    );

    if (fieldsets.length === 0 && radios.length === 0 && radioGroups.length === 0) {
      return result.notApplicable();
    }

    const findings: Finding[] = [];
    for (const { file, element, line } of fieldsets) {
      if (!containsLegend(element)) {
        findings.push({
          message: '<fieldset> has no legend naming the group.',
          evidence: [{ path: file.relPath, line }],
          remediation: 'Add a <legend> describing what the grouped controls decide.',
        });
      }
    }

    for (const { file, element, ancestors, line } of radioGroups) {
      const named =
        hasAnyAttribute(element, ['aria-label', 'aria-labelledby']) ||
        attributeValue(element, 'role') === 'radiogroup';
      if (!named && !isInsideTag(ancestors, (tag) => tag === 'fieldset')) {
        findings.push({
          message: 'Radio group has no accessible group name.',
          evidence: [{ path: file.relPath, line }],
          remediation:
            'Wrap the group in a fieldset with a legend, or add an aria-label to the radio group.',
        });
      }
    }

    const ungroupedRadios = radios.filter(
      ({ ancestors }) =>
        !isInsideTag(ancestors, (tag) => tag === 'fieldset') &&
        !isInsideTag(ancestors, (tag) => pascalToKebab(tag) === 'radio-group'),
    );
    if (ungroupedRadios.length >= 2) {
      findings.push({
        message: 'Radio inputs are not wrapped in a named group.',
        evidence: ungroupedRadios
          .slice(0, 3)
          .map(({ file, line }) => ({ path: file.relPath, line })),
        remediation: 'Group related radios in a fieldset with a legend, or a labelled radiogroup.',
      });
    }

    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
