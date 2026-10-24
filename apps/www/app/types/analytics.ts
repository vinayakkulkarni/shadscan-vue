/**
 * Closed set of product events. Every tracker (Plausible, OpenPanel, GA4)
 * receives the same name, so dashboards stay comparable across tools.
 */
export type AnalyticsEvent = 'install_command_copied' | 'outbound_click' | 'cta_click';

/** Where on the site an interaction happened. */
export type AnalyticsLocation =
  | 'home_hero'
  | 'home_credit'
  | 'docs_install'
  | 'header'
  | 'footer'
  | 'credits';

/** External destinations the site links out to. */
export type OutboundTarget = 'github' | 'npm' | 'shadscan_original' | 'theorcdev';

/** Internal call-to-action destinations. */
export type CtaTarget = 'rules' | 'docs' | 'credits';

export interface AnalyticsEventPropertyMap {
  install_command_copied: { command: string; location: AnalyticsLocation };
  outbound_click: { target: OutboundTarget; location: AnalyticsLocation };
  cta_click: { target: CtaTarget; location: AnalyticsLocation };
}

export type AnalyticsEventProperties<E extends AnalyticsEvent> = AnalyticsEventPropertyMap[E];

// Shape of the Plausible `pa-*.js` global: callable, plus the loader's
// bookkeeping — q (pre-load queue), o (init options the loader boots from), init.
export interface PlausibleFn {
  (...args: unknown[]): void;
  q?: unknown[];
  o?: Record<string, unknown>;
  init?: (options?: Record<string, unknown>) => void;
}

/** Minimal shape of the GA4 gtag handle exposed on the Nuxt app instance. */
export interface GtagHandle {
  gtag: (...args: unknown[]) => void;
}

/** Minimal shape of the Plausible handle exposed on the Nuxt app instance. */
export interface PlausibleHandle {
  plausible: (...args: unknown[]) => void;
}

/** Minimal shape of the OpenPanel client exposed by `@openpanel/nuxt`. */
export interface OpenPanelHandle {
  track: (name: string, properties?: Record<string, unknown>) => unknown;
}

export interface AnalyticsHandles {
  ga?: GtagHandle;
  plausible?: PlausibleHandle;
  openpanel?: OpenPanelHandle;
}
