import type { AuditRule } from '../../audit.js';
import type { ParsedFile } from '../../parse/project-files.js';
import { tagMatchesComponent, walkTemplate } from '../../parse/sfc.js';

/**
 * Verifies a complete, app-level command menu is mounted: the ui command module
 * is imported (or the `components/ui/command/` directory exists for Nuxt
 * auto-imports), and a single template contains every required part of the
 * command surface — dialog, input, empty state, and at least one item.
 */

const REQUIRED_PARTS = ['CommandDialog', 'CommandInput', 'CommandEmpty', 'CommandItem'] as const;

const usesCommandModule = (
  files: readonly ParsedFile[],
  isShadcnUiImport: (moduleSpecifier: string) => boolean,
): boolean => {
  for (const file of files) {
    for (const entry of file.imports) {
      if (
        isShadcnUiImport(entry.moduleSpecifier) &&
        /(?:^|\/)command$/u.test(entry.moduleSpecifier)
      ) {
        return true;
      }
    }
  }
  // Nuxt auto-import fallback: a components/ui/command/ directory exists.
  return files.some((file) => /(?:^|\/)components\/ui\/command\//u.test(file.relPath));
};

const templateHasAllParts = (file: ParsedFile): boolean => {
  if (file.kind !== 'vue' || file.sfc?.templateAst === undefined) {
    return false;
  }
  const seen = new Set<string>();
  walkTemplate(file.sfc.templateAst, (element) => {
    for (const part of REQUIRED_PARTS) {
      if (tagMatchesComponent(element.tag, part)) {
        seen.add(part);
      }
    }
  });
  return REQUIRED_PARTS.every((part) => seen.has(part));
};

export const commandMenuPresent: AuditRule = {
  id: 'command-menu-present',
  title: 'A complete command menu is mounted',
  description:
    'A discoverable command palette should be mounted at the app level: the shadcn command module is used and a single template renders the dialog, input, empty state, and command items together.',
  category: 'interaction',
  severity: 'warning',
  confidence: 'high',
  maxScore: 5,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, helpers, result }) => {
    const files = await sources();

    if (!usesCommandModule(files, helpers.isShadcnUiImport)) {
      return result.fail([
        {
          message: 'No complete mounted app-level command menu was found.',
          evidence: [],
          remediation:
            'Install the shadcn command component and mount a CommandDialog with CommandInput, CommandEmpty, and CommandItem parts at the app level.',
        },
      ]);
    }

    const complete = files.find((file) => templateHasAllParts(file));
    if (complete !== undefined) {
      return result.pass();
    }

    return result.fail([
      {
        message:
          'The command module is installed but no template assembles it into a command menu.',
        evidence: [],
        remediation:
          'Ensure a single template renders CommandDialog, CommandInput, CommandEmpty, and at least one CommandItem together. A hand-rolled palette misses the keyboard and labelling behaviour these parts provide.',
      },
    ]);
  },
};
