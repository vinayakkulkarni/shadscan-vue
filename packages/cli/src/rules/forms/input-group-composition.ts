import type { ElementNode } from '@vue/compiler-dom';
import type { AuditRule } from '../../audit.js';
import { elementLine, pascalToKebab, walkTemplate } from '../../parse/sfc.js';
import { isGeneratedUiPrimitive } from '../generated-ui.js';
import type { Finding } from '../rule-result.js';

const INPUT_GROUP_TAG = 'input-group';
const GROUP_PARTS = new Set(['input-group-input', 'input-group-textarea', 'input-group-addon']);
const RAW_CONTROLS = new Set(['input', 'textarea']);

export const inputGroupComposition: AuditRule = {
  id: 'input-group-composition',
  title: 'InputGroup uses its own parts',
  description:
    'An InputGroup wired with a raw input or textarea loses the padding, focus ring, and addon alignment its own parts provide, so the group renders correctly only by accident.',
  category: 'forms',
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

      const groups = new Map<
        ElementNode,
        { line: number; rawControl?: string; usesParts: boolean }
      >();

      walkTemplate(file.sfc.templateAst, (element, ancestors) => {
        const tag = pascalToKebab(element.tag);
        if (tag === INPUT_GROUP_TAG) {
          groups.set(element, { line: elementLine(element), usesParts: false });
          return;
        }

        const owner = ancestors.find((ancestor) => pascalToKebab(ancestor.tag) === INPUT_GROUP_TAG);
        if (owner === undefined) {
          return;
        }
        const entry = groups.get(owner);
        if (entry === undefined) {
          return;
        }
        if (GROUP_PARTS.has(tag)) {
          entry.usesParts = true;
          return;
        }
        if (RAW_CONTROLS.has(tag)) {
          entry.rawControl ??= tag;
        }
      });

      instances += groups.size;

      for (const entry of groups.values()) {
        if (entry.rawControl !== undefined && !entry.usesParts) {
          findings.push({
            message: `<InputGroup> wraps a raw <${entry.rawControl}> instead of its own part.`,
            evidence: [{ path: file.relPath, line: entry.line }],
            remediation:
              'Use InputGroupInput or InputGroupTextarea inside InputGroup, with InputGroupAddon for leading and trailing content.',
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
