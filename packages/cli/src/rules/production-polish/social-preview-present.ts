import type { AuditRule } from '../../audit.js';
import type { ParsedFile } from '../../parse/project-files.js';
import { isShellFile } from './polish-shared.js';

const OG_IMAGE_PATTERN = /(?:og:image|ogImage|twitter:image|twitterImage)/u;
const OG_TITLE_PATTERN = /(?:og:title|ogTitle|twitter:title|twitterCard|twitter:card)/u;

const isMetaSurface = (file: ParsedFile): boolean =>
  isShellFile(file.relPath) ||
  file.kind === 'html' ||
  /^(?:nuxt|app)\.config\.[cm]?[jt]s$/u.test(file.relPath) ||
  file.relPath.startsWith('pages/') ||
  file.relPath.startsWith('app/pages/');

export const socialPreviewPresent: AuditRule = {
  id: 'social-preview-present',
  title: 'Shared links render a social preview',
  description:
    'Checks for Open Graph or Twitter card metadata so links shared in chat apps and social feeds render a title and image instead of a bare URL.',
  category: 'production-polish',
  severity: 'info',
  confidence: 'high',
  maxScore: 2,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ discovery, sources, result }) => {
    const files = await sources();
    const surfaces = files.filter(isMetaSurface);

    const hasImage = surfaces.some((file) => OG_IMAGE_PATTERN.test(file.text));
    const hasTitle = surfaces.some((file) => OG_TITLE_PATTERN.test(file.text));
    const generatesOg =
      discovery.dependencies['nuxt-og-image'] !== undefined ||
      discovery.dependencies['@nuxtjs/seo'] !== undefined;

    if (generatesOg || (hasImage && hasTitle)) {
      return result.pass();
    }

    const missing: string[] = [];
    if (!hasTitle) {
      missing.push('an Open Graph or Twitter title');
    }
    if (!hasImage) {
      missing.push('a preview image');
    }

    return result.fail([
      {
        message: `Shared links have no social preview: ${missing.join(' and ')} is missing.`,
        evidence: [{ path: surfaces[0]?.relPath ?? 'app.vue' }],
        remediation:
          'Declare og:title, og:description and og:image (useSeoMeta in Nuxt, or <meta property="og:..."> tags), or install an SEO module that generates them.',
      },
    ]);
  },
};
