import type { AuditRule } from '../../audit.js';
import { elementLine } from '../../parse/sfc.js';
import type { Finding } from '../rule-result.js';
import { forEachElement, hasAriaName } from './a11y-shared.js';

export const iframesHaveTitle: AuditRule = {
  id: 'iframes-have-title',
  title: 'Embedded frames are titled',
  description:
    'An iframe without a title is announced only as "frame", giving no indication of what it contains before a user enters it.',
  category: 'accessibility',
  severity: 'error',
  confidence: 'high',
  maxScore: 2,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const findings: Finding[] = [];

    forEachElement(files, (element, file) => {
      if (element.tag !== 'iframe') {
        return;
      }
      if (hasAriaName(element)) {
        return;
      }
      findings.push({
        message: '<iframe> has no title describing its content.',
        evidence: [{ path: file.relPath, line: elementLine(element) }],
        remediation: 'Add a title attribute describing what the frame contains.',
      });
    });

    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
