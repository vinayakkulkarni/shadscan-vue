import type { AuditRule } from '../../audit.js';
import { tagMatchesComponent } from '../../parse/sfc.js';
import { collectTemplateElements, hasDependency } from './states-shared.js';

/** Recognized toast runtime packages. */
const TOAST_RUNTIMES = ['vue-sonner', 'vue-toastification', '@nuxt/ui'];

/** Mounted toast provider elements that give verifiable runtime provenance. */
const TOAST_PROVIDER_COMPONENTS = ['Toaster', 'SonnerToaster', 'UNotifications'];

export const toastProviderPresent: AuditRule = {
  id: 'toast-provider-present',
  title: 'A toast provider is present',
  description:
    'A recognized toast runtime must be installed and a matching provider element (Toaster/SonnerToaster/UNotifications, or a sonner ui-dir component) must be mounted in a template.',
  category: 'states',
  severity: 'warning',
  confidence: 'high',
  maxScore: 3,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ discovery, sources, result, helpers }) => {
    const files = await sources();

    const runtimeDep = TOAST_RUNTIMES.some((name) => hasDependency(discovery.dependencies, name));

    const elements = collectTemplateElements(files);
    const mounted = elements.some(({ file, element }) => {
      if (
        TOAST_PROVIDER_COMPONENTS.some((component) => tagMatchesComponent(element.tag, component))
      ) {
        return true;
      }
      // A sonner-style component imported from the shadcn ui directory.
      if (/sonner/iu.test(element.tag)) {
        return file.imports.some(
          (entry) =>
            /sonner/iu.test(entry.moduleSpecifier) &&
            helpers.isShadcnUiImport(entry.moduleSpecifier),
        );
      }
      return false;
    });

    if (runtimeDep && mounted) {
      return result.pass();
    }

    return result.fail([
      {
        message: 'No mounted toast provider with verifiable runtime provenance was found.',
        evidence: [{ path: 'app.vue' }],
        remediation:
          'Install a toast runtime (vue-sonner, vue-toastification, or @nuxt/ui) and mount its provider element (e.g. <Toaster />) in the app shell.',
      },
    ]);
  },
};
