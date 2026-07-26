import type { AuditRule } from '../../audit.js';
import { isGeneratedUiPrimitive } from '../generated-ui.js';
import type { Finding } from '../rule-result.js';

/**
 * `error.statusMessage` is Nuxt's static field on a full-page error view, not
 * a status update pushed into an already-rendered page, so the leading
 * boundary excludes a property access.
 */
const DYNAMIC_STATUS_PATTERN =
  /(?<![.\w])(?:statusMessage|successMessage|errorMessage|progressMessage|setStatus|setMessage)\b|(?<![.\w])(?:pending|isPending|isLoading|loading)\s*\?/u;

const ANNOUNCEMENT_PATTERN =
  /role\s*=\s*["'](?:status|alert)["']|aria-live\s*=|<(?:Toaster|ToastProvider|Sonner)\b|\btoast(?:\.|\s*\()/u;

const lineOf = (text: string, pattern: RegExp): number => {
  const index = text.search(pattern);
  if (index < 0) {
    return 1;
  }
  return text.slice(0, index).split('\n').length;
};

export const statusMessagesAnnounced: AuditRule = {
  id: 'status-messages-announced',
  title: 'Status messages are announced',
  description:
    'Dynamic status messages should reach assistive technology through a live region or an accessible toast channel, otherwise a sighted user sees the update and a screen reader user does not.',
  category: 'accessibility',
  severity: 'warning',
  confidence: 'medium',
  maxScore: 3,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const candidates = files.filter(
      (file) =>
        file.kind === 'vue' &&
        !isGeneratedUiPrimitive(file.relPath) &&
        DYNAMIC_STATUS_PATTERN.test(file.text),
    );

    if (candidates.length === 0) {
      return result.notApplicable();
    }

    const findings: Finding[] = [];
    for (const file of candidates) {
      if (ANNOUNCEMENT_PATTERN.test(file.text)) {
        continue;
      }
      findings.push({
        message: 'A dynamic status message has no live region or accessible toast channel.',
        evidence: [{ path: file.relPath, line: lineOf(file.text, DYNAMIC_STATUS_PATTERN) }],
        remediation:
          'Render the update inside role="status" or role="alert" (or an aria-live region), or deliver it through a mounted toast provider.',
      });
    }

    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
