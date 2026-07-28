export { run } from './cli.js';
export { scanProject, RULESET_VERSION, type ScanResult, type ScanOptions } from './scan.js';
export { discoverProject } from './discovery.js';
export type {
  AdapterId,
  PackageManagerId,
  ProjectDiscovery,
  ShadcnDiscovery,
} from './discovery.js';
export {
  CATEGORIES,
  gradeFor,
  runAudit,
  type AuditCategoryId,
  type AuditContext,
  type AuditReport,
  type AuditRule,
  type CategoryScore,
  type Confidence,
  type RuleOutcome,
  type Severity,
} from './audit.js';
export {
  advisory,
  fail,
  notApplicable,
  pass,
  type Evidence,
  type Finding,
  type RuleResult,
  type RuleStatus,
} from './rules/rule-result.js';
export { defaultRules } from './rules/index.js';
export { buildJsonReport, renderJson, JSON_SCHEMA_VERSION } from './render-json.js';
export { formatEngineLabel } from './engine-label.js';
export { renderHuman } from './render-human.js';
export { renderAgentPrompt, PROMPT_VERSION } from './render-agent-prompt.js';
export { CliError, isCliError, type CliErrorCode } from './cli-error.js';
