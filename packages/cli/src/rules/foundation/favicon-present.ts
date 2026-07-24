import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { AuditRule } from '../../audit.js';
import type { ParsedFile } from '../../parse/project-files.js';

const NUXT_CONFIG_PATTERN = /^nuxt\.config\.[cm]?[jt]s$/u;

/** `<link rel="icon" ...>` in any order of attributes. */
const LINK_ICON_PATTERN = /<link\b[^>]*\brel=["'][^"']*\bicon\b[^"']*["'][^>]*>/iu;

/** `{ rel: 'icon', ... }` link entry inside a Nuxt head config. */
const NUXT_LINK_ICON_PATTERN = /rel\s*:\s*['"][^'"]*\bicon\b[^'"]*['"]/u;

const PUBLIC_FILE_CANDIDATES = ['favicon.ico', 'favicon.svg', 'favicon.png'];

const publicFaviconExists = async (rootDir: string): Promise<boolean> => {
  const publicDir = path.join(rootDir, 'public');
  for (const candidate of PUBLIC_FILE_CANDIDATES) {
    try {
      const stat = await fs.stat(path.join(publicDir, candidate));
      if (stat.isFile()) {
        return true;
      }
    } catch {
      // Missing candidate; keep checking.
    }
  }
  try {
    const entries = await fs.readdir(publicDir);
    if (entries.some((entry) => entry.startsWith('icon'))) {
      return true;
    }
  } catch {
    // No public directory.
  }
  return false;
};

const sourceFaviconLink = (files: readonly ParsedFile[]): boolean => {
  for (const file of files) {
    if (file.kind === 'html' && LINK_ICON_PATTERN.test(file.text)) {
      return true;
    }
    if (NUXT_CONFIG_PATTERN.test(file.relPath) && NUXT_LINK_ICON_PATTERN.test(file.text)) {
      return true;
    }
  }
  return false;
};

export const faviconPresent: AuditRule = {
  id: 'favicon-present',
  title: 'A favicon is present',
  description:
    'Confirms the app ships a favicon: a public/favicon or icon asset, or an explicit icon <link> in index.html or the Nuxt head config.',
  category: 'foundation',
  severity: 'info',
  confidence: 'high',
  maxScore: 2,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ discovery, sources, result }) => {
    if (await publicFaviconExists(discovery.rootDir)) {
      return result.pass();
    }

    const files = await sources();
    if (sourceFaviconLink(files)) {
      return result.pass();
    }

    return result.fail([
      {
        message: 'No favicon asset or icon link was found.',
        evidence: [{ path: 'public/favicon.ico' }],
        remediation:
          'Add a public/favicon.ico (or favicon.svg/png), or declare a `<link rel="icon">` in index.html or the Nuxt head config.',
      },
    ]);
  },
};
