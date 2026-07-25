import { SITE_PAGES, siteOrigin } from '~~/server/utils/site-pages';

export default defineEventHandler((event) => {
  const origin = siteOrigin();
  const lastmod = new Date().toISOString().slice(0, 10);

  const urls = SITE_PAGES.map((page) =>
    [
      '  <url>',
      `    <loc>${origin}${page.path === '/' ? '/' : page.path}</loc>`,
      `    <lastmod>${lastmod}</lastmod>`,
      `    <priority>${page.path === '/' ? '1.0' : '0.8'}</priority>`,
      '  </url>',
    ].join('\n'),
  ).join('\n');

  setResponseHeader(event, 'Content-Type', 'application/xml; charset=utf-8');
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
});
