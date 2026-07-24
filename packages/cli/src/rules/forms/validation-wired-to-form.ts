import { NodeTypes } from '@vue/compiler-dom';
import type { AuditRule } from '../../audit.js';
import { pascalToKebab } from '../../parse/sfc.js';
import type { Finding } from '../rule-result.js';
import { collectFormElements, hasFormSurface, usesValidationLibrary } from './forms-shared.js';

const WIRED_SUBMIT = /(?:handleSubmit|onSubmit\s*\(|form\.handleSubmit)/u;
const USE_FORM = /useForm\s*\(|useField\s*\(/u;

export const validationWiredToForm: AuditRule = {
  id: 'validation-wired-to-form',
  title: 'Forms are wired to their validation library',
  description:
    'An installed validation library that no form is connected to provides no protection: submissions bypass the schema entirely.',
  category: 'forms',
  severity: 'warning',
  confidence: 'medium',
  maxScore: 2,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ discovery, sources, result }) => {
    const files = await sources();
    const elements = collectFormElements(files);
    if (!usesValidationLibrary(discovery.dependencies) || !hasFormSurface(elements)) {
      return result.notApplicable();
    }

    const findings: Finding[] = [];
    const formsByFile = new Map<string, number>();
    for (const { file, element, line } of elements) {
      if (element.tag !== 'form' && pascalToKebab(element.tag) !== 'form') {
        continue;
      }
      formsByFile.set(file.relPath, line);
    }

    for (const [relPath, line] of formsByFile) {
      const file = files.find((candidate) => candidate.relPath === relPath);
      if (file === undefined) {
        continue;
      }
      if (USE_FORM.test(file.text) || WIRED_SUBMIT.test(file.text)) {
        continue;
      }
      const usesSlotProps = elements.some(
        ({ file: elementFile, element }) =>
          elementFile.relPath === relPath &&
          element.props.some((prop) => prop.type === NodeTypes.DIRECTIVE && prop.name === 'slot'),
      );
      if (usesSlotProps) {
        continue;
      }
      findings.push({
        message: 'A validation library is installed but this form is not wired to it.',
        evidence: [{ path: relPath, line }],
        remediation:
          'Submit through handleSubmit from useForm (or the library equivalent) so the schema runs before the request.',
      });
    }

    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
