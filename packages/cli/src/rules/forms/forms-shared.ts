import type { ElementNode } from '@vue/compiler-dom';
import { NodeTypes } from '@vue/compiler-dom';
import type { ParsedFile } from '../../parse/project-files.js';
import { findAttribute, pascalToKebab, walkTemplate } from '../../parse/sfc.js';
import { isGeneratedUiPrimitive } from '../generated-ui.js';

export interface FormElement {
  file: ParsedFile;
  element: ElementNode;
  ancestors: readonly ElementNode[];
  line: number;
}

export const VALIDATION_PACKAGES = [
  'vee-validate',
  '@vee-validate/zod',
  '@vee-validate/rules',
  '@vorms/core',
  '@formkit/vue',
];

export const NON_LABELLED_INPUT_TYPES = new Set(['hidden', 'submit', 'button', 'image', 'reset']);

export const collectFormElements = (files: readonly ParsedFile[]): FormElement[] => {
  const elements: FormElement[] = [];
  for (const file of files) {
    if (
      file.kind !== 'vue' ||
      file.sfc?.templateAst === undefined ||
      isGeneratedUiPrimitive(file.relPath)
    ) {
      continue;
    }
    walkTemplate(file.sfc.templateAst, (element, ancestors) => {
      elements.push({ file, element, ancestors, line: element.loc.start.line });
    });
  }
  return elements;
};

const NATIVE_CONTROL_TAGS = new Set(['input', 'textarea', 'select']);

/**
 * shadcn `Select` is a headless root provider, not a focusable control: the
 * labellable element is `SelectTrigger`. Native lowercase `select` is a real
 * control, so the distinction is made on the tag as authored.
 */
export const isControlTag = (tag: string): boolean => {
  if (NATIVE_CONTROL_TAGS.has(tag)) {
    return true;
  }
  const normalized = pascalToKebab(tag);
  return normalized === 'input' || normalized === 'textarea' || normalized === 'select-trigger';
};

export const inputType = (element: ElementNode): string | undefined =>
  findAttribute(element, 'type')?.static?.trim();

export const attributeValue = (element: ElementNode, name: string): string | undefined => {
  const attribute = findAttribute(element, name);
  if (attribute === undefined) {
    return undefined;
  }
  return attribute.bound ? '' : attribute.static;
};

export const hasAttribute = (element: ElementNode, name: string): boolean =>
  findAttribute(element, name) !== undefined;

export const hasAnyAttribute = (element: ElementNode, names: readonly string[]): boolean =>
  names.some((name) => hasAttribute(element, name));

export const usesValidationLibrary = (dependencies: Record<string, string>): boolean =>
  VALIDATION_PACKAGES.some((name) => dependencies[name] !== undefined);

export const elementText = (element: ElementNode): string => {
  let text = '';
  for (const child of element.children) {
    if (child.type === NodeTypes.TEXT) {
      text += child.content;
    } else if (child.type === NodeTypes.ELEMENT) {
      text += elementText(child);
    }
  }
  return text.trim();
};

export const isInsideTag = (
  ancestors: readonly ElementNode[],
  matcher: (tag: string) => boolean,
): boolean => ancestors.some((ancestor) => matcher(ancestor.tag));

export const isFormFieldWrapper = (tag: string): boolean => {
  const normalized = pascalToKebab(tag);
  return normalized === 'form-field' || normalized === 'form-item';
};

export const hasFormSurface = (elements: readonly FormElement[]): boolean =>
  elements.some(
    ({ element }) =>
      element.tag === 'form' || isControlTag(element.tag) || isFormFieldWrapper(element.tag),
  );
