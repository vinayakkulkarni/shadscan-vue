import type { AuditRule } from '../../audit.js';
import { elementLine } from '../../parse/sfc.js';
import type { Finding } from '../rule-result.js';
import { forEachElement, staticClassList } from './polish-shared.js';

const ANIMATION_CLASS = /^(?:animate-|motion-safe:|transition-all$)/u;
const INFINITE_ANIMATION = /^animate-(?:spin|ping|pulse|bounce)$/u;
const REDUCED_MOTION_GUARD =
  /(?:prefers-reduced-motion|motion-safe:|motion-reduce:|useReducedMotion|usePreferredReducedMotion)/u;

export const animationsRespectReducedMotion: AuditRule = {
  id: 'animations-respect-reduced-motion',
  title: 'Animations respect reduced-motion preferences',
  description:
    'Continuous or large-scale animation should be guarded by a reduced-motion preference so users with vestibular sensitivity are not forced into motion.',
  category: 'production-polish',
  severity: 'warning',
  confidence: 'medium',
  maxScore: 2,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, styles, result }) => {
    const files = await sources();
    const styleFiles = await styles();

    const globallyGuarded =
      styleFiles.some((style) => REDUCED_MOTION_GUARD.test(style.text)) ||
      files.some((file) => REDUCED_MOTION_GUARD.test(file.text));

    const animated: Finding[] = [];
    let animationTokens = 0;
    forEachElement(files, (element, file) => {
      const tokens = staticClassList(element);
      const infinite = tokens.filter((token) =>
        INFINITE_ANIMATION.test(token.replace(/^motion-(?:safe|reduce):/u, '')),
      );
      animationTokens += tokens.filter((token) => ANIMATION_CLASS.test(token)).length;
      const guardedLocally = tokens.some((token) => /^motion-(?:safe|reduce):/u.test(token));
      if (infinite.length > 0 && !guardedLocally) {
        animated.push({
          message: `<${element.tag}> runs a continuous animation (${infinite.join(', ')}) with no reduced-motion guard.`,
          evidence: [{ path: file.relPath, line: elementLine(element) }],
          remediation:
            'Wrap continuous animation in motion-safe: utilities or a prefers-reduced-motion media query.',
        });
      }
    });

    if (animationTokens === 0 && animated.length === 0) {
      return result.notApplicable();
    }
    if (globallyGuarded || animated.length === 0) {
      return result.pass();
    }
    return result.fail(animated);
  },
};
