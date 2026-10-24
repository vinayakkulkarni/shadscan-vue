/**
 * Automation-browser detection for third-party beacon gating.
 *
 * Headless agent checkers wait for `networkidle` on a short budget, and every
 * analytics beacon adds an unbounded-latency request to that window. Bot
 * traffic also pollutes the dataset. Playwright Chromium and Firefox set
 * `navigator.webdriver` natively, so this is a reliable signal. Real users are
 * never gated.
 *
 * Callers that feed `useHead()` must gate the `useHead` call itself: during
 * SSR this helper is always `false`, so a value-level guard would still ship
 * the tag in the server-rendered HTML.
 */
export function isAutomationBrowser(): boolean {
  if (!import.meta.client) return false;
  return navigator.webdriver === true;
}
