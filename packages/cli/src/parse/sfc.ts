import { parse as parseSfc, type SFCDescriptor, type SFCParseResult } from '@vue/compiler-sfc';
import type {
  AttributeNode,
  DirectiveNode,
  ElementNode,
  RootNode,
  TemplateChildNode,
} from '@vue/compiler-dom';
import { NodeTypes } from '@vue/compiler-dom';

export interface ParsedSfc {
  descriptor: SFCDescriptor;
  templateAst?: RootNode;
  errors: SFCParseResult['errors'];
}

export const parseVueFile = (filename: string, source: string): ParsedSfc => {
  const { descriptor, errors } = parseSfc(source, { filename });
  return {
    descriptor,
    templateAst: descriptor.template?.ast,
    errors,
  };
};

/** `AlertDialog` → `alert-dialog`. */
export const pascalToKebab = (name: string): string =>
  name
    .replace(/([a-z0-9])([A-Z])/gu, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/gu, '$1-$2')
    .toLowerCase();

/** `alert-dialog` → `AlertDialog`. */
export const kebabToPascal = (name: string): string =>
  name
    .split('-')
    .map((part) => (part.length > 0 ? part[0]!.toUpperCase() + part.slice(1) : part))
    .join('');

/**
 * True when a template element tag refers to the given component name in
 * either PascalCase or kebab-case form.
 */
export const tagMatchesComponent = (tag: string, componentName: string): boolean => {
  if (tag === componentName) {
    return true;
  }
  return pascalToKebab(tag) === pascalToKebab(componentName);
};

export const isElementNode = (node: { type: number }): node is ElementNode =>
  node.type === NodeTypes.ELEMENT;

export const walkTemplate = (
  root: RootNode,
  visit: (node: ElementNode, ancestors: readonly ElementNode[]) => void,
): void => {
  const stack: ElementNode[] = [];
  const walkChildren = (children: readonly TemplateChildNode[]): void => {
    for (const child of children) {
      if (isElementNode(child)) {
        visit(child, stack);
        stack.push(child);
        walkChildren(child.children);
        stack.pop();
      } else if (child.type === NodeTypes.IF) {
        for (const branch of child.branches) {
          walkChildren(branch.children);
        }
      } else if (child.type === NodeTypes.FOR) {
        walkChildren(child.children);
      }
    }
  };
  walkChildren(root.children);
};

export interface AttributeLookup {
  /** Static attribute value, e.g. alt="text". Empty string when valueless. */
  static?: string;
  /** True when bound via v-bind/:name. */
  bound: boolean;
  node: AttributeNode | DirectiveNode;
}

/**
 * Find an attribute or its bound (v-bind/:) equivalent on an element.
 */
export const findAttribute = (element: ElementNode, name: string): AttributeLookup | undefined => {
  for (const prop of element.props) {
    if (prop.type === NodeTypes.ATTRIBUTE && prop.name === name) {
      return { static: prop.value?.content ?? '', bound: false, node: prop };
    }
    if (
      prop.type === NodeTypes.DIRECTIVE &&
      prop.name === 'bind' &&
      prop.arg !== undefined &&
      prop.arg.type === NodeTypes.SIMPLE_EXPRESSION &&
      prop.arg.isStatic &&
      prop.arg.content === name
    ) {
      return { bound: true, node: prop };
    }
  }
  return undefined;
};

/** True when the element carries a v-bind="object" spread. */
export const hasSpreadBinding = (element: ElementNode): boolean =>
  element.props.some(
    (prop) => prop.type === NodeTypes.DIRECTIVE && prop.name === 'bind' && prop.arg === undefined,
  );

export const elementLine = (element: ElementNode): number => element.loc.start.line;
