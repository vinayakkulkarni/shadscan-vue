import type { AuditRule } from '../../audit.js';
import type { ElementNode } from '@vue/compiler-dom';
import { elementLine, tagMatchesComponent, walkTemplate } from '../../parse/sfc.js';
import type { Finding } from '../rule-result.js';

/**
 * Advisory-only check (maxScore 0) that composed menu/select/command items sit
 * inside an appropriate content or group wrapper within the same template. When
 * the required wrapper is absent but a same-family ancestor exists, the item is
 * named directly. When no same-family ancestor exists at all, the grouping is
 * assumed to be composed across component boundaries that static analysis
 * cannot follow.
 */

interface ItemSpec {
  /** The item component name. */
  item: string;
  /** Acceptable ancestor container component names. */
  containers: readonly string[];
  /** Same-family prefix used to detect cross-boundary composition. */
  family: string;
}

const ITEM_SPECS: readonly ItemSpec[] = [
  { item: 'SelectItem', containers: ['SelectContent', 'SelectGroup'], family: 'Select' },
  {
    item: 'DropdownMenuItem',
    containers: ['DropdownMenuContent', 'DropdownMenuGroup', 'DropdownMenuSub'],
    family: 'DropdownMenu',
  },
  { item: 'CommandItem', containers: ['CommandList', 'CommandGroup'], family: 'Command' },
];

const matchesAny = (tag: string, names: readonly string[]): boolean =>
  names.some((name) => tagMatchesComponent(tag, name));

/** True when the tag belongs to the same component family (e.g. Select*). */
const isFamilyTag = (tag: string, family: string): boolean => {
  const pascal = tag.replace(/-([a-z])/gu, (_, c: string) => c.toUpperCase());
  const normalized = pascal.charAt(0).toUpperCase() + pascal.slice(1);
  return normalized.startsWith(family);
};

export const itemsBelongToGroups: AuditRule = {
  id: 'items-belong-to-groups',
  title: 'Menu items belong to their groups',
  description:
    'Select, dropdown, and command items should be composed inside their content or group wrappers. This advisory highlights items that appear misplaced within a single template.',
  category: 'interaction',
  severity: 'warning',
  confidence: 'medium',
  maxScore: 0,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const advisories: Finding[] = [];

    for (const file of files) {
      if (file.kind !== 'vue' || file.sfc?.templateAst === undefined) {
        continue;
      }
      walkTemplate(file.sfc.templateAst, (element: ElementNode, ancestors) => {
        for (const spec of ITEM_SPECS) {
          if (!tagMatchesComponent(element.tag, spec.item)) {
            continue;
          }
          const hasContainer = ancestors.some((ancestor) =>
            matchesAny(ancestor.tag, spec.containers),
          );
          if (hasContainer) {
            return;
          }
          const hasFamilyAncestor = ancestors.some((ancestor) =>
            isFamilyTag(ancestor.tag, spec.family),
          );
          if (hasFamilyAncestor) {
            advisories.push({
              message: `<${element.tag}> is not inside a ${spec.containers.join(' or ')} in ${file.relPath}.`,
              evidence: [{ path: file.relPath, line: elementLine(element) }],
              remediation: `Move <${element.tag}> inside a ${spec.containers[0]} wrapper.`,
            });
          } else {
            advisories.push({
              message:
                'Item grouping is composed across component boundaries that static analysis cannot follow.',
              evidence: [{ path: file.relPath, line: elementLine(element) }],
              remediation: `Confirm <${element.tag}> is rendered inside a ${spec.containers[0]} wrapper in the composing parent.`,
            });
          }
          return;
        }
      });
    }

    if (advisories.length > 0) {
      return result.advisory(advisories);
    }
    return result.pass();
  },
};
