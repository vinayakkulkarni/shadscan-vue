import type { AnalyticsEvent, AnalyticsEventProperties, AnalyticsHandles } from '~/types/analytics';

/**
 * Fans one product event out to every tracker that is loaded. Kept free of
 * Nuxt runtime calls so it can be unit-tested with plain handles.
 */
export function createAnalytics(handles: AnalyticsHandles) {
  const { ga, plausible, openpanel } = handles;

  function track<E extends AnalyticsEvent>(event: E, properties: AnalyticsEventProperties<E>) {
    const props: Record<string, unknown> = { ...properties };
    ga?.gtag('event', event, props);
    plausible?.plausible(event, { props });
    openpanel?.track(event, props);
  }

  function identify(userId: string, traits: Record<string, unknown> = {}) {
    ga?.gtag('set', 'user_properties', { user_id: userId, ...traits });
  }

  return {
    isEnabled: Boolean(ga || plausible || openpanel),
    track,
    identify,
  };
}
