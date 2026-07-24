import type { AuditRule } from '../../audit.js';
import { elementLine, findAttribute } from '../../parse/sfc.js';
import type { Finding } from '../rule-result.js';
import { forEachElement, hasAriaName } from './a11y-shared.js';

export const navLandmarksHaveNames: AuditRule = {
  id: 'nav-landmarks-have-names',
  title: 'Multiple navigation landmarks are distinguishable',
  description:
    'When an app exposes more than one navigation landmark, each needs its own name so screen reader users can tell primary navigation from secondary.',
  category: 'accessibility',
  severity: 'warning',
  confidence: 'high',
  maxScore: 2,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const unnamed: Finding[] = [];
    let navCount = 0;

    forEachElement(files, (element, file) => {
      const isNav =
        element.tag === 'nav' || findAttribute(element, 'role')?.static === 'navigation';
      if (!isNav) {
        return;
      }
      navCount += 1;
      if (!hasAriaName(element)) {
        unnamed.push({
          message: 'Navigation landmark has no accessible name.',
          evidence: [{ path: file.relPath, line: elementLine(element) }],
          remediation:
            'Give each navigation landmark an aria-label such as "Primary" or "Footer" so they can be told apart.',
        });
      }
    });

    if (navCount < 2 || unnamed.length === 0) {
      return result.pass();
    }
    return result.fail(unnamed);
  },
};
