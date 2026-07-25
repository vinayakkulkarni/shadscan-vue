export interface SitePage {
  path: string;
  title: string;
  summary: string;
}

export const SITE_PAGES: SitePage[] = [
  {
    path: '/',
    title: 'shadscan-vue',
    summary:
      'Static auditor for shadcn-vue and shadcn-nuxt applications. 52 deterministic rules across six weighted categories, with file and line evidence on every finding.',
  },
  {
    path: '/rules',
    title: 'Rule catalog',
    summary:
      'Every rule the scanner ships, grouped by category, with the severity and the remediation each one reports.',
  },
  {
    path: '/docs',
    title: 'Documentation',
    summary:
      'Installation, output formats, CI gating with --fail-under, category filtering, and the agent-ready prompt output.',
  },
  {
    path: '/changelog',
    title: 'Changelog',
    summary: 'Release history, generated from conventional commits by release-please.',
  },
  {
    path: '/credits',
    title: 'Credits',
    summary:
      'shadscan-vue is a Vue and Nuxt port of shadscan by TheOrcDev, built with the original author permission and under the MIT license.',
  },
];

export const siteOrigin = (): string =>
  (useRuntimeConfig().public.siteUrl as string).replace(/\/$/, '');
