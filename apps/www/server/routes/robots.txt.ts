import { siteOrigin } from '~~/server/utils/site-pages';

// Google-Extended and Applebot-Extended are conservative: they only index when
// explicitly allowed, and they are separate from the regular search crawlers.
// Without an explicit Allow the site is invisible to Google AI Overviews and
// Apple Intelligence while still being crawled by GPTBot and PerplexityBot.
const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'meta-externalagent',
  'Bytespider',
  'CCBot',
];

export default defineEventHandler((event) => {
  const origin = siteOrigin();
  const body = [
    'User-agent: *',
    'Allow: /',
    '',
    ...AI_CRAWLERS.flatMap((agent) => [`User-agent: ${agent}`, 'Allow: /', '']),
    `Sitemap: ${origin}/sitemap.xml`,
    '',
  ].join('\n');

  setResponseHeader(event, 'Content-Type', 'text/plain; charset=utf-8');
  return body;
});
