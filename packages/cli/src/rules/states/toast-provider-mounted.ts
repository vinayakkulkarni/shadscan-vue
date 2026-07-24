import type { AuditRule } from '../../audit.js';
import { tagMatchesComponent } from '../../parse/sfc.js';
import { collectTemplateElements, isShellFile } from './states-shared.js';

/** Mounted toast provider elements. */
const TOAST_PROVIDER_COMPONENTS = ['Toaster', 'SonnerToaster', 'UNotifications'];

const isToastProviderElement = (tag: string): boolean =>
  TOAST_PROVIDER_COMPONENTS.some((component) => tagMatchesComponent(tag, component)) ||
  /sonner/iu.test(tag);

export const toastProviderMounted: AuditRule = {
  id: 'toast-provider-mounted',
  title: 'The toast provider is mounted from the app shell',
  description:
    'A toast provider element must be rendered from an app-shell file (app.vue, App.vue, a layout, or error.vue), not merely present somewhere in the component tree.',
  category: 'states',
  severity: 'warning',
  confidence: 'high',
  maxScore: 3,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const elements = collectTemplateElements(files);

    const providerElements = elements.filter(({ element }) => isToastProviderElement(element.tag));

    if (providerElements.length === 0) {
      // No toast infrastructure at all — toast-provider-present owns that failure.
      return result.notApplicable();
    }

    const mountedInShell = providerElements.some(({ file }) => isShellFile(file.relPath));
    if (mountedInShell) {
      return result.pass();
    }

    const first = providerElements[0]!;
    return result.fail([
      {
        message: 'Toast infrastructure is not mounted from the app shell.',
        evidence: [{ path: first.file.relPath, line: first.line }],
        remediation:
          'Move the toast provider element (e.g. <Toaster />) into app.vue, App.vue, a layout, or error.vue so it is always mounted.',
      },
    ]);
  },
};
