import type { AuditRule } from '../../audit.js';
import type { ParsedFile } from '../../parse/project-files.js';
import type { ElementNode, TextNode } from '@vue/compiler-dom';
import { NodeTypes } from '@vue/compiler-dom';
import { elementLine, findAttribute, walkTemplate } from '../../parse/sfc.js';
import type { Finding } from '../rule-result.js';

/**
 * Advisory-only check (low confidence) that a destructive control — a
 * `variant="destructive"` control or a button whose text mentions
 * delete/remove/destroy — is correlated with a confirmation affordance in the
 * same file (an AlertDialog, a native `confirm(`, or a dialog with
 * cancel/confirm actions). Files with no destructive controls pass.
 */

const DESTRUCTIVE_TEXT_PATTERN = /\b(?:delete|remove|destroy)\b/iu;

const CONFIRMATION_PATTERNS: readonly RegExp[] = [
  /AlertDialog/u,
  /alert-dialog/u,
  /\bconfirm\s*\(/u,
  /useConfirm|useDialog/u,
];

const CANCEL_CONFIRM_PATTERN = /\bcancel\b/iu;

const textContentOf = (element: ElementNode): string =>
  element.children
    .filter((child): child is TextNode => child.type === NodeTypes.TEXT)
    .map((child) => child.content)
    .join(' ');

interface Detection {
  found: boolean;
  line?: number;
}

const detectDestructive = (file: ParsedFile): Detection => {
  if (file.kind !== 'vue' || file.sfc?.templateAst === undefined) {
    return { found: false };
  }
  let found = false;
  let line: number | undefined;
  walkTemplate(file.sfc.templateAst, (element) => {
    if (found) {
      return;
    }
    const variant = findAttribute(element, 'variant');
    const isDestructiveVariant = variant?.static === 'destructive';
    const text = textContentOf(element);
    const isDestructiveText = DESTRUCTIVE_TEXT_PATTERN.test(text);
    if (isDestructiveVariant || isDestructiveText) {
      found = true;
      line = elementLine(element);
    }
  });
  return { found, line };
};

const hasConfirmation = (file: ParsedFile): boolean => {
  const text = file.text;
  if (CONFIRMATION_PATTERNS.some((pattern) => pattern.test(text))) {
    return true;
  }
  // A dialog with a cancel affordance counts as confirmation evidence.
  return /Dialog/u.test(text) && CANCEL_CONFIRM_PATTERN.test(text);
};

export const destructiveActionsConfirmed: AuditRule = {
  id: 'destructive-actions-confirmed',
  title: 'Destructive actions are confirmed',
  description:
    'Destructive controls should be paired with a confirmation or undo affordance so users do not lose data by accident. This advisory flags destructive controls with no correlated confirmation in the same file.',
  category: 'interaction',
  severity: 'warning',
  confidence: 'low',
  maxScore: 0,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const advisories: Finding[] = [];

    for (const file of files) {
      const detection = detectDestructive(file);
      if (!detection.found) {
        continue;
      }
      if (hasConfirmation(file)) {
        continue;
      }
      advisories.push({
        message: 'A destructive action was found without correlated confirmation or undo evidence.',
        evidence: [{ path: file.relPath, line: detection.line }],
        remediation:
          'Wrap the destructive control in an AlertDialog (or equivalent confirm step), or provide an undo affordance after the action.',
      });
    }

    if (advisories.length > 0) {
      return result.advisory(advisories);
    }
    return result.pass();
  },
};
