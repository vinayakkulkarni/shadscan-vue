import type { AuditRule } from '../audit.js';
import { htmlLangPresent } from './accessibility/html-lang-present.js';
import { imagesHaveAlt } from './accessibility/images-have-alt.js';
import { componentsAliasesResolve } from './foundation/components-aliases-resolve.js';
import { errorBoundaryPresent } from './foundation/error-boundary-present.js';
import { faviconPresent } from './foundation/favicon-present.js';
import { metadataConfigured } from './foundation/metadata-configured.js';
import { notFoundRoutePresent } from './foundation/not-found-route-present.js';
import { shadcnConfigPresent } from './foundation/shadcn-config-present.js';
import { themeHydrationSafe } from './foundation/theme-hydration-safe.js';
import { themeProviderConfigured } from './foundation/theme-provider-configured.js';
import { themeProviderMountedInShell } from './foundation/theme-provider-mounted-in-shell.js';

/**
 * Canonical ordered rule registry. Order is part of the deterministic output
 * contract: rules run and render in registry order.
 */
export const defaultRules: readonly AuditRule[] = [
  // Foundation
  shadcnConfigPresent,
  themeProviderConfigured,
  metadataConfigured,
  faviconPresent,
  notFoundRoutePresent,
  errorBoundaryPresent,
  componentsAliasesResolve,
  themeProviderMountedInShell,
  themeHydrationSafe,
  // Accessibility
  htmlLangPresent,
  imagesHaveAlt,
];
