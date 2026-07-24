import type { AuditRule } from '../../audit.js';
import type { Finding } from '../rule-result.js';
import {
  attributeValue,
  collectFormElements,
  hasAttribute,
  hasFormSurface,
  inputType,
  isControlTag,
  NON_LABELLED_INPUT_TYPES,
} from './forms-shared.js';

const PERSONAL_FIELD =
  /(?:email|e-mail|phone|tel|address|zip|postal|city|country|name|password|card|cc-)/iu;

export const personalDataAutocompletePresent: AuditRule = {
  id: 'personal-data-autocomplete-present',
  title: 'Personal-data fields declare autocomplete',
  description:
    'Autocomplete tokens let browsers and password managers fill known values, which removes the most error-prone typing in any form.',
  category: 'forms',
  severity: 'warning',
  confidence: 'medium',
  maxScore: 2,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const elements = collectFormElements(files);
    if (!hasFormSurface(elements)) {
      return result.notApplicable();
    }

    const findings: Finding[] = [];
    let candidates = 0;

    for (const { file, element, line } of elements) {
      if (!isControlTag(element.tag)) {
        continue;
      }
      const type = inputType(element);
      if (type !== undefined && NON_LABELLED_INPUT_TYPES.has(type)) {
        continue;
      }
      const descriptor = [
        attributeValue(element, 'id') ?? '',
        attributeValue(element, 'name') ?? '',
        attributeValue(element, 'placeholder') ?? '',
        type ?? '',
      ].join(' ');
      if (!PERSONAL_FIELD.test(descriptor)) {
        continue;
      }
      candidates += 1;
      if (!hasAttribute(element, 'autocomplete')) {
        findings.push({
          message: `<${element.tag}> collects personal data but declares no autocomplete token.`,
          evidence: [{ path: file.relPath, line }],
          remediation:
            'Add an autocomplete token such as email, tel, name, or current-password so browsers can fill the field.',
        });
      }
    }

    if (candidates === 0) {
      return result.notApplicable();
    }
    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
