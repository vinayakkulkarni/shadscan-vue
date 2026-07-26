import type { ElementNode, TemplateChildNode } from '@vue/compiler-dom';
import { ElementTypes, NodeTypes } from '@vue/compiler-dom';
import type { ParsedFile } from '../../parse/project-files.js';
import { findAttribute, pascalToKebab, walkTemplate } from '../../parse/sfc.js';

export const NATIVE_INTERACTIVE_TAGS = new Set([
  'a',
  'button',
  'input',
  'select',
  'textarea',
  'summary',
]);

export const NON_INTERACTIVE_TAGS = new Set(['div', 'span', 'li', 'td', 'p', 'section']);

export const LINK_TAGS = new Set(['a', 'NuxtLink', 'RouterLink', 'router-link', 'nuxt-link']);

export const BUTTON_TAGS = new Set(['button', 'Button', 'BaseButton']);

export const isIconTag = (tag: string): boolean => {
  const normalized = pascalToKebab(tag);
  return /(?:^|-)icon$/u.test(normalized) || normalized === 'svg' || normalized === 'i';
};

export const forEachElement = (
  files: readonly ParsedFile[],
  visit: (element: ElementNode, file: ParsedFile, ancestors: readonly ElementNode[]) => void,
): void => {
  for (const file of files) {
    if (file.sfc?.templateAst === undefined) {
      continue;
    }
    walkTemplate(file.sfc.templateAst, (element, ancestors) => {
      visit(element, file, ancestors);
    });
  }
};

const collectText = (children: readonly TemplateChildNode[]): string => {
  let text = '';
  for (const child of children) {
    if (child.type === NodeTypes.TEXT) {
      text += child.content;
    } else if (child.type === NodeTypes.INTERPOLATION) {
      text += 'x';
    } else if (child.type === NodeTypes.ELEMENT) {
      text += collectText(child.children);
    } else if (child.type === NodeTypes.IF) {
      for (const branch of child.branches) {
        text += collectText(branch.children);
      }
    } else if (child.type === NodeTypes.FOR) {
      text += collectText(child.children);
    }
  }
  return text;
};

export const visibleText = (element: ElementNode): string => collectText(element.children).trim();

/**
 * True when the element projects caller-supplied content through a `<slot>`.
 * The name then lives at the call site, so the component itself cannot be
 * judged nameless — `<a><slot /></a>` is a wrapper, not an anonymous link.
 */
export const projectsSlotContent = (element: ElementNode): boolean => {
  for (const child of element.children) {
    if (child.type !== NodeTypes.ELEMENT) {
      continue;
    }
    if (child.tagType === ElementTypes.SLOT) {
      return true;
    }
    if (projectsSlotContent(child)) {
      return true;
    }
  }
  return false;
};

/**
 * True when the element carries an explicit accessible name via ARIA,
 * a title, or visually-hidden text.
 */
export const hasAriaName = (element: ElementNode): boolean => {
  for (const name of ['aria-label', 'aria-labelledby', 'title']) {
    const attribute = findAttribute(element, name);
    if (attribute === undefined) {
      continue;
    }
    if (attribute.bound) {
      return true;
    }
    if (attribute.static !== undefined && attribute.static.trim().length > 0) {
      return true;
    }
  }
  return false;
};

const SR_ONLY_CLASS = /(?:^|\s)(?:sr-only|visually-hidden)(?:\s|$)/u;

export const hasScreenReaderText = (element: ElementNode): boolean => {
  let found = false;
  const scan = (node: ElementNode): void => {
    for (const child of node.children) {
      if (child.type !== NodeTypes.ELEMENT) {
        continue;
      }
      const className = findAttribute(child, 'class');
      if (
        className?.static !== undefined &&
        SR_ONLY_CLASS.test(className.static) &&
        collectText(child.children).trim().length > 0
      ) {
        found = true;
        return;
      }
      scan(child);
    }
  };
  scan(element);
  return found;
};

export const elementChildren = (element: ElementNode): ElementNode[] =>
  element.children.filter((child): child is ElementNode => child.type === NodeTypes.ELEMENT);

export const hasEventHandler = (element: ElementNode, event: string): boolean =>
  element.props.some(
    (prop) =>
      prop.type === NodeTypes.DIRECTIVE &&
      prop.name === 'on' &&
      prop.arg !== undefined &&
      prop.arg.type === NodeTypes.SIMPLE_EXPRESSION &&
      prop.arg.content === event,
  );

export const isComponentTag = (tag: string): boolean => /^[A-Z]/u.test(tag);
