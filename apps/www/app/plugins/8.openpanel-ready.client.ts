import { isAutomationBrowser } from '~/utils/automation-browser';

/**
 * `@openpanel/nuxt` boots with `disabled: true`, so the SDK queues every event
 * in memory. Real users release the queue here; automation browsers never do,
 * so they send nothing — the same gate the Plausible and GA4 plugins apply.
 */
export default defineNuxtPlugin({
  name: 'openpanel-ready',
  dependsOn: ['openpanel'],
  setup(nuxtApp) {
    if (isAutomationBrowser()) return;
    nuxtApp.$openpanel.ready();
  },
});
