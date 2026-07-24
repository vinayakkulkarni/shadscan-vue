/**
 * Scan resource limits. When any limit causes omission, source coverage is
 * reported as `partial` and `--fail-under` refuses to pass.
 */
export const MAX_SOURCE_FILES = 10_000;
export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 50 * 1024 * 1024;

export type CoverageStatus = 'complete' | 'partial';

export interface SourceCoverage {
  status: CoverageStatus;
  fileCount: number;
  totalBytes: number;
  warnings: string[];
}
