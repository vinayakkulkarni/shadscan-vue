import type { AuditRule } from '../../audit.js';
import { elementLine } from '../../parse/sfc.js';
import type { Finding } from '../rule-result.js';
import { forEachElement, NATIVE_INTERACTIVE_TAGS } from './a11y-shared.js';

export const noNestedInteractiveControls: AuditRule = {
  id: 'no-nested-interactive-controls',
  title: 'Interactive controls are not nested',
  description:
    'Nesting a control inside another control produces invalid markup with undefined activation behavior and ambiguous announcements in assistive technology.',
  category: 'accessibility',
  severity: 'error',
  confidence: 'high',
  maxScore: 3,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const findings: Finding[] = [];

    forEachElement(files, (element, file, ancestors) => {
      if (!NATIVE_INTERACTIVE_TAGS.has(element.tag)) {
        return;
      }
      const interactiveAncestor = ancestors.find((ancestor) =>
        NATIVE_INTERACTIVE_TAGS.has(ancestor.tag),
      );
      if (interactiveAncestor === undefined) {
        return;
      }
      findings.push({
        message: `<${element.tag}> is nested inside <${interactiveAncestor.tag}>.`,
        evidence: [{ path: file.relPath, line: elementLine(element) }],
        remediation:
          'Move the inner control outside its interactive ancestor so each control has a single activation target.',
      });
    });

    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
