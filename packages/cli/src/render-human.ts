import pc from 'picocolors';
import type { CategoryScore } from './audit.js';
import { roastLine } from './roast.js';
import type { ScanResult } from './scan.js';
import { resolveTerminalCapabilities, type TerminalCapabilities } from './terminal-capabilities.js';

const BAR_WIDTH = 20;

const bar = (score: number | undefined, caps: TerminalCapabilities): string => {
  if (score === undefined) {
    return '(no scored rules)';
  }
  const filled = Math.round((score / 100) * BAR_WIDTH);
  const fullChar = caps.unicode ? '█' : '#';
  const emptyChar = caps.unicode ? '░' : '-';
  return `${fullChar.repeat(filled)}${emptyChar.repeat(BAR_WIDTH - filled)} ${Math.round(score)}`;
};

const statusLabel = (status: string, caps: TerminalCapabilities): string => {
  const paint = (text: string, color: (value: string) => string): string =>
    caps.color ? color(text) : text;
  switch (status) {
    case 'fail':
      return paint('FAIL', pc.red);
    case 'advisory':
      return paint('ADVISORY', pc.yellow);
    case 'pass':
      return paint('PASS', pc.green);
    default:
      return status.toUpperCase();
  }
};

export const renderHuman = (
  result: ScanResult,
  engineVersion: string,
  caps: TerminalCapabilities = resolveTerminalCapabilities(),
  roast = false,
): string => {
  const { discovery, report } = result;
  const lines: string[] = [];
  const paint = (text: string, color: (value: string) => string): string =>
    caps.color ? color(text) : text;

  lines.push(paint(`shadscan-vue v${engineVersion}`, pc.bold));
  lines.push(`${discovery.packageName} · ${discovery.adapter} · ${discovery.packageManager}`);
  lines.push('');

  if (report.score !== undefined && report.grade !== undefined) {
    const gradeText = `Score ${report.score}/100 · Grade ${report.grade}`;
    lines.push(
      paint(gradeText, report.score >= 80 ? pc.green : report.score >= 60 ? pc.yellow : pc.red),
    );
    if (roast) {
      const scored = report.categories.filter((category) => category.score !== undefined);
      const weakest = scored.reduce<CategoryScore | undefined>(
        (lowest, category) =>
          lowest === undefined || (category.score ?? 0) < (lowest.score ?? 0) ? category : lowest,
        undefined,
      );
      const line = roastLine(report.grade, weakest?.id);
      if (line !== undefined) {
        lines.push(paint(line, pc.dim));
      }
    }
  } else {
    lines.push('Score: unassessed (no applicable scored rules)');
  }
  lines.push('');

  for (const category of report.categories) {
    lines.push(`${category.title.padEnd(22)} ${bar(category.score, caps)}`);
  }
  lines.push('');

  const problems = report.outcomes.filter(
    (outcome) => outcome.status === 'fail' || outcome.status === 'advisory',
  );
  if (problems.length === 0) {
    lines.push(paint('No findings. Every applicable check passed.', pc.green));
  } else {
    lines.push(paint('Findings', pc.bold));
    for (const outcome of problems) {
      lines.push('');
      lines.push(
        `  ${statusLabel(outcome.status, caps)} ${outcome.rule.id} (${outcome.rule.category}, ${outcome.rule.severity})`,
      );
      for (const finding of outcome.findings) {
        lines.push(`    ${finding.message}`);
        for (const evidence of finding.evidence) {
          const location =
            evidence.line !== undefined ? `${evidence.path}:${evidence.line}` : evidence.path;
          lines.push(paint(`      ${location}`, pc.dim));
        }
        if (finding.remediation !== undefined) {
          lines.push(paint(`      fix: ${finding.remediation}`, pc.cyan));
        }
      }
    }
  }

  if (report.warnings.length > 0) {
    lines.push('');
    lines.push(paint('Warnings', pc.bold));
    for (const warning of report.warnings) {
      lines.push(`  ${warning}`);
    }
  }

  lines.push('');
  lines.push(paint(`Completed in ${report.durationMs}ms`, pc.dim));
  return lines.join('\n');
};
