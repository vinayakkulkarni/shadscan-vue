import type { AuditRule } from '../../audit.js';
import { pascalToKebab } from '../../parse/sfc.js';
import type { Finding } from '../rule-result.js';
import {
  collectFormElements,
  hasAnyAttribute,
  hasFormSurface,
  inputType,
  isControlTag,
  isInsideTag,
  NON_LABELLED_INPUT_TYPES,
} from './forms-shared.js';

const ERROR_COMPONENT = /^(?:form-message|error-message|field-error)$/u;
const isFormControlWrapper = (tag: string): boolean => pascalToKebab(tag) === 'form-control';

export const invalidFieldsAssociatedWithErrors: AuditRule = {
  id: 'invalid-fields-associated-with-errors',
  title: 'Invalid fields point at their error message',
  description:
    'A visible error message that is not linked to its control never reaches screen reader users, who hear only that the field is required after submission fails.',
  category: 'forms',
  severity: 'error',
  confidence: 'medium',
  maxScore: 3,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const elements = collectFormElements(files);
    if (!hasFormSurface(elements)) {
      return result.notApplicable();
    }

    const filesWithErrors = new Set(
      elements
        .filter(({ element }) => ERROR_COMPONENT.test(pascalToKebab(element.tag)))
        .map(({ file }) => file.relPath),
    );
    if (filesWithErrors.size === 0) {
      return result.notApplicable();
    }

    const findings: Finding[] = [];
    for (const { file, element, ancestors, line } of elements) {
      if (!isControlTag(element.tag) || !filesWithErrors.has(file.relPath)) {
        continue;
      }
      const type = inputType(element);
      if (type !== undefined && NON_LABELLED_INPUT_TYPES.has(type)) {
        continue;
      }
      if (isInsideTag(ancestors, isFormControlWrapper)) {
        continue;
      }
      const describes = hasAnyAttribute(element, ['aria-describedby', 'aria-errormessage']);
      const invalid = hasAnyAttribute(element, ['aria-invalid']);
      if (describes && invalid) {
        continue;
      }
      const missing: string[] = [];
      if (!invalid) {
        missing.push('aria-invalid');
      }
      if (!describes) {
        missing.push('aria-describedby');
      }
      findings.push({
        message: `<${element.tag}> renders an error nearby but is missing ${missing.join(' and ')}.`,
        evidence: [{ path: file.relPath, line }],
        remediation:
          'Wrap the control in <FormControl>, or bind aria-invalid and aria-describedby to the error element id.',
      });
    }

    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
