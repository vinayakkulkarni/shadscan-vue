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
import { buildRuleCatalog, renderCatalogMarkdown } from './rule-catalog.js';
import { scanProject } from './scan.js';
import { installPreCommitHook } from './setup.js';
import { resolveTerminalCapabilities } from './terminal-capabilities.js';

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

/**
 * cac defaults a negatable option to true as soon as `--no-roast` is declared,
 * so the flag alone cannot distinguish "asked for roast" from "did not ask".
 * Reading argv keeps the default (interactive terminals only) intact.
 */
const resolveRoast = (
  argv: readonly string[],
  caps: { isTTY: boolean; isCI: boolean },
): boolean => {
  if (argv.includes('--no-roast')) {
    return false;
  }
  if (argv.includes('--roast')) {
    return true;
  }
  return caps.isTTY && !caps.isCI;
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
        const caps = resolveTerminalCapabilities();
        process.stdout.write(
          `${renderHuman(result, engineVersion, caps, resolveRoast(argv, caps))}\n`,
        );
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

  cli
    .command('setup', 'Install shadscan-vue into a project workflow.')
    .option('--pre-commit', 'Install a git pre-commit hook that runs a scan before each commit.')
    .action(async (flags: { preCommit?: boolean }) => {
      if (flags.preCommit !== true) {
        throw new CliError(
          'invalid-flag',
          'setup requires --pre-commit. Run `shadscan-vue setup --pre-commit`.',
        );
      }
      const outcome = await installPreCommitHook(process.cwd());
      const message =
        outcome.action === 'already-present'
          ? `A shadscan-vue pre-commit hook is already installed at ${outcome.hookPath}.`
          : `Installed the shadscan-vue pre-commit hook at ${outcome.hookPath}.`;
      process.stdout.write(`${message}\n`);
    });

  cli
    .command('rules', 'Print the rule catalog.')
    .option('--format <format>', 'Choose markdown or json output.')
    .action((flags: { format?: string }) => {
      const catalogFormat = flags.format ?? 'markdown';
      if (catalogFormat !== 'markdown' && catalogFormat !== 'json') {
        throw new CliError('invalid-flag', 'rules --format expects markdown or json.');
      }
      const catalog = buildRuleCatalog();
      if (catalogFormat === 'json') {
        format = 'json';
        process.stdout.write(`${JSON.stringify(catalog, null, 2)}\n`);
        return;
      }
      process.stdout.write(`${renderCatalogMarkdown(catalog)}\n`);
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
