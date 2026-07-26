import type { AuditRule } from '../../audit.js';
import { elementLine, walkTemplate } from '../../parse/sfc.js';
import { isGeneratedUiPrimitive } from '../generated-ui.js';
import type { Finding } from '../rule-result.js';

/**
 * `hidden md:block` shows an element from the md breakpoint up. A sibling that
 * is `md:hidden` covers the smaller range. When only one half of the pair
 * exists on a surface, one viewport range renders nothing at all.
 */
const HIDE_AT_BREAKPOINT = /\b(?:sm|md|lg|xl|2xl):hidden\b/u;
const SHOW_FROM_BREAKPOINT = /\bhidden\b[^"']*\b(?:sm|md|lg|xl|2xl):(?:block|flex|grid|inline)/u;

const classOf = (element: { props: readonly unknown[] }): string => {
  const values: string[] = [];
  for (const prop of element.props) {
    const candidate = prop as { name?: string; value?: { content?: string } };
    if (candidate.name === 'class' && typeof candidate.value?.content === 'string') {
      values.push(candidate.value.content);
    }
  }
  return values.join(' ');
};

export const responsiveVisibility: AuditRule = {
  id: 'responsive-visibility',
  title: 'Responsive show and hide pairs cover every viewport',
  description:
    'A surface that hides an element at a breakpoint should present the alternative at the complementary range, otherwise one viewport shows nothing where content is expected.',
  category: 'production-polish',
  severity: 'warning',
  confidence: 'low',
  maxScore: 0,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const findings: Finding[] = [];
    let evaluated = 0;

    for (const file of files) {
      if (file.sfc?.templateAst === undefined || isGeneratedUiPrimitive(file.relPath)) {
        continue;
      }

      let hides = 0;
      let shows = 0;
      let firstHideLine: number | undefined;

      walkTemplate(file.sfc.templateAst, (element) => {
        const classes = classOf(element);
        if (classes === '') {
          return;
        }
        if (SHOW_FROM_BREAKPOINT.test(classes)) {
          shows += 1;
          return;
        }
        if (HIDE_AT_BREAKPOINT.test(classes)) {
          hides += 1;
          firstHideLine ??= elementLine(element);
        }
      });

      if (hides === 0 && shows === 0) {
        continue;
      }
      evaluated += 1;

      if (hides > 0 && shows === 0) {
        findings.push({
          message:
            'This surface hides content at a breakpoint without a counterpart shown at the complementary range.',
          evidence: [{ path: file.relPath, line: firstHideLine ?? 1 }],
          remediation:
            'Pair each breakpoint-hidden element with the alternative for the other range (for example `md:hidden` beside `hidden md:block`), or confirm the omission is deliberate.',
        });
      }
    }

    if (evaluated === 0) {
      return result.notApplicable();
    }
    return findings.length > 0 ? result.advisory(findings) : result.pass();
  },
};
