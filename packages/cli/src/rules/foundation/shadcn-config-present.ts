import type { AuditRule } from '../../audit.js';

export const shadcnConfigPresent: AuditRule = {
  id: 'shadcn-config-present',
  title: 'shadcn configuration is present',
  description:
    'Checks that a components.json file exists at the project root and parses cleanly, so shadcn-vue tooling and alias-aware audits can work.',
  category: 'foundation',
  severity: 'warning',
  confidence: 'high',
  maxScore: 4,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: ({ discovery, result }) => {
    if (discovery.shadcn.configPresent) {
      return result.pass();
    }
    return result.fail([
      {
        message: 'components.json was not found or could not be parsed.',
        evidence: [{ path: 'components.json' }],
        remediation:
          'Run `pnpm dlx shadcn-vue@latest init` to create components.json, or restore a valid JSON config at the project root.',
      },
    ]);
  },
};
