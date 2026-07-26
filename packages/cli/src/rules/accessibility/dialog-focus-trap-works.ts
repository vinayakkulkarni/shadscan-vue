import type { AuditRule } from '../../audit.js';
import type { ParsedFile } from '../../parse/project-files.js';
import { pascalToKebab, walkTemplate } from '../../parse/sfc.js';
import { elementLine, findAttribute } from '../../parse/sfc.js';
import { isGeneratedUiPrimitive } from '../generated-ui.js';

const DIALOG_TAGS = new Set([
  'dialog',
  'dialog-root',
  'dialog-content',
  'alert-dialog',
  'alert-dialog-root',
  'alert-dialog-content',
  'drawer',
  'drawer-content',
  'sheet',
  'sheet-content',
]);

const DIALOG_ROLES = new Set(['dialog', 'alertdialog']);

/**
 * reka-ui is the headless layer shadcn-vue is built on, so its dialog
 * primitives already own focus containment and restoration. Vaul-vue is the
 * drawer equivalent.
 */
const FOCUS_MANAGED_DEPENDENCIES = ['reka-ui', 'radix-vue', 'vaul-vue', '@headlessui/vue'];

const isDialogTag = (tag: string): boolean => DIALOG_TAGS.has(pascalToKebab(tag));

const findDialogSurface = (
  files: readonly ParsedFile[],
): { file: ParsedFile; line: number } | undefined => {
  for (const file of files) {
    if (file.sfc?.templateAst === undefined || isGeneratedUiPrimitive(file.relPath)) {
      continue;
    }
    let found: number | undefined;
    walkTemplate(file.sfc.templateAst, (element) => {
      if (found !== undefined) {
        return;
      }
      const role = findAttribute(element, 'role')?.static;
      if (isDialogTag(element.tag) || (role !== undefined && DIALOG_ROLES.has(role))) {
        found = elementLine(element);
      }
    });
    if (found !== undefined) {
      return { file, line: found };
    }
  }
  return undefined;
};

export const dialogFocusTrapWorks: AuditRule = {
  id: 'dialog-focus-trap-works',
  title: 'Dialogs trap and restore focus',
  description:
    'Looks for a focus-managed primitive behind dialog-like surfaces. Focus containment and restoration cannot be proven statically, so this reports what backs the dialog rather than scoring it.',
  category: 'accessibility',
  severity: 'warning',
  confidence: 'low',
  maxScore: 0,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, discovery, result }) => {
    const files = await sources();
    const surface = findDialogSurface(files);

    if (surface === undefined) {
      return result.notApplicable();
    }

    const primitive = FOCUS_MANAGED_DEPENDENCIES.find(
      (dependency) => discovery.dependencies[dependency] !== undefined,
    );

    if (primitive !== undefined) {
      return result.pass();
    }

    return result.advisory([
      {
        message: 'A dialog surface was found with no focus-managed primitive behind it.',
        evidence: [{ path: surface.file.relPath, line: surface.line }],
        remediation:
          'Build the dialog on reka-ui (the layer shadcn-vue uses) or another focus-managed primitive, then verify initial focus, Tab containment, Escape, and focus return in a browser.',
      },
    ]);
  },
};
