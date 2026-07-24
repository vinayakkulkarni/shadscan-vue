import type { AuditRule } from '../../audit.js';
import type { ParsedFile } from '../../parse/project-files.js';

const isNuxtErrorFile = (relPath: string): boolean =>
  relPath === 'error.vue' || relPath === 'app/error.vue';

const NUXT_ERROR_BOUNDARY_PATTERN = /<NuxtErrorBoundary\b|<nuxt-error-boundary\b/u;
const ON_ERROR_CAPTURED_PATTERN = /\bonErrorCaptured\s*\(/u;
const APP_ERROR_HANDLER_PATTERN = /\.config\.errorHandler\s*=/u;

const isMainEntry = (relPath: string): boolean => /(?:^|\/)main\.[cm]?[jt]s$/u.test(relPath);

const hasVueErrorBoundary = (files: readonly ParsedFile[]): boolean => {
  for (const file of files) {
    if (ON_ERROR_CAPTURED_PATTERN.test(file.text)) {
      return true;
    }
    if (isMainEntry(file.relPath) && APP_ERROR_HANDLER_PATTERN.test(file.text)) {
      return true;
    }
  }
  return false;
};

export const errorBoundaryPresent: AuditRule = {
  id: 'error-boundary-present',
  title: 'An error boundary is present',
  description:
    'Confirms runtime render errors are caught: a Nuxt error page or <NuxtErrorBoundary>, or a Vue onErrorCaptured hook / app.config.errorHandler in the entry.',
  category: 'foundation',
  severity: 'warning',
  confidence: 'high',
  maxScore: 3,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ discovery, sources, result }) => {
    const files = await sources();

    if (discovery.adapter === 'nuxt') {
      if (
        files.some((file) => isNuxtErrorFile(file.relPath)) ||
        files.some((file) => NUXT_ERROR_BOUNDARY_PATTERN.test(file.text))
      ) {
        return result.pass();
      }
      return result.fail([
        {
          message: 'No error boundary was found to catch render errors.',
          evidence: [{ path: 'error.vue' }],
          remediation:
            'Add an error.vue page, or wrap fallible UI in a <NuxtErrorBoundary> component.',
        },
      ]);
    }

    if (hasVueErrorBoundary(files)) {
      return result.pass();
    }
    return result.fail([
      {
        message: 'No error boundary was found to catch render errors.',
        evidence: [{ path: 'src/main.ts' }],
        remediation:
          'Add an `onErrorCaptured` hook to a boundary component, or set `app.config.errorHandler` in your entry file.',
      },
    ]);
  },
};
