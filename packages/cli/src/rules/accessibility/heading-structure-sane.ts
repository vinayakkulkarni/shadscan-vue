import type { AuditRule } from '../../audit.js';
import { elementLine } from '../../parse/sfc.js';
import type { Finding } from '../rule-result.js';
import { forEachElement } from './a11y-shared.js';

const HEADING_TAG = /^h([1-6])$/u;

const isRoutableSurface = (relPath: string): boolean =>
  relPath.startsWith('pages/') ||
  relPath.startsWith('app/pages/') ||
  relPath.startsWith('src/views/') ||
  relPath.startsWith('layouts/') ||
  relPath.startsWith('app/layouts/') ||
  relPath === 'app.vue' ||
  relPath === 'app/app.vue' ||
  relPath === 'App.vue' ||
  relPath === 'src/App.vue';

export const headingStructureSane: AuditRule = {
  id: 'heading-structure-sane',
  title: 'Heading levels form a coherent outline',
  description:
    'Screen reader users navigate by heading level. A page with no level-one heading, or one that skips levels, produces an outline that cannot be scanned reliably.',
  category: 'accessibility',
  severity: 'warning',
  confidence: 'medium',
  maxScore: 3,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const perFile = new Map<string, { level: number; line: number }[]>();

    forEachElement(files, (element, file) => {
      const match = HEADING_TAG.exec(element.tag);
      if (match === null) {
        return;
      }
      const entries = perFile.get(file.relPath) ?? [];
      entries.push({ level: Number(match[1]), line: elementLine(element) });
      perFile.set(file.relPath, entries);
    });

    if (perFile.size === 0) {
      return result.notApplicable();
    }

    const findings: Finding[] = [];
    for (const [relPath, headings] of perFile) {
      const first = headings[0]!;
      if (isRoutableSurface(relPath) && !headings.some((heading) => heading.level === 1)) {
        findings.push({
          message: `Routable surface starts at <h${first.level}> with no <h1>.`,
          evidence: [{ path: relPath, line: first.line }],
          remediation: 'Give each routable surface exactly one h1 that names the page.',
        });
      }
      for (let index = 1; index < headings.length; index += 1) {
        const previous = headings[index - 1]!;
        const current = headings[index]!;
        if (current.level - previous.level >= 2) {
          findings.push({
            message: `Heading level jumps from h${previous.level} to h${current.level}.`,
            evidence: [{ path: relPath, line: current.line }],
            remediation: 'Step heading levels one at a time so the document outline stays intact.',
          });
        }
      }
    }

    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
