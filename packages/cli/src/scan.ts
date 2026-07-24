import { runAudit, type AuditCategoryId, type AuditReport } from './audit.js';
import { discoverProject, type ProjectDiscovery } from './discovery.js';
import type { CollectedSources } from './rules/source-files.js';
import { defaultRules } from './rules/index.js';

export const RULESET_VERSION = '0.1.0';

export interface ScanResult {
  discovery: ProjectDiscovery;
  report: AuditReport & { collected: CollectedSources };
}

export interface ScanOptions {
  category?: AuditCategoryId;
}

export const scanProject = async (
  inputPath: string,
  options: ScanOptions = {},
): Promise<ScanResult> => {
  const discovery = await discoverProject(inputPath);
  const report = await runAudit(discovery, defaultRules, options);
  return { discovery, report };
};
