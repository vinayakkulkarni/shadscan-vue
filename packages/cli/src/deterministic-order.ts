/**
 * Locale-independent ordering helpers. All scanner output must be
 * deterministic across machines, so never use `localeCompare`.
 */
export const compareCodeUnits = (a: string, b: string): number => {
  if (a < b) {
    return -1;
  }
  if (a > b) {
    return 1;
  }
  return 0;
};

export const sortByCodeUnits = <T>(items: readonly T[], key: (item: T) => string): T[] =>
  [...items].sort((left, right) => compareCodeUnits(key(left), key(right)));
