import { NodeTypes } from '@vue/compiler-dom';
import type { AuditRule } from '../../audit.js';
import { elementLine, findAttribute } from '../../parse/sfc.js';
import type { Finding } from '../rule-result.js';
import { forEachElement, NON_INTERACTIVE_TAGS } from './a11y-shared.js';

const INTERACTIVE_ROLES = new Set([
  'button',
  'link',
  'tab',
  'menuitem',
  'checkbox',
  'switch',
  'option',
  'radio',
]);

const hasKeyboardHandler = (element: { props: readonly unknown[] }): boolean =>
  (element.props as { type: number; name?: string; arg?: { content?: string } }[]).some(
    (prop) =>
      prop.type === NodeTypes.DIRECTIVE &&
      prop.name === 'on' &&
      typeof prop.arg?.content === 'string' &&
      /^key(?:down|up|press)$/u.test(prop.arg.content),
  );

const hasClickHandler = (element: { props: readonly unknown[] }): boolean =>
  (element.props as { type: number; name?: string; arg?: { content?: string } }[]).some(
    (prop) =>
      prop.type === NodeTypes.DIRECTIVE && prop.name === 'on' && prop.arg?.content === 'click',
  );

export const interactiveElementsAreSemantic: AuditRule = {
  id: 'interactive-elements-are-semantic',
  title: 'Click handlers live on semantic controls',
  description:
    'A clickable div is invisible to keyboard and assistive technology unless it declares a role, is focusable, and handles keyboard activation.',
  category: 'accessibility',
  severity: 'error',
  confidence: 'medium',
  maxScore: 4,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const findings: Finding[] = [];

    forEachElement(files, (element, file) => {
      if (!NON_INTERACTIVE_TAGS.has(element.tag)) {
        return;
      }
      if (!hasClickHandler(element)) {
        return;
      }
      const role = findAttribute(element, 'role');
      const roleValue = role?.static?.trim();
      const missing: string[] = [];
      if (roleValue === undefined || !INTERACTIVE_ROLES.has(roleValue)) {
        missing.push('an interactive role');
      }
      if (findAttribute(element, 'tabindex') === undefined) {
        missing.push('tabindex');
      }
      if (!hasKeyboardHandler(element)) {
        missing.push('a keyboard handler');
      }
      if (missing.length > 0) {
        findings.push({
          message: `<${element.tag}> handles click but is missing ${missing.join(', ')}.`,
          evidence: [{ path: file.relPath, line: elementLine(element) }],
          remediation:
            'Use a native <button> or <a>, or add role, tabindex="0", and a keydown handler for Enter and Space.',
        });
      }
    });

    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
