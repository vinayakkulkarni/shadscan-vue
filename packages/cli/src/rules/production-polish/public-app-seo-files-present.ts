import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { AuditRule } from '../../audit.js';
import type { Finding } from '../rule-result.js';

const PUBLIC_DIRS = ['public', 'static'];

const findInPublic = async (rootDir: string, matcher: RegExp): Promise<string | undefined> => {
  for (const dir of PUBLIC_DIRS) {
    let entries: string[];
    try {
      entries = await fs.readdir(path.join(rootDir, dir));
    } catch {
      continue;
    }
    const hit = entries.find((entry) => matcher.test(entry));
    if (hit !== undefined) {
      return `${dir}/${hit}`;
    }
  }
  return undefined;
};

export const publicAppSeoFilesPresent: AuditRule = {
  id: 'public-app-seo-files-present',
  title: 'Crawler and indexing files are published',
  description:
    'Checks that robots.txt and a sitemap are served, either as static files or through a framework module that generates them.',
  category: 'production-polish',
  severity: 'info',
  confidence: 'high',
  maxScore: 2,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ discovery, sources, result }) => {
    const files = await sources();
    const findings: Finding[] = [];

    const robotsModule =
      discovery.dependencies['@nuxtjs/robots'] !== undefined ||
      files.some((file) => /robots/iu.test(file.relPath) && file.relPath.startsWith('server/'));
    const sitemapModule =
      discovery.dependencies['@nuxtjs/sitemap'] !== undefined ||
      discovery.dependencies['vite-plugin-sitemap'] !== undefined ||
      discovery.dependencies['sitemap'] !== undefined;

    const robotsFile = await findInPublic(discovery.rootDir, /^robots\.txt$/iu);
    if (robotsFile === undefined && !robotsModule) {
      findings.push({
        message: 'No robots.txt is published and no robots module generates one.',
        evidence: [{ path: 'public/robots.txt' }],
        remediation: 'Add public/robots.txt, or install a robots module that generates it.',
      });
    }

    const sitemapFile = await findInPublic(discovery.rootDir, /^sitemap.*\.xml$/iu);
    if (sitemapFile === undefined && !sitemapModule) {
      findings.push({
        message: 'No sitemap is published and no sitemap module generates one.',
        evidence: [{ path: 'public/sitemap.xml' }],
        remediation: 'Add public/sitemap.xml, or install a sitemap module that generates it.',
      });
    }

    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
