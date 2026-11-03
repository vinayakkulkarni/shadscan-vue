import type { DirectiveNode, ElementNode } from '@vue/compiler-dom';
import { NodeTypes } from '@vue/compiler-dom';
import type { AuditRule } from '../../audit.js';
import { elementLine, findAttribute } from '../../parse/sfc.js';
import type { Finding } from '../rule-result.js';
import {
  BUTTON_TAGS,
  elementChildren,
  forEachElement,
  LINK_TAGS,
  NON_INTERACTIVE_TAGS,
} from './a11y-shared.js';

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

const clickDirective = (element: ElementNode): DirectiveNode | undefined =>
  element.props.find(
    (prop): prop is DirectiveNode =>
      prop.type === NodeTypes.DIRECTIVE &&
      prop.name === 'on' &&
      prop.arg?.type === NodeTypes.SIMPLE_EXPRESSION &&
      prop.arg.content === 'click',
  );

const hasModifier = (directive: DirectiveNode, modifier: string): boolean =>
  directive.modifiers.some((entry) => entry.content === modifier);

/** `@click.stop` or a handler that calls `stopPropagation()` ends bubbling here. */
const stopsPropagation = (element: ElementNode): boolean => {
  const click = clickDirective(element);
  if (click === undefined) {
    return false;
  }
  if (hasModifier(click, 'stop')) {
    return true;
  }
  const handler = click.exp?.type === NodeTypes.SIMPLE_EXPRESSION ? click.exp.content : '';
  return /\bstopPropagation\s*\(/u.test(handler);
};

const isKeyboardActivatable = (element: ElementNode): boolean => {
  if (BUTTON_TAGS.has(element.tag)) {
    return true;
  }
  if (element.tag === 'a') {
    return findAttribute(element, 'href') !== undefined;
  }
  return LINK_TAGS.has(element.tag);
};

/**
 * True when Enter/Space on a native control inside `element` dispatches a click
 * that bubbles up to it (react.doctor #1919). A child or intermediate element
 * that stops propagation blocks that path; `@click.self` ignores bubbled clicks.
 */
const reachableThroughChild = (element: ElementNode): boolean => {
  const click = clickDirective(element);
  if (click === undefined || hasModifier(click, 'self')) {
    return false;
  }
  const scan = (node: ElementNode): boolean =>
    elementChildren(node).some((child) => {
      if (stopsPropagation(child)) {
        return false;
      }
      return isKeyboardActivatable(child) || scan(child);
    });
  return scan(element);
};

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
      if (!hasClickHandler(element) || reachableThroughChild(element)) {
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
