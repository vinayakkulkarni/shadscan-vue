import { CliError } from './cli-error.js';

export type OutputFormat = 'human' | 'json' | 'prompt';

export interface FormatFlags {
  format?: string;
  json?: boolean;
  prompt?: boolean;
}

export const resolveOutputFormat = (flags: FormatFlags): OutputFormat => {
  const explicit = flags.format;
  if (explicit !== undefined) {
    if (flags.json === true || flags.prompt === true) {
      throw new CliError(
        'conflicting-flags',
        '--format conflicts with --json and --prompt. Choose one.',
      );
    }
    if (explicit !== 'human' && explicit !== 'json' && explicit !== 'prompt') {
      throw new CliError(
        'invalid-flag',
        `Unknown format "${explicit}". Use human, json, or prompt.`,
      );
    }
    return explicit;
  }
  if (flags.json === true && flags.prompt === true) {
    throw new CliError('conflicting-flags', '--json conflicts with --prompt. Choose one.');
  }
  if (flags.json === true) {
    return 'json';
  }
  if (flags.prompt === true) {
    return 'prompt';
  }
  return 'human';
};
