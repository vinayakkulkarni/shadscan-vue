export interface Evidence {
  path: string;
  line?: number;
}

export interface Finding {
  message: string;
  evidence: Evidence[];
  remediation?: string;
}

export type RuleStatus = 'pass' | 'fail' | 'advisory' | 'not-applicable';

export interface RuleResult {
  status: RuleStatus;
  findings: Finding[];
}

export const pass = (): RuleResult => ({ status: 'pass', findings: [] });

export const fail = (findings: Finding[]): RuleResult => ({
  status: 'fail',
  findings,
});

export const advisory = (findings: Finding[]): RuleResult => ({
  status: 'advisory',
  findings,
});

export const notApplicable = (): RuleResult => ({
  status: 'not-applicable',
  findings: [],
});
