import type { AuditCategoryId } from './audit.js';

/**
 * Deterministic copy: the same report always produces the same line, so
 * output stays diffable and snapshot tests remain stable.
 */
const GRADE_LINES: Record<string, string> = {
  A: 'Nothing left to roast. Ship it.',
  B: 'Close. A few fundamentals are still coasting on defaults.',
  C: 'It works, which is not the same as it being finished.',
  D: 'The happy path is covered. Everything else is a rumour.',
  F: 'This is a demo wearing a product costume.',
};

const CATEGORY_LINES: Record<AuditCategoryId, string> = {
  foundation: 'The foundation is missing pieces the rest of the app assumes exist.',
  interaction: 'Interaction is mouse-only in places where it should not be.',
  states: 'Empty, loading, and error states are where this app stops explaining itself.',
  accessibility: 'Assistive technology gets a worse version of this product.',
  forms: 'The forms ask for data without explaining what they want.',
  'production-polish': 'It still reads like a scaffold in front of real users.',
};

export const roastLine = (
  grade: string | undefined,
  weakestCategory: AuditCategoryId | undefined,
): string | undefined => {
  if (grade === undefined) {
    return undefined;
  }
  const gradeLine = GRADE_LINES[grade];
  if (gradeLine === undefined) {
    return undefined;
  }
  if (grade === 'A' || weakestCategory === undefined) {
    return gradeLine;
  }
  return `${gradeLine} ${CATEGORY_LINES[weakestCategory]}`;
};
