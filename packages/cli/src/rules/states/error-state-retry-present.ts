import type { AuditRule } from '../../audit.js';
import type { ParsedFile } from '../../parse/project-files.js';
import { collectTemplateElements, directiveNamed, isNuxtErrorFile } from './states-shared.js';

const RECOVERY_HANDLER = /(?:clearError|handleError|reload|navigateTo|\$router|router\.)/u;
const LINK_TAGS = new Set(['NuxtLink', 'nuxt-link', 'RouterLink', 'router-link', 'a']);

const isErrorSurface = (file: ParsedFile): boolean =>
  isNuxtErrorFile(file.relPath) || /error/iu.test(file.relPath.split('/').pop() ?? '');

export const errorStateRetryPresent: AuditRule = {
  id: 'error-state-retry-present',
  title: 'Error states offer a way forward',
  description:
    'An error surface that only reports failure strands the user. It needs a wired retry, reload, or navigation control.',
  category: 'states',
  severity: 'error',
  confidence: 'high',
  maxScore: 4,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const errorFiles = files.filter(
      (file) => file.kind === 'vue' && file.sfc?.templateAst !== undefined && isErrorSurface(file),
    );
    if (errorFiles.length === 0) {
      return result.notApplicable();
    }

    const elements = collectTemplateElements(errorFiles);
    const findings = [];

    for (const file of errorFiles) {
      const fileElements = elements.filter((entry) => entry.file.relPath === file.relPath);
      const hasWiredControl = fileElements.some(({ element }) => {
        if (LINK_TAGS.has(element.tag)) {
          return true;
        }
        const click = directiveNamed(element, 'on');
        if (click === undefined) {
          return false;
        }
        return element.props.some(
          (prop) =>
            prop.type === 7 &&
            prop.name === 'on' &&
            prop.exp !== undefined &&
            'content' in prop.exp &&
            RECOVERY_HANDLER.test(String(prop.exp.content)),
        );
      });
      if (!hasWiredControl) {
        findings.push({
          message: 'Error UI has no wired retry control.',
          evidence: [{ path: file.relPath }],
          remediation:
            'Add a control that calls clearError, reloads the route, or navigates somewhere safe.',
        });
      }
    }

    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
