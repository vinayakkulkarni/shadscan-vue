import type { AuditRule } from '../../audit.js';
import { elementLine } from '../../parse/sfc.js';
import type { Finding } from '../rule-result.js';
import { forEachElement, staticClassList } from './polish-shared.js';

const INTERACTIVE_TAGS = new Set(['button', 'a', 'input', 'select', 'textarea', 'summary']);
const SIZE_CLASS = /^(?:size|h|w)-(\d+)$/u;
const REM_STEP_PX = 4;
const MIN_TARGET_PX = 24;

export const pointerTargetSizePasses: AuditRule = {
  id: 'pointer-target-size-passes',
  title: 'Pointer targets meet a minimum size',
  description:
    'Interactive controls sized below the WCAG 2.2 minimum target area are hard to hit on touch devices. Only statically-sized controls are evaluated.',
  category: 'production-polish',
  severity: 'warning',
  confidence: 'medium',
  maxScore: 2,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const findings: Finding[] = [];
    let evaluated = 0;

    forEachElement(files, (element, file) => {
      if (!INTERACTIVE_TAGS.has(element.tag)) {
        return;
      }
      const tokens = staticClassList(element);
      let smallest: number | undefined;
      for (const token of tokens) {
        const match = SIZE_CLASS.exec(token);
        if (match === null) {
          continue;
        }
        const px = Number(match[1]) * REM_STEP_PX;
        smallest = smallest === undefined ? px : Math.min(smallest, px);
      }
      if (smallest === undefined) {
        return;
      }
      evaluated += 1;
      if (smallest < MIN_TARGET_PX) {
        findings.push({
          message: `<${element.tag}> renders a ${smallest}px pointer target, below the ${MIN_TARGET_PX}px minimum.`,
          evidence: [{ path: file.relPath, line: elementLine(element) }],
          remediation:
            'Increase the control size, or add padding so the interactive area reaches at least 24 by 24 CSS pixels.',
        });
      }
    });

    if (evaluated === 0) {
      return result.notApplicable();
    }
    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
