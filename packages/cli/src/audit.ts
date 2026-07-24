import type { AdapterId, ProjectDiscovery } from './discovery.js';
import { parseProject, type ParsedFile, type ParsedProject } from './parse/project-files.js';
import type { CollectedSources, StyleFile } from './rules/source-files.js';
import {
  advisory,
  fail,
  notApplicable,
  pass,
  type Finding,
  type RuleResult,
  type RuleStatus,
} from './rules/rule-result.js';

export type AuditCategoryId =
  | 'foundation'
  | 'interaction'
  | 'states'
  | 'accessibility'
  | 'forms'
  | 'production-polish';

export type Severity = 'error' | 'warning' | 'info';
export type Confidence = 'high' | 'medium' | 'low';

export interface CategoryDefinition {
  id: AuditCategoryId;
  title: string;
  weight: number;
}

export const CATEGORIES: readonly CategoryDefinition[] = [
  { id: 'foundation', title: 'Foundation', weight: 20 },
  { id: 'interaction', title: 'Interaction', weight: 20 },
  { id: 'states', title: 'States', weight: 20 },
  { id: 'accessibility', title: 'Accessibility', weight: 20 },
  { id: 'forms', title: 'Forms and Data Entry', weight: 10 },
  { id: 'production-polish', title: 'Production Polish', weight: 10 },
];

export interface AuditContext {
  discovery: ProjectDiscovery;
  sources: () => Promise<ParsedFile[]>;
  styles: () => Promise<StyleFile[]>;
  /** Reserved for the Vue component render graph (later wave). */
  componentRenderGraph: () => never;
  helpers: {
    /**
     * True when a module specifier resolves to the project's shadcn ui
     * directory (`.../ui/<module>` or the configured ui alias).
     */
    isShadcnUiImport: (moduleSpecifier: string) => boolean;
  };
  result: {
    pass: typeof pass;
    fail: typeof fail;
    advisory: typeof advisory;
    notApplicable: typeof notApplicable;
  };
}

export interface AuditRule {
  id: string;
  title: string;
  description: string;
  category: AuditCategoryId;
  severity: Severity;
  confidence: Confidence;
  maxScore: number;
  adapters: readonly AdapterId[];
  run: (context: AuditContext) => Promise<RuleResult> | RuleResult;
}

export interface RuleOutcome {
  rule: AuditRule;
  status: RuleStatus;
  findings: Finding[];
  /** Points awarded (0 for fail; maxScore for pass/advisory). */
  score: number;
  impactsScore: boolean;
}

export interface CategoryScore {
  id: AuditCategoryId;
  title: string;
  weight: number;
  /** 0-100 within the category, or undefined when no applicable scored rules. */
  score?: number;
  rawScore: number;
  rawMax: number;
  ruleCount: number;
}

export interface AuditReport {
  score?: number;
  grade?: string;
  categories: CategoryScore[];
  outcomes: RuleOutcome[];
  warnings: string[];
  durationMs: number;
}

export const gradeFor = (score: number): string => {
  if (score >= 90) {
    return 'A';
  }
  if (score >= 80) {
    return 'B';
  }
  if (score >= 70) {
    return 'C';
  }
  if (score >= 60) {
    return 'D';
  }
  return 'F';
};

const buildContext = (
  discovery: ProjectDiscovery,
  parsed: () => Promise<ParsedProject>,
): AuditContext => {
  const uiAlias = discovery.shadcn.uiAlias;
  return {
    discovery,
    sources: async () => (await parsed()).files,
    styles: async () => (await parsed()).collected.styles,
    componentRenderGraph: () => {
      throw new Error('component render graph is not implemented yet');
    },
    helpers: {
      isShadcnUiImport: (moduleSpecifier: string): boolean => {
        if (/(?:^|\/)ui\/(?:components\/)?[\w-]+$/u.test(moduleSpecifier)) {
          return true;
        }
        if (uiAlias === undefined) {
          return false;
        }
        const normalized = uiAlias.endsWith('/') ? uiAlias.slice(0, -1) : uiAlias;
        return moduleSpecifier === normalized || moduleSpecifier.startsWith(`${normalized}/`);
      },
    },
    result: { pass, fail, advisory, notApplicable },
  };
};

export interface RunAuditOptions {
  category?: AuditCategoryId;
}

export const runAudit = async (
  discovery: ProjectDiscovery,
  rules: readonly AuditRule[],
  options: RunAuditOptions = {},
): Promise<AuditReport & { collected: CollectedSources }> => {
  const startedAt = performance.now();
  let parsedPromise: Promise<ParsedProject> | undefined;
  const parsed = (): Promise<ParsedProject> => {
    parsedPromise ??= parseProject(discovery);
    return parsedPromise;
  };
  const context = buildContext(discovery, parsed);
  const warnings: string[] = [...discovery.warnings];

  const applicable = rules.filter(
    (rule) =>
      rule.adapters.includes(discovery.adapter) &&
      (options.category === undefined || rule.category === options.category),
  );

  const outcomes: RuleOutcome[] = [];
  for (const rule of applicable) {
    let result: RuleResult;
    try {
      result = await rule.run(context);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      warnings.push(`Rule ${rule.id} failed internally and was recorded as advisory: ${message}`);
      result = advisory([
        {
          message: `Rule could not complete: ${message}`,
          evidence: [],
        },
      ]);
    }

    let status = result.status;
    // Low-confidence failures never subtract points; they become advisories.
    if (status === 'fail' && rule.confidence === 'low') {
      status = 'advisory';
    }
    // Zero-point rules are always advisory when they would fail.
    if (status === 'fail' && rule.maxScore === 0) {
      status = 'advisory';
    }

    const score = status === 'fail' ? 0 : rule.maxScore;
    outcomes.push({
      rule,
      status,
      findings: result.findings,
      score: status === 'not-applicable' ? 0 : score,
      impactsScore: status !== 'not-applicable' && rule.maxScore > 0,
    });
  }

  const categories: CategoryScore[] = [];
  for (const definition of CATEGORIES) {
    if (options.category !== undefined && definition.id !== options.category) {
      continue;
    }
    const categoryOutcomes = outcomes.filter((outcome) => outcome.rule.category === definition.id);
    const scored = categoryOutcomes.filter((outcome) => outcome.impactsScore);
    const rawMax = scored.reduce((sum, outcome) => sum + outcome.rule.maxScore, 0);
    const rawScore = scored.reduce((sum, outcome) => sum + outcome.score, 0);
    categories.push({
      id: definition.id,
      title: definition.title,
      weight: definition.weight,
      score: rawMax > 0 ? (rawScore / rawMax) * 100 : undefined,
      rawScore,
      rawMax,
      ruleCount: categoryOutcomes.length,
    });
  }

  const activeCategories = categories.filter((category) => category.score !== undefined);
  const totalWeight = activeCategories.reduce((sum, category) => sum + category.weight, 0);
  let score: number | undefined;
  if (totalWeight > 0) {
    const weighted = activeCategories.reduce(
      (sum, category) => sum + (category.score ?? 0) * category.weight,
      0,
    );
    score = Math.round(weighted / totalWeight);
  }

  const collected = (await parsed()).collected;
  warnings.push(...collected.coverage.warnings);

  return {
    score,
    grade: score !== undefined ? gradeFor(score) : undefined,
    categories,
    outcomes,
    warnings,
    durationMs: Math.round(performance.now() - startedAt),
    collected,
  };
};
