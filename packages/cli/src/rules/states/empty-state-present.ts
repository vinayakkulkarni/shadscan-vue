import type { ElementNode } from '@vue/compiler-dom';
import type { AuditRule } from '../../audit.js';
import type { ParsedFile } from '../../parse/project-files.js';
import type { Finding } from '../rule-result.js';
import { collectTemplateElements, directiveExpression, directiveNamed } from './states-shared.js';

/** Extract the iterated collection expression from a `v-for` expression. */
const forCollection = (expression: string): string | undefined => {
  // `(item, index) in items` / `item in items` / `item of items`
  const match = /\b(?:in|of)\s+(.+)$/su.exec(expression);
  if (match === null) {
    return undefined;
  }
  return match[1]!.trim();
};

/** Reduce a collection expression to its base identifier (e.g. `state.rows` → `rows`). */
const baseIdentifier = (collection: string): string | undefined => {
  const match = /([A-Za-z_$][\w$]*)\s*$/u.exec(collection);
  return match?.[1];
};

/** True when the file's script region references the identifier. */
const scriptDefines = (file: ParsedFile, identifier: string): boolean => {
  const script =
    file.sfc?.descriptor.scriptSetup?.content ?? file.sfc?.descriptor.script?.content ?? '';
  const pattern = new RegExp(`\\b${identifier}\\b`, 'u');
  return pattern.test(script);
};

/** True when the file contains an empty-branch guard for the collection. */
const hasEmptyBranch = (fileText: string, collection: string, identifier: string): boolean => {
  const escapedCollection = collection.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const escapedId = identifier.replace(/[.*+?^${}()|[\]\\]/gu, '\\$&');
  const ref = `(?:${escapedCollection}|${escapedId})`;
  const patterns = [
    // .length === 0 / == 0
    new RegExp(`${ref}(?:\\.value)?\\.length\\s*===?\\s*0`, 'u'),
    // !collection.length
    new RegExp(`!\\s*${ref}(?:\\.value)?\\.length`, 'u'),
    // v-else paired with a v-if on the same collection's length
    new RegExp(`v-if=["']${ref}(?:\\.value)?\\.length["']`, 'u'),
  ];
  const hasLengthGuard = patterns.some((pattern) => pattern.test(fileText));
  if (!hasLengthGuard) {
    return false;
  }
  // Require a v-else / v-else-if / v-if branch to actually exist in the file.
  return /v-else\b|v-else-if=|v-if=/u.test(fileText);
};

export const emptyStatePresent: AuditRule = {
  id: 'empty-state-present',
  title: 'Iterated collections render an empty state',
  description:
    'Templates that iterate a script-defined collection with v-for must also render an empty branch (a length-guarded v-if/v-else-if/v-else) so an empty list is not a blank screen.',
  category: 'states',
  severity: 'warning',
  confidence: 'medium',
  maxScore: 4,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const elements = collectTemplateElements(files);

    const forElements: { file: ParsedFile; element: ElementNode; line: number }[] = [];
    for (const entry of elements) {
      if (directiveNamed(entry.element, 'for') !== undefined) {
        forElements.push(entry);
      }
    }

    if (forElements.length === 0) {
      return result.notApplicable();
    }

    const failures: Finding[] = [];
    for (const { file, element, line } of forElements) {
      const forDirective = directiveNamed(element, 'for');
      const expression = forDirective === undefined ? undefined : directiveExpression(forDirective);
      if (expression === undefined) {
        continue;
      }
      const collection = forCollection(expression);
      if (collection === undefined) {
        continue;
      }
      const identifier = baseIdentifier(collection);
      if (identifier === undefined) {
        continue;
      }
      if (!scriptDefines(file, identifier)) {
        continue;
      }
      if (hasEmptyBranch(file.text, collection, identifier)) {
        continue;
      }
      failures.push({
        message: `<${element.tag}> iterates \`${collection}\` with no empty-state branch in this file.`,
        evidence: [{ path: file.relPath, line }],
        remediation: `Add a length-guarded branch (e.g. v-if="${identifier}.length === 0") that renders an empty state next to the v-for.`,
      });
    }

    if (failures.length > 0) {
      return result.fail(failures);
    }
    return result.pass();
  },
};
