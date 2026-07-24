import type { AuditRule } from '../../audit.js';
import { pascalToKebab } from '../../parse/sfc.js';
import { collectFormElements, hasFormSurface, usesValidationLibrary } from './forms-shared.js';

const ERROR_COMPONENT = /^(?:form-message|error-message|field-error)$/u;
const ERROR_BINDING = /errors[.[]|errorMessage|fieldError/u;

export const fieldErrorsRendered: AuditRule = {
  id: 'field-errors-rendered',
  title: 'Validation errors reach the user',
  description:
    'A validation library that never renders its messages fails silently: the form refuses to submit and the user is given no reason why.',
  category: 'forms',
  severity: 'error',
  confidence: 'medium',
  maxScore: 4,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ discovery, sources, result }) => {
    const files = await sources();
    const elements = collectFormElements(files);
    if (!usesValidationLibrary(discovery.dependencies) || !hasFormSurface(elements)) {
      return result.notApplicable();
    }

    const rendersErrors =
      elements.some(({ element }) => ERROR_COMPONENT.test(pascalToKebab(element.tag))) ||
      files.some((file) => file.kind === 'vue' && ERROR_BINDING.test(file.text));

    if (rendersErrors) {
      return result.pass();
    }

    return result.fail([
      {
        message: 'A validation library is installed but no field errors are rendered.',
        evidence: elements
          .filter(({ element }) => element.tag === 'form')
          .slice(0, 3)
          .map(({ file, line }) => ({ path: file.relPath, line })),
        remediation:
          'Render <FormMessage> (or the equivalent error output) next to each field so validation failures are visible.',
      },
    ]);
  },
};
