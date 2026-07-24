import type { AuditRule } from '../../audit.js';
import {
  elementLine,
  findAttribute,
  hasSpreadBinding,
  tagMatchesComponent,
  walkTemplate,
} from '../../parse/sfc.js';
import type { Finding } from '../rule-result.js';

const IMAGE_TAGS = ['img'];
const IMAGE_COMPONENTS = ['NuxtImg', 'NuxtPicture'];

const HTML_IMG_PATTERN = /<img\b[^>]*>/giu;
const HTML_ALT_PATTERN = /\salt=["'][^"']*["']/iu;

export const imagesHaveAlt: AuditRule = {
  id: 'images-have-alt',
  title: 'Images have alternative text',
  description:
    'Native <img> elements and Nuxt image components must declare alternative text. Bound :alt values pass; missing or empty static alt fails.',
  category: 'accessibility',
  severity: 'error',
  confidence: 'high',
  maxScore: 4,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const failures: Finding[] = [];
    const advisories: Finding[] = [];

    for (const file of files) {
      if (file.kind === 'vue' && file.sfc?.templateAst !== undefined) {
        walkTemplate(file.sfc.templateAst, (element) => {
          const isNativeImg = IMAGE_TAGS.includes(element.tag);
          const isImageComponent = IMAGE_COMPONENTS.some((component) =>
            tagMatchesComponent(element.tag, component),
          );
          if (!isNativeImg && !isImageComponent) {
            return;
          }
          const alt = findAttribute(element, 'alt');
          if (alt !== undefined) {
            if (alt.bound) {
              return;
            }
            if (alt.static !== undefined && alt.static.trim().length > 0) {
              return;
            }
            failures.push({
              message: `<${element.tag}> declares an empty alt attribute. Use meaningful text, or alt="" only for purely decorative images with role="presentation".`,
              evidence: [{ path: file.relPath, line: elementLine(element) }],
              remediation: 'Describe the image content in the alt attribute.',
            });
            return;
          }
          if (hasSpreadBinding(element)) {
            advisories.push({
              message: `<${element.tag}> spreads bound attributes; alternative text could not be verified statically.`,
              evidence: [{ path: file.relPath, line: elementLine(element) }],
            });
            return;
          }
          failures.push({
            message: `<${element.tag}> is missing alternative text.`,
            evidence: [{ path: file.relPath, line: elementLine(element) }],
            remediation:
              'Add an alt attribute describing the image, or bind :alt to dynamic content.',
          });
        });
      } else if (file.kind === 'html') {
        const matches = file.text.matchAll(HTML_IMG_PATTERN);
        for (const match of matches) {
          if (!HTML_ALT_PATTERN.test(match[0])) {
            const line = file.text.slice(0, match.index).split('\n').length;
            failures.push({
              message: '<img> is missing alternative text.',
              evidence: [{ path: file.relPath, line }],
              remediation: 'Add an alt attribute describing the image.',
            });
          }
        }
      }
    }

    if (failures.length > 0) {
      return result.fail(failures);
    }
    if (advisories.length > 0) {
      return result.advisory(advisories);
    }
    return result.pass();
  },
};
