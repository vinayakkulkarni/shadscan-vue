import type { AuditRule } from '../../audit.js';
import type { ParsedFile } from '../../parse/project-files.js';
import { elementLine, findAttribute, pascalToKebab, walkTemplate } from '../../parse/sfc.js';
import { isGeneratedUiPrimitive } from '../generated-ui.js';

const COMPOSITE_WIDGET_TAGS = new Set([
  'accordion',
  'accordion-root',
  'combobox',
  'combobox-root',
  'command',
  'dropdown-menu',
  'dropdown-menu-root',
  'listbox',
  'menu',
  'menubar',
  'navigation-menu',
  'select',
  'select-root',
  'tabs',
  'tabs-root',
  'tree',
]);

const COMPOSITE_ROLES = new Set(['grid', 'listbox', 'menu', 'menubar', 'tablist', 'tree']);

const KEYBOARD_PRIMITIVE_DEPENDENCIES = [
  'reka-ui',
  'radix-vue',
  '@headlessui/vue',
  '@ariakit/vue',
  '@zag-js/vue',
];

const isCompositeTag = (tag: string): boolean => COMPOSITE_WIDGET_TAGS.has(pascalToKebab(tag));

const findCompositeWidget = (
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
      if (isCompositeTag(element.tag) || (role !== undefined && COMPOSITE_ROLES.has(role))) {
        found = elementLine(element);
      }
    });
    if (found !== undefined) {
      return { file, line: found };
    }
  }
  return undefined;
};

export const keyboardNavigationWorks: AuditRule = {
  id: 'keyboard-navigation-works',
  title: 'Composite widgets support keyboard navigation',
  description:
    'Looks for a keyboard-aware primitive behind composite widgets such as menus, tabs, and listboxes. Arrow-key, Home/End, and focus behaviour cannot be proven statically, so this reports what backs the widget rather than scoring it.',
  category: 'accessibility',
  severity: 'warning',
  confidence: 'low',
  maxScore: 0,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, discovery, result }) => {
    const files = await sources();
    const widget = findCompositeWidget(files);

    if (widget === undefined) {
      return result.notApplicable();
    }

    const primitive = Object.keys(discovery.dependencies).find(
      (dependency) =>
        dependency.startsWith('@zag-js/') || KEYBOARD_PRIMITIVE_DEPENDENCIES.includes(dependency),
    );

    if (primitive !== undefined) {
      return result.pass();
    }

    return result.advisory([
      {
        message: 'A composite widget was found with no keyboard-aware primitive behind it.',
        evidence: [{ path: widget.file.relPath, line: widget.line }],
        remediation:
          "Build composite widgets on reka-ui (the layer shadcn-vue uses), or implement and test the widget's arrow-key, Home/End, Enter, Escape, and focus behaviour.",
      },
    ]);
  },
};
