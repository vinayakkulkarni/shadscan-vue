/**
 * Terminal capability resolution. Rich rendering (color, unicode) only on a
 * capable interactive TTY; deterministic plain ASCII when piped or in CI.
 */
export interface TerminalCapabilities {
  isTTY: boolean;
  isCI: boolean;
  color: boolean;
  unicode: boolean;
}

export const resolveTerminalCapabilities = (
  env: NodeJS.ProcessEnv = process.env,
  stdout: { isTTY?: boolean } = process.stdout,
): TerminalCapabilities => {
  const isTTY = stdout.isTTY === true;
  const isCI = env.CI !== undefined && env.CI !== '' && env.CI !== 'false';
  const noColor = env.NO_COLOR !== undefined && env.NO_COLOR !== '';
  const lang = `${env.LC_ALL ?? ''}${env.LC_CTYPE ?? ''}${env.LANG ?? ''}`;
  return {
    isTTY,
    isCI,
    color: isTTY && !isCI && !noColor,
    unicode: !isCI && /utf-?8/i.test(lang),
  };
};
