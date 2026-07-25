import catalog from '~/data/rules.json';
import { trackOpenPanelEvent } from '~~/server/utils/openpanel';
import { SITE_PAGES, siteOrigin } from '~~/server/utils/site-pages';

interface CatalogRule {
  id: string;
  title: string;
  description: string;
  severity: string;
  points: number;
}

interface CatalogCategory {
  id: string;
  title: string;
  weight: number;
  totalPoints: number;
  rules: CatalogRule[];
}

interface Catalog {
  ruleCount: number;
  rulesetVersion: string;
  categories: CatalogCategory[];
}

export default defineEventHandler((event) => {
  const origin = siteOrigin();
  const data: Catalog = catalog;

  trackOpenPanelEvent(event, 'llms_full_txt_fetch', {
    userAgent: getHeader(event, 'user-agent') ?? 'unknown',
  }).catch(() => {});

  const overview = SITE_PAGES.map(
    (page) => `## ${page.title}\n\nURL: ${origin}${page.path}\n\n${page.summary}`,
  ).join('\n\n');

  const rules = data.categories
    .map((category) =>
      [
        `### ${category.title} (weight ${category.weight})`,
        '',
        ...category.rules.map(
          (rule) => `- ${rule.id} (${rule.severity}, ${rule.points} pts): ${rule.description}`,
        ),
      ].join('\n'),
    )
    .join('\n\n');

  const body = [
    '# shadscan-vue — full content',
    '',
    `Ruleset ${data.rulesetVersion} · ${data.ruleCount} rules across ${data.categories.length} categories.`,
    '',
    'shadscan-vue is a static auditor for shadcn-vue and shadcn-nuxt applications. It parses Vue single-file component templates and TypeScript sources, then reports missing UI fundamentals with file and line evidence. It is read-only: it never starts your app, edits a file, calls a model, or uploads your source.',
    '',
    overview,
    '',
    '## Rule catalog',
    '',
    rules,
    '',
  ].join('\n');

  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8');
  return body;
});
