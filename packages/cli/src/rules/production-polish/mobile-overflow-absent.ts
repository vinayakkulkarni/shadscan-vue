import type { AuditRule } from '../../audit.js';
import { elementLine, findAttribute } from '../../parse/sfc.js';
import type { Finding } from '../rule-result.js';
import { forEachElement, staticClassList } from './polish-shared.js';

const FIXED_WIDTH_CLASS = /^w-\[(\d+)px\]$/u;
const MIN_WIDTH_CLASS = /^min-w-\[(\d+)px\]$/u;
const RESPONSIVE_PREFIX = /^(?:sm|md|lg|xl|2xl|max-sm|max-md|max-lg):/u;
const INLINE_FIXED_WIDTH = /(?:^|;)\s*(?:min-)?width\s*:\s*(\d+)px/u;

const MOBILE_VIEWPORT_PX = 360;

export const mobileOverflowAbsent: AuditRule = {
  id: 'mobile-overflow-absent',
  title: 'No fixed widths overflow small viewports',
  description:
    'Fixed pixel widths wider than a small phone viewport cause horizontal scrolling. Responsive-prefixed utilities are exempt because they only apply above a breakpoint.',
  category: 'production-polish',
  severity: 'warning',
  confidence: 'medium',
  maxScore: 3,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const findings: Finding[] = [];

    forEachElement(files, (element, file) => {
      for (const token of staticClassList(element)) {
        if (RESPONSIVE_PREFIX.test(token)) {
          continue;
        }
        const fixed = FIXED_WIDTH_CLASS.exec(token) ?? MIN_WIDTH_CLASS.exec(token);
        if (fixed !== null && Number(fixed[1]) > MOBILE_VIEWPORT_PX) {
          findings.push({
            message: `<${element.tag}> uses a fixed width of ${fixed[1]}px, which overflows a ${MOBILE_VIEWPORT_PX}px viewport.`,
            evidence: [{ path: file.relPath, line: elementLine(element) }],
            remediation:
              'Use a fluid width (w-full, max-w-*) or scope the fixed width behind a breakpoint prefix.',
          });
        }
      }

      const style = findAttribute(element, 'style');
      if (style?.static !== undefined) {
        const inline = INLINE_FIXED_WIDTH.exec(style.static);
        if (inline !== null && Number(inline[1]) > MOBILE_VIEWPORT_PX) {
          findings.push({
            message: `<${element.tag}> sets an inline width of ${inline[1]}px, which overflows a ${MOBILE_VIEWPORT_PX}px viewport.`,
            evidence: [{ path: file.relPath, line: elementLine(element) }],
            remediation: 'Replace the inline fixed width with a fluid or breakpoint-scoped width.',
          });
        }
      }
    });

    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
