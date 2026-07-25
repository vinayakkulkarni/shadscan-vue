import { SITE_PAGES, siteOrigin } from '~~/server/utils/site-pages';

export default defineEventHandler((event) => {
  const origin = siteOrigin();

  const body = [
    '# shadscan-vue',
    '',
    '> A static auditor for shadcn-vue and shadcn-nuxt applications. It reads your source and reports the UI fundamentals that are missing: theming, keyboard interaction, loading and empty states, accessibility, form labelling, and production polish. It never starts your app, never edits a file, never calls a model, and never uploads your source.',
    '',
    '## Docs',
    '',
    ...SITE_PAGES.map((page) => `- [${page.title}](${origin}${page.path}): ${page.summary}`),
    '',
    '## Install',
    '',
    '- [npm package](https://www.npmjs.com/package/shadscan-vue): `npx shadscan-vue`',
    '- [Source](https://github.com/vinayakkulkarni/shadscan-vue): MIT licensed, ported from TheOrcDev/shadscan with permission.',
    '',
    '## Optional',
    '',
    `- [Full content](${origin}/llms-full.txt): every page as plain text in one request.`,
    '',
  ].join('\n');

  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8');
  return body;
});
