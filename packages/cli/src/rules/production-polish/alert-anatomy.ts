import type { ElementNode } from '@vue/compiler-dom';
import type { AuditRule } from '../../audit.js';
import { elementLine, pascalToKebab, walkTemplate } from '../../parse/sfc.js';
import { isGeneratedUiPrimitive } from '../generated-ui.js';
import type { Finding } from '../rule-result.js';

const ALERT_TAG = 'alert';
const ALERT_TITLE_TAG = 'alert-title';
const ALERT_DESCRIPTION_TAG = 'alert-description';
const ICON_TAG = /(?:^|-)icon$/u;

const isIcon = (tag: string): boolean => {
  const normalized = pascalToKebab(tag);
  return ICON_TAG.test(normalized) || normalized === 'svg';
};

export const alertAnatomy: AuditRule = {
  id: 'alert-anatomy',
  title: 'Alert matches its anatomy',
  description:
    'An Alert should carry an AlertTitle and at most one icon. A title-less alert announces as an unlabelled region, and a second icon competes with the first for meaning.',
  category: 'production-polish',
  severity: 'warning',
  confidence: 'medium',
  maxScore: 0,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const findings: Finding[] = [];
    let instances = 0;

    for (const file of files) {
      if (file.sfc?.templateAst === undefined || isGeneratedUiPrimitive(file.relPath)) {
        continue;
      }

      const alerts = new Map<ElementNode, { line: number; titles: number; icons: number }>();

      walkTemplate(file.sfc.templateAst, (element, ancestors) => {
        if (pascalToKebab(element.tag) === ALERT_TAG) {
          alerts.set(element, { line: elementLine(element), titles: 0, icons: 0 });
          return;
        }

        const owner = ancestors.find((ancestor) => pascalToKebab(ancestor.tag) === ALERT_TAG);
        if (owner === undefined) {
          return;
        }
        const entry = alerts.get(owner);
        if (entry === undefined) {
          return;
        }
        if (pascalToKebab(element.tag) === ALERT_TITLE_TAG) {
          entry.titles += 1;
        }
        if (isIcon(element.tag)) {
          entry.icons += 1;
        }
      });

      instances += alerts.size;

      for (const entry of alerts.values()) {
        const problems: string[] = [];
        if (entry.titles === 0) {
          problems.push('no AlertTitle');
        }
        if (entry.icons > 1) {
          problems.push(`${entry.icons} icons`);
        }
        if (problems.length > 0) {
          findings.push({
            message: `<Alert> has ${problems.join(' and ')}.`,
            evidence: [{ path: file.relPath, line: entry.line }],
            remediation: `Compose Alert from its parts: one AlertTitle, an optional ${ALERT_DESCRIPTION_TAG.replace('-', '')}, and at most one leading icon.`,
          });
        }
      }
    }

    if (instances === 0) {
      return result.notApplicable();
    }
    return findings.length > 0 ? result.advisory(findings) : result.pass();
  },
};
