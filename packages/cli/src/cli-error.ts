/**
 * Stable, typed CLI failures. Every expected failure path throws a `CliError`
 * with a machine-readable `code`; anything else is an internal error.
 */
export type CliErrorCode =
  | 'invalid-path'
  | 'not-a-project'
  | 'invalid-package-json'
  | 'unsupported-project'
  | 'invalid-flag'
  | 'conflicting-flags'
  | 'threshold-not-met'
  | 'internal-error';

export class CliError extends Error {
  readonly code: CliErrorCode;
  readonly exitCode: number;

  constructor(code: CliErrorCode, message: string, exitCode = 1) {
    super(message);
    this.name = 'CliError';
    this.code = code;
    this.exitCode = exitCode;
  }
}

export const isCliError = (error: unknown): error is CliError => error instanceof CliError;
