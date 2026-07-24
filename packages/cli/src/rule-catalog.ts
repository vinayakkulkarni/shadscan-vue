import { CATEGORIES, type AuditCategoryId } from './audit.js';
import { defaultRules } from './rules/index.js';
import { RULESET_VERSION } from './scan.js';

export interface CatalogRule {
  id: string;
  title: string;
  description: string;
  category: AuditCategoryId;
  severity: string;
  confidence: string;
  points: number;
  adapters: string[];
}

export interface CatalogCategory {
  id: AuditCategoryId;
  title: string;
  weight: number;
  totalPoints: number;
  rules: CatalogRule[];
}

export interface RuleCatalog {
  rulesetVersion: string;
  ruleCount: number;
  categories: CatalogCategory[];
}

export const buildRuleCatalog = (): RuleCatalog => {
  const categories = CATEGORIES.map((definition) => {
    const rules = defaultRules
      .filter((rule) => rule.category === definition.id)
      .map<CatalogRule>((rule) => ({
        id: rule.id,
        title: rule.title,
        description: rule.description,
        category: rule.category,
        severity: rule.severity,
        confidence: rule.confidence,
        points: rule.maxScore,
        adapters: [...rule.adapters],
      }));
    return {
      id: definition.id,
      title: definition.title,
      weight: definition.weight,
      totalPoints: rules.reduce((sum, rule) => sum + rule.points, 0),
      rules,
    };
  });

  return {
    rulesetVersion: RULESET_VERSION,
    ruleCount: defaultRules.length,
    categories,
  };
};

const severityLabel: Record<string, string> = {
  error: 'Error',
  warning: 'Warning',
  info: 'Info',
};

export const renderCatalogMarkdown = (catalog: RuleCatalog): string => {
  const lines: string[] = [
    '# Rule catalog',
    '',
    `shadscan-vue ships ${catalog.ruleCount} rules across ${catalog.categories.length} categories (ruleset ${catalog.rulesetVersion}).`,
    '',
    'Every rule is deterministic: it reports what it can prove from source. A rule',
    'that cannot apply to a project returns *not applicable* and leaves the score',
    'untouched, and a low-confidence finding is reported as an advisory that never',
    'subtracts points.',
    '',
    '| Category | Weight | Rules | Points |',
    '| --- | ---: | ---: | ---: |',
  ];
  for (const category of catalog.categories) {
    lines.push(
      `| [${category.title}](#${category.id}) | ${category.weight} | ${category.rules.length} | ${category.totalPoints} |`,
    );
  }
  lines.push('');

  for (const category of catalog.categories) {
    lines.push(
      `## ${category.title}`,
      '',
      `<a id="${category.id}"></a>Weight ${category.weight} of 100 · ${category.rules.length} rules`,
      '',
    );
    for (const rule of category.rules) {
      const adapters = rule.adapters.length === 3 ? 'all adapters' : rule.adapters.join(', ');
      lines.push(
        `### \`${rule.id}\``,
        '',
        rule.description,
        '',
        `- ${severityLabel[rule.severity] ?? rule.severity} · ${rule.confidence} confidence · ${rule.points} points`,
        `- Applies to: ${adapters}`,
        '',
      );
    }
  }

  return lines.join('\n');
};
