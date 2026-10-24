import type { PlausibleFn } from '~/types/analytics';
import { isAutomationBrowser } from '~/utils/automation-browser';

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig();
  const scriptId = config.public.plausibleScriptId;
  const apiHost = config.public.plausibleApiHost;

  if (!scriptId || !apiHost) return;

  // Automation browsers get no analytics — see utils/automation-browser.ts.
  if (isAutomationBrowser()) return;

  // The pa-*.js tracker only boots if `window.plausible.o` is already set when
  // it loads (its tail runs `plausible.o && S(plausible.o)`). So this is
  // Plausible's official snippet: define the queue stub and call init() to set
  // `.o` BEFORE the async script arrives. Loading from apiHost directly also
  // lets the script derive its `/api/event` endpoint. `@nuxtjs/plausible` and
  // the `@nuxt/scripts` helper never boot this script.
  const w = window as unknown as { plausible?: PlausibleFn };
  const stub: PlausibleFn =
    w.plausible ??
    ((...args: unknown[]) => {
      (stub.q ||= []).push(args);
    });
  stub.init ||= (options?: Record<string, unknown>) => {
    stub.o = options || {};
  };
  stub.init({
    autoCapturePageviews: true,
    captureOnLocalhost: import.meta.dev,
  });
  w.plausible = stub;

  useHead({
    script: [{ src: `${apiHost}/js/pa-${scriptId}.js`, async: true }],
  });

  const plausible = (...args: unknown[]) => {
    w.plausible?.(...args);
  };

  return {
    provide: {
      plausible: { plausible },
    },
  };
});
