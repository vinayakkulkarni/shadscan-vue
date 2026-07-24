import type { AuditRule } from '../../audit.js';
import { elementLine, findAttribute } from '../../parse/sfc.js';
import type { Finding } from '../rule-result.js';
import { forEachElement } from './a11y-shared.js';

export const noPositiveTabindex: AuditRule = {
  id: 'no-positive-tabindex',
  title: 'No positive tabindex values',
  description:
    'A positive tabindex pulls an element out of document order and forces every other focusable element behind it, which breaks keyboard navigation across the page.',
  category: 'accessibility',
  severity: 'error',
  confidence: 'high',
  maxScore: 2,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const findings: Finding[] = [];

    forEachElement(files, (element, file) => {
      const tabindex = findAttribute(element, 'tabindex');
      if (tabindex === undefined || tabindex.bound || tabindex.static === undefined) {
        return;
      }
      const value = Number(tabindex.static.trim());
      if (Number.isInteger(value) && value > 0) {
        findings.push({
          message: `<${element.tag}> uses tabindex="${value}", which overrides natural focus order.`,
          evidence: [{ path: file.relPath, line: elementLine(element) }],
          remediation:
            'Use tabindex="0" to make an element focusable in document order, or reorder the markup instead.',
        });
      }
    });

    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
