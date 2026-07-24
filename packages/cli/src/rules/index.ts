import type { AuditRule } from '../audit.js';
import { htmlLangPresent } from './accessibility/html-lang-present.js';
import { imagesHaveAlt } from './accessibility/images-have-alt.js';
import { shadcnConfigPresent } from './foundation/shadcn-config-present.js';

/**
 * Canonical ordered rule registry. Order is part of the deterministic output
 * contract: rules run and render in registry order.
 */
export const defaultRules: readonly AuditRule[] = [
  // Foundation
  shadcnConfigPresent,
  // Accessibility
  htmlLangPresent,
  imagesHaveAlt,
];
