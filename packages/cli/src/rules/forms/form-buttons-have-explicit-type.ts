import type { AuditRule } from '../../audit.js';
import { pascalToKebab } from '../../parse/sfc.js';
import type { Finding } from '../rule-result.js';
import { attributeValue, collectFormElements, hasFormSurface } from './forms-shared.js';

const isButtonTag = (tag: string): boolean => {
  const normalized = pascalToKebab(tag);
  return normalized === 'button';
};

export const formButtonsHaveExplicitType: AuditRule = {
  id: 'form-buttons-have-explicit-type',
  title: 'Buttons inside forms declare a type',
  description:
    'A button inside a form defaults to type="submit". Any secondary action without an explicit type silently submits the form when clicked.',
  category: 'forms',
  severity: 'warning',
  confidence: 'high',
  maxScore: 3,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const elements = collectFormElements(files);
    if (!hasFormSurface(elements)) {
      return result.notApplicable();
    }

    const findings: Finding[] = [];
    for (const { file, element, ancestors, line } of elements) {
      if (!isButtonTag(element.tag)) {
        continue;
      }
      if (!ancestors.some((ancestor) => ancestor.tag === 'form')) {
        continue;
      }
      const type = attributeValue(element, 'type');
      if (type !== undefined && type.length > 0) {
        continue;
      }
      findings.push({
        message: `<${element.tag}> inside a form has no explicit type and defaults to submit.`,
        evidence: [{ path: file.relPath, line }],
        remediation:
          'Add type="submit" for the submitting control and type="button" for every other action.',
      });
    }

    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
