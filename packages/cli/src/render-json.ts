import type { ScanResult } from './scan.js';
import { RULESET_VERSION } from './scan.js';

export const JSON_SCHEMA_VERSION = 1;

export interface JsonReport {
  schemaVersion: number;
  engineVersion: string;
  rulesetVersion: string;
  score: number | null;
  maxScore: number;
  grade: string | null;
  framework: { adapter: string; packageName: string };
  packageManager: string;
  shadcn: {
    configPresent: boolean;
    confidence: string;
    style?: string;
    uiAlias?: string;
    nuxtModule: boolean;
  };
  coverage: {
    status: string;
    fileCount: number;
    warnings: string[];
  };
  categories: {
    id: string;
    title: string;
    weight: number;
    score: number | null;
    ruleCount: number;
  }[];
  findings: {
    id: string;
    title: string;
    category: string;
    severity: string;
    confidence: string;
    status: string;
    score: number;
    maxScore: number;
    impactsScore: boolean;
    message: string | null;
    evidence: { path: string; line?: number }[];
    remediation: string | null;
  }[];
  warnings: string[];
  durationMs: number;
}

export const buildJsonReport = (result: ScanResult, engineVersion: string): JsonReport => {
  const { discovery, report } = result;
  return {
    schemaVersion: JSON_SCHEMA_VERSION,
    engineVersion,
    rulesetVersion: RULESET_VERSION,
    score: report.score ?? null,
    maxScore: 100,
    grade: report.grade ?? null,
    framework: { adapter: discovery.adapter, packageName: discovery.packageName },
    packageManager: discovery.packageManager,
    shadcn: {
      configPresent: discovery.shadcn.configPresent,
      confidence: discovery.shadcn.confidence,
      style: discovery.shadcn.style,
      uiAlias: discovery.shadcn.uiAlias,
      nuxtModule: discovery.shadcn.nuxtModule,
    },
    coverage: {
      status: report.collected.coverage.status,
      fileCount: report.collected.coverage.fileCount,
      warnings: report.collected.coverage.warnings,
    },
    categories: report.categories.map((category) => ({
      id: category.id,
      title: category.title,
      weight: category.weight,
      score: category.score !== undefined ? Math.round(category.score) : null,
      ruleCount: category.ruleCount,
    })),
    findings: report.outcomes.map((outcome) => ({
      id: outcome.rule.id,
      title: outcome.rule.title,
      category: outcome.rule.category,
      severity: outcome.rule.severity,
      confidence: outcome.rule.confidence,
      status: outcome.status,
      score: outcome.score,
      maxScore: outcome.rule.maxScore,
      impactsScore: outcome.impactsScore,
      message: outcome.findings[0]?.message ?? null,
      evidence: outcome.findings.flatMap((finding) => finding.evidence),
      remediation: outcome.findings[0]?.remediation ?? null,
    })),
    warnings: report.warnings,
    durationMs: report.durationMs,
  };
};

export const renderJson = (result: ScanResult, engineVersion: string): string =>
  JSON.stringify(buildJsonReport(result, engineVersion), null, 2);
