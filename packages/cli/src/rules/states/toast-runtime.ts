import type { AuditRule } from '../../audit.js';
import { isGeneratedUiPrimitive } from '../generated-ui.js';

const TOAST_CALL = /\btoast(?:\.(?:success|error|info|warning|promise|custom|message))?\s*\(/u;

/**
 * The Vue toast runtimes shadcn-vue projects use. vue-sonner is what
 * shadcn-vue's own Sonner block installs; the others cover the common
 * alternatives.
 */
const TOAST_DEPENDENCIES = [
  'vue-sonner',
  'sonner',
  '@nuxt/ui',
  'vue-toastification',
  'vue3-toastify',
  'primevue',
];

const lineOf = (text: string, pattern: RegExp): number => {
  const index = text.search(pattern);
  if (index < 0) {
    return 1;
  }
  return text.slice(0, index).split('\n').length;
};

export const toastRuntime: AuditRule = {
  id: 'toast-runtime',
  title: 'Toast calls have a runtime behind them',
  description:
    'Code that calls toast() needs a toast library installed, otherwise the call resolves to nothing at runtime and the notification silently never appears.',
  category: 'states',
  severity: 'error',
  confidence: 'high',
  maxScore: 3,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, discovery, result }) => {
    const files = await sources();
    const caller = files.find(
      (file) => !isGeneratedUiPrimitive(file.relPath) && TOAST_CALL.test(file.text),
    );

    if (caller === undefined) {
      return result.notApplicable();
    }

    const runtime = TOAST_DEPENDENCIES.find(
      (dependency) => discovery.dependencies[dependency] !== undefined,
    );

    if (runtime !== undefined) {
      return result.pass();
    }

    return result.fail([
      {
        message: 'toast() is called but no toast runtime is installed.',
        evidence: [{ path: caller.relPath, line: lineOf(caller.text, TOAST_CALL) }],
        remediation:
          'Install a toast runtime (shadcn-vue ships the Sonner block backed by vue-sonner) and mount its provider in the app shell.',
      },
    ]);
  },
};
