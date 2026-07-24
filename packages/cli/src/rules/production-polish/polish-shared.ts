import type { ParsedFile } from '../../parse/project-files.js';
import { findAttribute, walkTemplate } from '../../parse/sfc.js';
import type { ElementNode } from '@vue/compiler-dom';

export const SHELL_FILES = new Set([
  'app.vue',
  'App.vue',
  'src/App.vue',
  'app/app.vue',
  'error.vue',
  'app/error.vue',
]);

export const isShellFile = (relPath: string): boolean =>
  SHELL_FILES.has(relPath) || relPath.startsWith('layouts/') || relPath.startsWith('app/layouts/');

export const isPageFile = (relPath: string): boolean =>
  relPath.startsWith('pages/') ||
  relPath.startsWith('app/pages/') ||
  relPath.startsWith('src/views/') ||
  relPath.startsWith('src/pages/');

export const staticClassList = (element: ElementNode): string[] => {
  const attribute = findAttribute(element, 'class');
  if (attribute === undefined || attribute.static === undefined) {
    return [];
  }
  return attribute.static.split(/\s+/u).filter((token) => token.length > 0);
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

export const hasVueFiles = (files: readonly ParsedFile[]): boolean =>
  files.some((file) => file.sfc?.templateAst !== undefined);
