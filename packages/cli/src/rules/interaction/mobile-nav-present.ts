import type { AuditRule } from '../../audit.js';
import type { ParsedFile } from '../../parse/project-files.js';
import { findAttribute, tagMatchesComponent, walkTemplate } from '../../parse/sfc.js';

/**
 * When an app-level navigation shell exists, requires a responsive mobile
 * affordance: either a mobile-visibility trigger (e.g. `md:hidden`) opening a
 * Sheet/Drawer/Dialog/panel, or a fixed bottom navigation with responsive
 * classes. Projects with no app-level navigation are not applicable.
 */

const isShellFile = (relPath: string): boolean =>
  relPath === 'app.vue' ||
  relPath === 'App.vue' ||
  relPath === 'src/App.vue' ||
  relPath === 'app/app.vue' ||
  relPath.startsWith('layouts/') ||
  relPath.startsWith('app/layouts/');

const MOBILE_VISIBILITY_PATTERN = /\b(?:sm|md|lg|xl):(?:hidden|flex|block|grid|inline-flex)\b/u;
const PANEL_COMPONENTS = ['Sheet', 'Drawer', 'Dialog'] as const;
const FIXED_BOTTOM_PATTERN = /\bfixed\b/u;
const BOTTOM_PATTERN = /\bbottom-0\b|\binset-x-0\b/u;

interface ShellScan {
  hasNav: boolean;
  hasResponsiveTrigger: boolean;
}

const classListOf = (element: Parameters<Parameters<typeof walkTemplate>[1]>[0]): string => {
  const attr = findAttribute(element, 'class');
  return attr?.static ?? '';
};

const scanShell = (file: ParsedFile): ShellScan => {
  if (file.kind !== 'vue' || file.sfc?.templateAst === undefined) {
    return { hasNav: false, hasResponsiveTrigger: false };
  }
  let hasNav = false;
  let hasResponsiveTrigger = false;

  walkTemplate(file.sfc.templateAst, (element) => {
    // App-level navigation: <nav> or role="navigation".
    const role = findAttribute(element, 'role');
    if (element.tag === 'nav' || role?.static === 'navigation') {
      hasNav = true;
    }

    const classes = classListOf(element);

    // Mobile-visibility trigger that opens a panel component.
    const isPanel = PANEL_COMPONENTS.some((name) => tagMatchesComponent(element.tag, name));
    if (isPanel && MOBILE_VISIBILITY_PATTERN.test(file.text)) {
      hasResponsiveTrigger = true;
    }
    if (MOBILE_VISIBILITY_PATTERN.test(classes)) {
      // A trigger element with a mobile-visibility class near a panel.
      hasResponsiveTrigger =
        hasResponsiveTrigger ||
        PANEL_COMPONENTS.some((name) => new RegExp(name, 'u').test(file.text));
    }

    // Fixed bottom nav with responsive classes.
    if (
      element.tag === 'nav' &&
      FIXED_BOTTOM_PATTERN.test(classes) &&
      BOTTOM_PATTERN.test(classes) &&
      MOBILE_VISIBILITY_PATTERN.test(classes)
    ) {
      hasResponsiveTrigger = true;
    }
  });

  return { hasNav, hasResponsiveTrigger };
};

export const mobileNavPresent: AuditRule = {
  id: 'mobile-nav-present',
  title: 'App navigation has a mobile affordance',
  description:
    'When an app-level navigation shell exists, mobile users need a responsive affordance: a mobile-visibility trigger opening a Sheet/Drawer/Dialog, or a responsive fixed bottom navigation.',
  category: 'interaction',
  severity: 'warning',
  confidence: 'medium',
  maxScore: 3,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const shells = files.filter((file) => isShellFile(file.relPath));

    let anyNav = false;
    let anyResponsive = false;
    let navEvidence: ParsedFile | undefined;

    for (const shell of shells) {
      const scan = scanShell(shell);
      if (scan.hasNav) {
        anyNav = true;
        navEvidence ??= shell;
      }
      if (scan.hasResponsiveTrigger) {
        anyResponsive = true;
      }
    }

    if (!anyNav) {
      return result.notApplicable();
    }
    if (anyResponsive) {
      return result.pass();
    }

    return result.fail([
      {
        message: 'App navigation has no responsive mobile affordance.',
        evidence: navEvidence !== undefined ? [{ path: navEvidence.relPath }] : [],
        remediation:
          'Add a mobile-visibility trigger (e.g. `md:hidden`) that opens a Sheet/Drawer/Dialog, or provide a responsive fixed bottom navigation.',
      },
    ]);
  },
};
