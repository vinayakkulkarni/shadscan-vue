const ignorePatterns = [
  /(?:^|\/)CHANGELOG\.md$/,
  /(?:^|\/)pnpm-lock\.yaml$/,
  /(?:^|\/)test\/fixtures\//,
  /(?:^|\/)qa\//,
  /(?:^|\/)docs\/RULES\.md$/,
];

const isIgnored = (file) => ignorePatterns.some((p) => p.test(file));

export default {
  '*.{js,jsx,ts,tsx,vue}': (files) => {
    const filtered = files.filter((f) => !isIgnored(f));
    return filtered.length > 0
      ? [`vp lint --fix ${filtered.join(' ')}`, `vp fmt --write ${filtered.join(' ')}`]
      : [];
  },
  '*.{json,md,yml,yaml,css,html}': (files) => {
    const filtered = files.filter((f) => !isIgnored(f));
    return filtered.length > 0 ? [`vp fmt --write ${filtered.join(' ')}`] : [];
  },
};
