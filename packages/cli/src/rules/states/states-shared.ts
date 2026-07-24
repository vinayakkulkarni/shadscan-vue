import type { DirectiveNode, ElementNode } from '@vue/compiler-dom';
import { NodeTypes } from '@vue/compiler-dom';
import type { ParsedFile } from '../../parse/project-files.js';
import { elementLine, walkTemplate } from '../../parse/sfc.js';

/** A template element paired with the file it belongs to. */
export interface TemplateElement {
  file: ParsedFile;
  element: ElementNode;
  line: number;
}

/** Collect every element across all parsed .vue templates. */
export const collectTemplateElements = (files: readonly ParsedFile[]): TemplateElement[] => {
  const elements: TemplateElement[] = [];
  for (const file of files) {
    if (file.kind !== 'vue' || file.sfc?.templateAst === undefined) {
      continue;
    }
    walkTemplate(file.sfc.templateAst, (element) => {
      elements.push({ file, element, line: elementLine(element) });
    });
  }
  return elements;
};

/** Return the structural directive (v-for/v-if/etc.) with the given name, if present. */
export const directiveNamed = (element: ElementNode, name: string): DirectiveNode | undefined => {
  for (const prop of element.props) {
    if (prop.type === NodeTypes.DIRECTIVE && prop.name === name) {
      return prop;
    }
  }
  return undefined;
};

/** Expression string of a structural directive (e.g. the `x in xs` of v-for). */
export const directiveExpression = (directive: DirectiveNode): string | undefined => {
  const exp = directive.exp;
  if (exp !== undefined && exp.type === NodeTypes.SIMPLE_EXPRESSION) {
    return exp.content;
  }
  return undefined;
};

/** True when the template element is a Vue <Suspense> in kebab or Pascal form. */
export const isSuspenseTag = (tag: string): boolean => tag === 'Suspense' || tag === 'suspense';

/**
 * True when the element is a `<template #fallback>` / `v-slot:fallback` slot
 * carrier — a template element bearing a slot directive whose arg is `fallback`.
 */
export const isFallbackSlot = (element: ElementNode): boolean => {
  if (element.tag !== 'template') {
    return false;
  }
  return element.props.some(
    (prop) =>
      prop.type === NodeTypes.DIRECTIVE &&
      prop.name === 'slot' &&
      prop.arg !== undefined &&
      prop.arg.type === NodeTypes.SIMPLE_EXPRESSION &&
      prop.arg.content === 'fallback',
  );
};

/** True when a template subtree contains any non-whitespace text or element. */
export const hasRenderableContent = (element: ElementNode): boolean => {
  for (const child of element.children) {
    if (child.type === NodeTypes.ELEMENT) {
      return true;
    }
    if (child.type === NodeTypes.INTERPOLATION) {
      return true;
    }
    if (child.type === NodeTypes.TEXT && child.content.trim().length > 0) {
      return true;
    }
  }
  return false;
};

/** Nuxt app-shell files that legitimately mount global infrastructure. */
export const isNuxtShellFile = (relPath: string): boolean =>
  relPath === 'app.vue' ||
  relPath === 'app/app.vue' ||
  relPath === 'App.vue' ||
  relPath === 'src/App.vue' ||
  relPath === 'error.vue' ||
  relPath === 'app/error.vue' ||
  relPath.startsWith('layouts/') ||
  relPath.startsWith('app/layouts/');

/** Any app-shell file (nuxt or vite) suitable for mounting global providers. */
export const isShellFile = (relPath: string): boolean =>
  isNuxtShellFile(relPath) || /(?:^|\/)App\.vue$/u.test(relPath);

/** Nuxt error page files. */
export const isNuxtErrorFile = (relPath: string): boolean =>
  relPath === 'error.vue' || relPath === 'app/error.vue';

/** A dependency is declared (deps or devDeps merged in discovery). */
export const hasDependency = (dependencies: Record<string, string>, name: string): boolean =>
  dependencies[name] !== undefined;
