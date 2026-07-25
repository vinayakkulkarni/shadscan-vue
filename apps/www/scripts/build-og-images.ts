// Build-time OG card generator.
//
// Satori's WASM crashes at runtime on Cloudflare Workers (og issue #434), so
// the cards cannot be rendered from a server route. Generating them here in
// Node sidesteps that entirely: every page gets a static card under
// public/og/**, referenced per-page through usePageSeo's ogSlug.
//
// @cf-wasm/og's /node entry bundles its own Noto Sans font, so no font wiring
// is needed. Output is git-ignored and regenerated ahead of every build.
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ImageResponse } from '@cf-wasm/og/node';

interface OgCard {
  eyebrow: string;
  title: string;
  badge: string;
}

interface SatoriElement {
  type: string;
  props: Record<string, unknown>;
}

const OUTPUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'og');

const INK = '#111111';
const BG = '#fafaf9';
const ACCENT = '#d4e600';

const CARDS: Record<string, OgCard> = {
  default: {
    eyebrow: 'Static audit · no AI required',
    title: 'Find the UI fundamentals your shadcn-vue app forgot',
    badge: '52 deterministic rules',
  },
  rules: {
    eyebrow: 'Rule catalog',
    title: 'Every rule, every category, every fix',
    badge: '52 rules · 6 categories',
  },
  docs: {
    eyebrow: 'Documentation',
    title: 'Run it, gate CI, hand findings to an agent',
    badge: 'npx shadscan-vue',
  },
  changelog: {
    eyebrow: 'Changelog',
    title: 'Release history for shadscan-vue',
    badge: 'Semantic versioning',
  },
  credits: {
    eyebrow: 'Credits',
    title: 'A Vue and Nuxt port of shadscan, with permission',
    badge: 'MIT licensed',
  },
};

const el = (
  type: string,
  style: Record<string, unknown>,
  ...children: unknown[]
): SatoriElement => {
  const flat = children.flat().filter((child) => child != null && child !== false);
  const props: Record<string, unknown> = { style };
  if (flat.length === 1 && typeof flat[0] === 'string') {
    props.children = flat[0];
  } else if (flat.length > 0) {
    props.children = flat;
  }
  return { type, props };
};

const card = (content: OgCard): SatoriElement =>
  el(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: '100%',
      height: '100%',
      backgroundColor: BG,
      color: INK,
      fontFamily: 'sans-serif',
      padding: '64px',
      border: `12px solid ${INK}`,
    },
    el(
      'div',
      { display: 'flex', flexDirection: 'column' },
      el(
        'div',
        { fontSize: '22px', fontWeight: 700, letterSpacing: '6px' },
        content.eyebrow.toUpperCase(),
      ),
      el(
        'div',
        { display: 'flex', fontSize: '72px', fontWeight: 800, lineHeight: 1.04, marginTop: '28px' },
        content.title.toUpperCase(),
      ),
    ),
    el(
      'div',
      { display: 'flex', flexDirection: 'column' },
      el(
        'div',
        {
          display: 'flex',
          backgroundColor: ACCENT,
          color: INK,
          fontSize: '28px',
          fontWeight: 700,
          padding: '10px 18px',
          alignSelf: 'flex-start',
        },
        content.badge,
      ),
      el('div', { fontSize: '26px', fontWeight: 500, marginTop: '24px' }, 'shadscan-vue.geoql.in'),
    ),
  );

const main = async (): Promise<void> => {
  mkdirSync(OUTPUT_DIR, { recursive: true });

  for (const [slug, content] of Object.entries(CARDS)) {
    const response = new ImageResponse(card(content), { width: 1200, height: 630 });
    const buffer = Buffer.from(await response.arrayBuffer());
    writeFileSync(join(OUTPUT_DIR, `${slug}.png`), buffer);
    process.stdout.write(`  og/${slug}.png (${(buffer.length / 1024).toFixed(0)} kB)\n`);
  }

  process.stdout.write(`Generated ${Object.keys(CARDS).length} OG cards\n`);
};

await main();
