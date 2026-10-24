import type { GtagHandle, PlausibleHandle } from '~/types/analytics';
import { createAnalytics } from '~/utils/analytics-fanout';

/**
 * One `track()` for the whole site: every call reaches Plausible, OpenPanel
 * and GA4. Handles are absent during SSR and for automation browsers, in which
 * case the matching tracker is skipped.
 */
export function useAnalytics() {
  const nuxtApp = useNuxtApp();

  return createAnalytics({
    ga: nuxtApp.$ga as GtagHandle | undefined,
    plausible: nuxtApp.$plausible as PlausibleHandle | undefined,
    openpanel: import.meta.client ? nuxtApp.$openpanel : undefined,
  });
}
