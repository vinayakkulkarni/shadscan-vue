import type { AuditRule } from '../../audit.js';
import { elementLine, findAttribute, pascalToKebab } from '../../parse/sfc.js';
import type { Finding } from '../rule-result.js';
import { forEachElement } from './polish-shared.js';

const ICON_TAG = /(?:^|-)icon$/u;
const isIconTag = (tag: string): boolean => {
  const normalized = pascalToKebab(tag);
  return ICON_TAG.test(normalized) || normalized === 'svg';
};

const BUTTON_TAGS = new Set(['button', 'Button', 'a', 'NuxtLink', 'RouterLink', 'router-link']);

export const buttonIconsHaveDataIcon: AuditRule = {
  id: 'button-icons-have-data-icon',
  title: 'Icons inside controls are marked decorative',
  description:
    'Icons rendered inside a labelled control should be hidden from assistive technology so screen readers announce the label once instead of reading icon markup.',
  category: 'production-polish',
  severity: 'info',
  confidence: 'medium',
  maxScore: 2,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const findings: Finding[] = [];
    let evaluated = 0;

    forEachElement(files, (element, file, ancestors) => {
      if (!isIconTag(element.tag)) {
        return;
      }
      const insideControl = ancestors.some((ancestor) => BUTTON_TAGS.has(ancestor.tag));
      if (!insideControl) {
        return;
      }
      evaluated += 1;
      const ariaHidden = findAttribute(element, 'aria-hidden');
      const role = findAttribute(element, 'role');
      const hidden =
        (ariaHidden !== undefined && ariaHidden.static !== 'false') ||
        role?.static === 'presentation' ||
        role?.static === 'none';
      if (!hidden) {
        findings.push({
          message: `<${element.tag}> inside a control is exposed to assistive technology.`,
          evidence: [{ path: file.relPath, line: elementLine(element) }],
          remediation:
            'Add aria-hidden="true" to decorative icons inside labelled controls so the label is announced once.',
        });
      }
    });

    if (evaluated === 0) {
      return result.notApplicable();
    }
    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
