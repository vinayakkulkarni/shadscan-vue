import type { ElementNode } from '@vue/compiler-dom';
import type { AuditRule } from '../../audit.js';
import { pascalToKebab } from '../../parse/sfc.js';
import type { Finding } from '../rule-result.js';
import {
  attributeValue,
  collectFormElements,
  hasAnyAttribute,
  hasFormSurface,
  inputType,
  isControlTag,
  isFormFieldWrapper,
  isInsideTag,
  NON_LABELLED_INPUT_TYPES,
} from './forms-shared.js';

const isLabelTag = (tag: string): boolean => {
  const normalized = pascalToKebab(tag);
  return normalized === 'label' || normalized === 'form-label';
};

export const formsHaveLabels: AuditRule = {
  id: 'forms-have-labels',
  title: 'Form controls have labels',
  description:
    'Every data-entry control needs a programmatic label. Placeholder text is not a label and disappears the moment a user starts typing.',
  category: 'forms',
  severity: 'error',
  confidence: 'high',
  maxScore: 4,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const elements = collectFormElements(files);
    if (!hasFormSurface(elements)) {
      return result.notApplicable();
    }

    const labelTargets = new Map<string, Set<string>>();
    for (const { file, element } of elements) {
      if (!isLabelTag(element.tag)) {
        continue;
      }
      const target = attributeValue(element, 'for');
      if (target !== undefined && target.length > 0) {
        const existing = labelTargets.get(file.relPath) ?? new Set<string>();
        existing.add(target);
        labelTargets.set(file.relPath, existing);
      }
    }

    const findings: Finding[] = [];
    for (const { file, element, ancestors, line } of elements) {
      if (!isControlTag(element.tag)) {
        continue;
      }
      const type = inputType(element);
      if (type !== undefined && NON_LABELLED_INPUT_TYPES.has(type)) {
        continue;
      }
      if (hasAnyAttribute(element, ['aria-label', 'aria-labelledby'])) {
        continue;
      }
      const id = attributeValue(element, 'id');
      if (id !== undefined && (labelTargets.get(file.relPath)?.has(id) ?? false)) {
        continue;
      }
      if (isInsideTag(ancestors, isLabelTag)) {
        continue;
      }
      if (isInsideTag(ancestors, isFormFieldWrapper) && hasSiblingFormLabel(ancestors)) {
        continue;
      }
      findings.push({
        message: `<${element.tag}> has no associated label.`,
        evidence: [{ path: file.relPath, line }],
        remediation:
          'Associate a <Label for="id"> with the control, wrap it in a label, or add an aria-label.',
      });
    }

    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};

const hasSiblingFormLabel = (ancestors: readonly ElementNode[]): boolean => {
  const wrapper = [...ancestors].reverse().find((ancestor) => isFormFieldWrapper(ancestor.tag));
  if (wrapper === undefined) {
    return false;
  }
  const scan = (node: ElementNode): boolean =>
    node.children.some((child) => {
      if (child.type !== 1) {
        return false;
      }
      return isLabelTag(child.tag) || scan(child);
    });
  return scan(wrapper);
};
