import type { AuditRule } from '../../audit.js';
import { elementLine, findAttribute } from '../../parse/sfc.js';
import type { Finding } from '../rule-result.js';
import {
  elementChildren,
  forEachElement,
  hasAriaName,
  hasScreenReaderText,
  LINK_TAGS,
  projectsSlotContent,
  visibleText,
} from './a11y-shared.js';

const hasLabelledImage = (element: { children: unknown[] }): boolean => {
  const children = elementChildren(element as Parameters<typeof elementChildren>[0]);
  return children.some((child) => {
    if (child.tag !== 'img' && child.tag !== 'NuxtImg') {
      return hasLabelledImage(child);
    }
    const alt = findAttribute(child, 'alt');
    if (alt === undefined) {
      return false;
    }
    return alt.bound || (alt.static !== undefined && alt.static.trim().length > 0);
  });
};

export const linksHaveAccessibleNames: AuditRule = {
  id: 'links-have-accessible-names',
  title: 'Links have accessible names',
  description:
    'A link with no text, no label, and no described image is announced as an anonymous destination and cannot be understood out of context.',
  category: 'accessibility',
  severity: 'error',
  confidence: 'high',
  maxScore: 3,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const findings: Finding[] = [];

    forEachElement(files, (element, file) => {
      if (!LINK_TAGS.has(element.tag)) {
        return;
      }
      if (visibleText(element).length > 0) {
        return;
      }
      if (hasAriaName(element) || hasScreenReaderText(element)) {
        return;
      }
      if (hasLabelledImage(element) || projectsSlotContent(element)) {
        return;
      }
      findings.push({
        message: `<${element.tag}> has no accessible name.`,
        evidence: [{ path: file.relPath, line: elementLine(element) }],
        remediation:
          'Add link text, an aria-label, or an image with meaningful alternative text inside the link.',
      });
    });

    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
