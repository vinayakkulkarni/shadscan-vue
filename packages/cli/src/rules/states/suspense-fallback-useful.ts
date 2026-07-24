import type { AuditRule } from '../../audit.js';
import type { Finding } from '../rule-result.js';
import {
  collectTemplateElements,
  hasRenderableContent,
  isFallbackSlot,
  isSuspenseTag,
} from './states-shared.js';

export const suspenseFallbackUseful: AuditRule = {
  id: 'suspense-fallback-useful',
  title: 'Suspense boundaries provide a useful fallback',
  description:
    'Every <Suspense> element must declare a #fallback template slot containing non-empty content, so users see a real loading affordance while async setup resolves.',
  category: 'states',
  severity: 'warning',
  confidence: 'high',
  maxScore: 3,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const elements = collectTemplateElements(files);

    const suspenseElements = elements.filter(({ element }) => isSuspenseTag(element.tag));
    if (suspenseElements.length === 0) {
      return result.notApplicable();
    }

    const failures: Finding[] = [];
    for (const { file, element, line } of suspenseElements) {
      const fallbackSlots = element.children.filter(
        (child) => child.type === 1 && isFallbackSlot(child),
      );
      const usefulFallback = fallbackSlots.some(
        (slot) => slot.type === 1 && hasRenderableContent(slot),
      );
      if (!usefulFallback) {
        failures.push({
          message: 'Suspense boundary has no useful fallback.',
          evidence: [{ path: file.relPath, line }],
          remediation:
            'Add a <template #fallback> slot with a spinner, skeleton, or loading message inside the <Suspense>.',
        });
      }
    }

    if (failures.length > 0) {
      return result.fail(failures);
    }
    return result.pass();
  },
};
