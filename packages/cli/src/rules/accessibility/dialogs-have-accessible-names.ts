import type { ElementNode } from '@vue/compiler-dom';
import type { AuditRule } from '../../audit.js';
import type { ParsedFile } from '../../parse/project-files.js';
import { elementLine, pascalToKebab } from '../../parse/sfc.js';
import { isGeneratedUiPrimitive } from '../generated-ui.js';
import type { Finding } from '../rule-result.js';
import { forEachElement, hasAriaName } from './a11y-shared.js';

/**
 * shadcn-vue dialog surfaces wrap reka-ui primitives. Both the shadcn wrapper
 * name and the underlying reka-ui primitive are matched, so a project that
 * imports reka-ui directly is audited the same way.
 */
const CONTENT_TAGS = new Set([
  'dialog-content',
  'alert-dialog-content',
  'sheet-content',
  'drawer-content',
  'dialog-portal-content',
]);

const TITLE_TAGS = new Set(['dialog-title', 'alert-dialog-title', 'sheet-title', 'drawer-title']);

const REKA_PRIMITIVE_MODULES = ['reka-ui', 'radix-vue'];

const isContentTag = (tag: string): boolean => CONTENT_TAGS.has(pascalToKebab(tag));
const isTitleTag = (tag: string): boolean => TITLE_TAGS.has(pascalToKebab(tag));

const containsTitle = (element: ElementNode): boolean =>
  element.children.some((child) => {
    if (child.type !== 1) {
      return false;
    }
    return isTitleTag(child.tag) || containsTitle(child);
  });

/**
 * Dialog primitives reach a template either through an explicit import (Vite
 * projects and direct reka-ui consumers) or through Nuxt auto-imports, where
 * no import statement exists at all.
 */
const hasDialogProvenance = (file: ParsedFile, uiImport: (specifier: string) => boolean): boolean =>
  file.imports.some(
    (entry) =>
      REKA_PRIMITIVE_MODULES.includes(entry.moduleSpecifier) || uiImport(entry.moduleSpecifier),
  );

export const dialogsHaveAccessibleNames: AuditRule = {
  id: 'dialogs-have-accessible-names',
  title: 'Dialogs have accessible names',
  description:
    'A dialog without a title is announced as an unnamed region, so a screen reader user entering it has no idea what it is for. Covers shadcn-vue dialog, alert dialog, sheet, and drawer surfaces, and the reka-ui primitives beneath them.',
  category: 'accessibility',
  severity: 'error',
  confidence: 'high',
  maxScore: 4,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ discovery, sources, helpers, result }) => {
    const files = await sources();
    const findings: Finding[] = [];
    let evaluated = 0;

    forEachElement(files, (element, file) => {
      if (!isContentTag(element.tag) || isGeneratedUiPrimitive(file.relPath)) {
        return;
      }
      const autoImported = discovery.adapter === 'nuxt';
      if (!autoImported && !hasDialogProvenance(file, helpers.isShadcnUiImport)) {
        return;
      }
      evaluated += 1;
      if (containsTitle(element) || hasAriaName(element)) {
        return;
      }
      findings.push({
        message: `<${element.tag}> has no accessible name.`,
        evidence: [{ path: file.relPath, line: elementLine(element) }],
        remediation:
          'Render a title component inside the dialog, or add aria-label to the content element.',
      });
    });

    if (evaluated === 0) {
      return result.notApplicable();
    }
    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
