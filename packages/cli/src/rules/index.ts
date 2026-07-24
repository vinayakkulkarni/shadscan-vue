import type { AuditRule } from '../audit.js';
import { headingStructureSane } from './accessibility/heading-structure-sane.js';
import { htmlLangPresent } from './accessibility/html-lang-present.js';
import { iconButtonsHaveLabels } from './accessibility/icon-buttons-have-labels.js';
import { iframesHaveTitle } from './accessibility/iframes-have-title.js';
import { imagesHaveAlt } from './accessibility/images-have-alt.js';
import { interactiveElementsAreSemantic } from './accessibility/interactive-elements-are-semantic.js';
import { linksHaveAccessibleNames } from './accessibility/links-have-accessible-names.js';
import { navLandmarksHaveNames } from './accessibility/nav-landmarks-have-names.js';
import { noNestedInteractiveControls } from './accessibility/no-nested-interactive-controls.js';
import { noPositiveTabindex } from './accessibility/no-positive-tabindex.js';
import { componentsAliasesResolve } from './foundation/components-aliases-resolve.js';
import { errorBoundaryPresent } from './foundation/error-boundary-present.js';
import { faviconPresent } from './foundation/favicon-present.js';
import { metadataConfigured } from './foundation/metadata-configured.js';
import { notFoundRoutePresent } from './foundation/not-found-route-present.js';
import { shadcnConfigPresent } from './foundation/shadcn-config-present.js';
import { themeHydrationSafe } from './foundation/theme-hydration-safe.js';
import { themeProviderConfigured } from './foundation/theme-provider-configured.js';
import { themeProviderMountedInShell } from './foundation/theme-provider-mounted-in-shell.js';
import { commandMenuHotkeyPresent } from './interaction/command-menu-hotkey-present.js';
import { commandMenuPresent } from './interaction/command-menu-present.js';
import { destructiveActionsConfirmed } from './interaction/destructive-actions-confirmed.js';
import { focusVisibleNotSuppressed } from './interaction/focus-visible-not-suppressed.js';
import { globalHotkeysAreSafe } from './interaction/global-hotkeys-are-safe.js';
import { itemsBelongToGroups } from './interaction/items-belong-to-groups.js';
import { mobileNavPresent } from './interaction/mobile-nav-present.js';
import { themeHotkeyPresent } from './interaction/theme-hotkey-present.js';
import { asyncActionPendingState } from './states/async-action-pending-state.js';
import { emptyStatePresent } from './states/empty-state-present.js';
import { errorStateRetryPresent } from './states/error-state-retry-present.js';
import { notFoundRecoveryPresent } from './states/not-found-recovery-present.js';
import { routeLoadingBoundaryPresent } from './states/route-loading-boundary-present.js';
import { suspenseFallbackUseful } from './states/suspense-fallback-useful.js';
import { toastProviderMounted } from './states/toast-provider-mounted.js';
import { toastProviderPresent } from './states/toast-provider-present.js';
import { animationsRespectReducedMotion } from './production-polish/animations-respect-reduced-motion.js';
import { buttonIconsHaveDataIcon } from './production-polish/button-icons-have-data-icon.js';
import { metadataTitleDescriptionComplete } from './production-polish/metadata-title-description-complete.js';
import { mobileOverflowAbsent } from './production-polish/mobile-overflow-absent.js';
import { noStarterCopy } from './production-polish/no-starter-copy.js';
import { pointerTargetSizePasses } from './production-polish/pointer-target-size-passes.js';
import { publicAppSeoFilesPresent } from './production-polish/public-app-seo-files-present.js';
import { responsiveShellPresent } from './production-polish/responsive-shell-present.js';
import { socialPreviewPresent } from './production-polish/social-preview-present.js';

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
  // Interaction
  themeHotkeyPresent,
  commandMenuPresent,
  commandMenuHotkeyPresent,
  globalHotkeysAreSafe,
  mobileNavPresent,
  focusVisibleNotSuppressed,
  itemsBelongToGroups,
  destructiveActionsConfirmed,
  // States
  toastProviderPresent,
  toastProviderMounted,
  routeLoadingBoundaryPresent,
  suspenseFallbackUseful,
  emptyStatePresent,
  errorStateRetryPresent,
  notFoundRecoveryPresent,
  asyncActionPendingState,
  // Accessibility
  htmlLangPresent,
  imagesHaveAlt,
  iconButtonsHaveLabels,
  linksHaveAccessibleNames,
  navLandmarksHaveNames,
  headingStructureSane,
  noPositiveTabindex,
  iframesHaveTitle,
  interactiveElementsAreSemantic,
  noNestedInteractiveControls,
  // Production polish
  noStarterCopy,
  metadataTitleDescriptionComplete,
  socialPreviewPresent,
  publicAppSeoFilesPresent,
  responsiveShellPresent,
  mobileOverflowAbsent,
  animationsRespectReducedMotion,
  pointerTargetSizePasses,
  buttonIconsHaveDataIcon,
];
