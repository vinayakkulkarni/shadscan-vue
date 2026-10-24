import { describe, expect, it, vi } from 'vitest';
import { createAnalytics } from '../app/utils/analytics-fanout';
import { isAutomationBrowser } from '../app/utils/automation-browser';

const makeHandles = () => ({
  ga: { gtag: vi.fn() },
  plausible: { plausible: vi.fn() },
  openpanel: { track: vi.fn() },
});

describe('createAnalytics', () => {
  it('sends one track() call to Plausible, OpenPanel and GA4', () => {
    const handles = makeHandles();
    const analytics = createAnalytics(handles);

    analytics.track('install_command_copied', {
      command: 'npx shadscan-vue',
      location: 'home_hero',
    });

    const props = { command: 'npx shadscan-vue', location: 'home_hero' };
    expect(handles.ga.gtag).toHaveBeenCalledOnce();
    expect(handles.ga.gtag).toHaveBeenCalledWith('event', 'install_command_copied', props);
    expect(handles.plausible.plausible).toHaveBeenCalledOnce();
    expect(handles.plausible.plausible).toHaveBeenCalledWith('install_command_copied', { props });
    expect(handles.openpanel.track).toHaveBeenCalledOnce();
    expect(handles.openpanel.track).toHaveBeenCalledWith('install_command_copied', props);
    expect(analytics.isEnabled).toBe(true);
  });

  it('skips trackers that are not loaded', () => {
    const { openpanel } = makeHandles();
    const analytics = createAnalytics({ openpanel });

    analytics.track('outbound_click', { target: 'github', location: 'header' });

    expect(openpanel.track).toHaveBeenCalledWith('outbound_click', {
      target: 'github',
      location: 'header',
    });
  });

  it('is a no-op with no trackers (SSR, automation browsers)', () => {
    const analytics = createAnalytics({});
    expect(analytics.isEnabled).toBe(false);
    expect(() =>
      analytics.track('cta_click', { target: 'rules', location: 'home_hero' }),
    ).not.toThrow();
  });
});

describe('isAutomationBrowser', () => {
  it('returns false outside the client bundle', () => {
    expect(isAutomationBrowser()).toBe(false);
  });
});
