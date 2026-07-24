import type { AuditRule } from '../../audit.js';
import { elementLine, findAttribute } from '../../parse/sfc.js';
import type { Finding } from '../rule-result.js';
import {
  BUTTON_TAGS,
  elementChildren,
  forEachElement,
  hasAriaName,
  hasScreenReaderText,
  isIconTag,
  visibleText,
} from './a11y-shared.js';

export const iconButtonsHaveLabels: AuditRule = {
  id: 'icon-buttons-have-labels',
  title: 'Icon-only buttons have accessible names',
  description:
    'A button whose entire content is an icon has no accessible name unless one is supplied explicitly, leaving screen reader users with an unlabelled control.',
  category: 'accessibility',
  severity: 'error',
  confidence: 'high',
  maxScore: 4,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const findings: Finding[] = [];

    forEachElement(files, (element, file) => {
      if (!BUTTON_TAGS.has(element.tag)) {
        return;
      }
      const children = elementChildren(element);
      const iconOnly =
        (children.length > 0 && children.every((child) => isIconTag(child.tag))) ||
        findAttribute(element, 'size')?.static === 'icon';
      if (!iconOnly) {
        return;
      }
      if (visibleText(element).length > 0) {
        return;
      }
      if (hasAriaName(element) || hasScreenReaderText(element)) {
        return;
      }
      findings.push({
        message: `Icon-only <${element.tag}> has no accessible name.`,
        evidence: [{ path: file.relPath, line: elementLine(element) }],
        remediation:
          'Add aria-label describing the action, or include visually hidden text inside the control.',
      });
    });

    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
