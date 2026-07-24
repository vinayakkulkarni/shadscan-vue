import type { AuditRule } from '../../audit.js';
import type { ParsedFile } from '../../parse/project-files.js';
import type { StyleFile } from '../source-files.js';
import { elementLine, findAttribute, walkTemplate } from '../../parse/sfc.js';
import type { Finding } from '../rule-result.js';

/**
 * Flags focus outlines that are removed without a visible replacement. In
 * templates, a `outline-none` class must be paired with a `focus-visible:`/
 * `focus:` ring/outline/border utility in the same class list. In CSS, an
 * `outline: none` rule must be paired with a `:focus-visible` block that
 * restores a visible indicator. Generated primitives under `components/ui/`
 * are excluded because they manage focus themselves.
 */

const OUTLINE_NONE_CLASS_PATTERN = /\boutline-none\b/u;
const FOCUS_REPLACEMENT_CLASS_PATTERN = /\bfocus(?:-visible)?:(?:ring|outline|border)[\w-]*\b/u;

const isExcludedPath = (relPath: string): boolean => /(?:^|\/)components\/ui\//u.test(relPath);

const CSS_OUTLINE_NONE_PATTERN = /outline\s*:\s*none/giu;
const FOCUS_VISIBLE_RULE_PATTERN =
  /:focus(?:-visible)?\b[^{]*\{[^}]*(?:outline|box-shadow|border|ring)[^}]*\}/u;

const lineOf = (text: string, index: number): number => text.slice(0, index).split('\n').length;

const scanTemplate = (file: ParsedFile): Finding[] => {
  if (file.kind !== 'vue' || file.sfc?.templateAst === undefined) {
    return [];
  }
  const findings: Finding[] = [];
  walkTemplate(file.sfc.templateAst, (element) => {
    const classAttr = findAttribute(element, 'class');
    const classes = classAttr?.static;
    if (classes === undefined || !OUTLINE_NONE_CLASS_PATTERN.test(classes)) {
      return;
    }
    if (FOCUS_REPLACEMENT_CLASS_PATTERN.test(classes)) {
      return;
    }
    findings.push({
      message: `<${element.tag}> removes the focus outline without a focus-visible replacement in the same class list.`,
      evidence: [{ path: file.relPath, line: elementLine(element) }],
      remediation:
        'Pair `outline-none` with a `focus-visible:ring-*`/`focus-visible:outline-*` utility so keyboard focus stays visible.',
    });
  });
  return findings;
};

const scanStyle = (style: StyleFile): Finding[] => {
  const findings: Finding[] = [];
  const hasVisibleFocusRule = FOCUS_VISIBLE_RULE_PATTERN.test(style.text);
  for (const match of style.text.matchAll(CSS_OUTLINE_NONE_PATTERN)) {
    if (hasVisibleFocusRule) {
      continue;
    }
    findings.push({
      message: `A CSS rule in ${style.relPath} sets \`outline: none\` without a visible :focus-visible replacement.`,
      evidence: [{ path: style.relPath, line: lineOf(style.text, match.index) }],
      remediation:
        'Add a `:focus-visible` rule that restores a visible outline, box-shadow, or border.',
    });
  }
  return findings;
};

export const focusVisibleNotSuppressed: AuditRule = {
  id: 'focus-visible-not-suppressed',
  title: 'Focus outlines are not suppressed',
  description:
    'Removing the focus outline without a visible replacement makes keyboard navigation invisible. Every `outline-none`/`outline: none` must be paired with a focus-visible indicator.',
  category: 'interaction',
  severity: 'error',
  confidence: 'medium',
  maxScore: 3,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, styles, result }) => {
    const files = await sources();
    const styleFiles = await styles();
    const failures: Finding[] = [];

    for (const file of files) {
      if (isExcludedPath(file.relPath)) {
        continue;
      }
      failures.push(...scanTemplate(file));
    }
    for (const style of styleFiles) {
      if (isExcludedPath(style.relPath)) {
        continue;
      }
      failures.push(...scanStyle(style));
    }

    if (failures.length > 0) {
      return result.fail(failures);
    }
    return result.pass();
  },
};
