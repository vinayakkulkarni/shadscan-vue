import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { cac } from 'cac';
import { CATEGORIES, type AuditCategoryId } from './audit.js';
import { CliError, isCliError } from './cli-error.js';
import { resolveOutputFormat, type OutputFormat } from './output-format.js';
import { renderAgentPrompt } from './render-agent-prompt.js';
import { renderHuman } from './render-human.js';
import { renderJson } from './render-json.js';
import { scanProject } from './scan.js';

const readEngineVersion = (): string => {
  const packageJsonPath = path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    '..',
    'package.json',
  );
  try {
    const parsed = JSON.parse(readFileSync(packageJsonPath, 'utf8')) as { version?: string };
    return parsed.version ?? '0.0.0';
  } catch {
    return '0.0.0';
  }
};

interface CliFlags {
  format?: string;
  json?: boolean;
  prompt?: boolean;
  failUnder?: string | number;
  category?: string;
  interactive?: boolean;
  roast?: boolean;
}

const parseFailUnder = (value: string | number | undefined): number | undefined => {
  if (value === undefined) {
    return undefined;
  }
  const parsed = typeof value === 'number' ? value : Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 100) {
    throw new CliError('invalid-flag', '--fail-under expects an integer from 0 to 100.');
  }
  return parsed;
};

const parseCategory = (value: string | undefined): AuditCategoryId | undefined => {
  if (value === undefined) {
    return undefined;
  }
  const known = CATEGORIES.find((category) => category.id === value);
  if (known === undefined) {
    const ids = CATEGORIES.map((category) => category.id).join(', ');
    throw new CliError('invalid-flag', `Unknown category "${value}". Use one of: ${ids}.`);
  }
  return known.id;
};

const emitError = (error: unknown, format: OutputFormat): number => {
  const cliError = isCliError(error)
    ? error
    : new CliError('internal-error', error instanceof Error ? error.message : String(error));
  if (format === 'json') {
    process.stderr.write(
      `${JSON.stringify({ error: { code: cliError.code, message: cliError.message }, schemaVersion: 1 }, null, 2)}\n`,
    );
  } else {
    process.stderr.write(`shadscan-vue: ${cliError.message}\n`);
  }
  return cliError.exitCode;
};

export const run = async (argv: readonly string[]): Promise<number> => {
  const engineVersion = readEngineVersion();
  const cli = cac('shadscan-vue');
  let format: OutputFormat = 'human';

  cli
    .command('[path]', 'Audit a shadcn-vue or shadcn-nuxt app for missing UI fundamentals.')
    .option('--format <format>', 'Choose human, JSON, or paste-ready prompt output.')
    .option('--json', 'Print a machine-readable JSON report.')
    .option('--prompt', 'Print only a paste-ready prompt for an AI agent.')
    .option(
      '--fail-under <score>',
      'Exit non-zero when the score is below this number, unassessed, or based on partial source coverage.',
    )
    .option('--category <category>', 'Run only one audit category.')
    .option('--no-interactive', 'Disable follow-up prompts.')
    .option('--roast', 'Force roast copy in output.')
    .option('--no-roast', 'Use neutral output.')
    .action(async (inputPath: string | undefined, flags: CliFlags) => {
      // Pre-select the error channel so flag-validation failures still honor
      // an explicitly requested JSON output.
      format = flags.json === true || flags.format === 'json' ? 'json' : 'human';
      format = resolveOutputFormat(flags);
      const failUnder = parseFailUnder(flags.failUnder);
      const category = parseCategory(flags.category);

      const result = await scanProject(inputPath ?? '.', { category });

      if (format === 'json') {
        process.stdout.write(`${renderJson(result, engineVersion)}\n`);
      } else if (format === 'prompt') {
        process.stdout.write(`${renderAgentPrompt(result, engineVersion)}\n`);
      } else {
        process.stdout.write(`${renderHuman(result, engineVersion)}\n`);
      }

      if (failUnder !== undefined) {
        const { score } = result.report;
        if (score === undefined) {
          throw new CliError('threshold-not-met', '--fail-under failed: the score is unassessed.');
        }
        if (result.report.collected.coverage.status === 'partial') {
          throw new CliError(
            'threshold-not-met',
            '--fail-under failed: source coverage is partial.',
          );
        }
        if (score < failUnder) {
          throw new CliError(
            'threshold-not-met',
            `--fail-under failed: score ${score} is below ${failUnder}.`,
          );
        }
      }
    });

  cli.help();
  cli.version(engineVersion);

  try {
    cli.parse([...argv], { run: false });
    await cli.runMatchedCommand();
    return 0;
  } catch (error) {
    return emitError(error, format);
  }
};
