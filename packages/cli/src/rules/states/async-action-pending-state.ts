import { NodeTypes } from '@vue/compiler-dom';
import type { AuditRule } from '../../audit.js';
import { collectTemplateElements } from './states-shared.js';

const ASYNC_SUBMIT = /(?:async\s+(?:function\s+)?\w*\s*\(|await\s)/u;
const PENDING_BINDING = /(?::disabled|:loading|v-if=["'][^"']*(?:pending|loading|isSubmitting))/u;
const VEE_SUBMITTING = /isSubmitting/u;

export const asyncActionPendingState: AuditRule = {
  id: 'async-action-pending-state',
  title: 'Async submissions show pending feedback',
  description:
    'A form that submits asynchronously without a pending state gives no feedback and allows duplicate submissions on repeated clicks.',
  category: 'states',
  severity: 'warning',
  confidence: 'medium',
  maxScore: 4,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const elements = collectTemplateElements(files);

    const formFiles = new Set(
      elements.filter((entry) => entry.element.tag === 'form').map((entry) => entry.file.relPath),
    );
    if (formFiles.size === 0) {
      return result.notApplicable();
    }

    const findings = [];
    for (const relPath of formFiles) {
      const file = files.find((candidate) => candidate.relPath === relPath);
      if (file === undefined) {
        continue;
      }
      const submitHandlers = elements.filter(
        (entry) =>
          entry.file.relPath === relPath &&
          entry.element.tag === 'form' &&
          entry.element.props.some(
            (prop) =>
              prop.type === NodeTypes.DIRECTIVE &&
              prop.name === 'on' &&
              prop.arg !== undefined &&
              prop.arg.type === NodeTypes.SIMPLE_EXPRESSION &&
              prop.arg.content === 'submit',
          ),
      );
      if (submitHandlers.length === 0) {
        continue;
      }
      if (!ASYNC_SUBMIT.test(file.text)) {
        continue;
      }
      if (PENDING_BINDING.test(file.text) || VEE_SUBMITTING.test(file.text)) {
        continue;
      }
      findings.push({
        message:
          'Async action handling is missing visible pending feedback and duplicate-submit prevention.',
        evidence: [{ path: relPath, line: submitHandlers[0]!.line }],
        remediation:
          'Track a pending ref while the request is in flight and bind it to :disabled or a loading state on the submit control.',
      });
    }

    return findings.length > 0 ? result.fail(findings) : result.pass();
  },
};
