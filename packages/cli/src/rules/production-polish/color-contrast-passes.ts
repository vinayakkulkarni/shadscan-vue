import type { AuditRule } from '../../audit.js';
import { isGeneratedUiPrimitive } from '../generated-ui.js';

const COLOR_STYLE_PATTERN =
  /(?:color|background(?:-color)?|border-color|fill|stroke)\s*:|\b(?:bg|border|fill|stroke|text)-(?:accent|background|card|destructive|foreground|input|muted|popover|primary|ring|secondary|[a-z]+-\d{2,3})\b|#[\da-f]{3,8}\b|(?:hsl|oklch|rgb)a?\s*\(/iu;

const lineOf = (text: string, pattern: RegExp): number => {
  const index = text.search(pattern);
  if (index < 0) {
    return 1;
  }
  return text.slice(0, index).split('\n').length;
};

export const colorContrastPasses: AuditRule = {
  id: 'color-contrast-passes',
  title: 'Rendered colour contrast meets accessibility thresholds',
  description:
    'Marks styled colour pairs for browser verification. Computed contrast depends on cascade, theme, and opacity, none of which can be resolved from source, so this reports where to look rather than scoring it.',
  category: 'production-polish',
  severity: 'warning',
  confidence: 'low',
  maxScore: 0,
  adapters: ['nuxt', 'vite-vue', 'generic-vue'],
  run: async ({ sources, result }) => {
    const files = await sources();
    const styled = files.find(
      (file) => !isGeneratedUiPrimitive(file.relPath) && COLOR_STYLE_PATTERN.test(file.text),
    );

    if (styled === undefined) {
      return result.notApplicable();
    }

    return result.advisory([
      {
        message:
          'Colour styling is present, but computed foreground and background contrast cannot be established from source.',
        evidence: [{ path: styled.relPath, line: lineOf(styled.text, COLOR_STYLE_PATTERN) }],
        remediation:
          'Check rendered states in every theme and viewport: 4.5:1 for body text, 3:1 for large text, and 3:1 for meaningful UI graphics and boundaries.',
      },
    ]);
  },
};
