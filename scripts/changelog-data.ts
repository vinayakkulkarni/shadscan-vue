import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const changelogPath = path.join(repoRoot, 'packages', 'cli', 'CHANGELOG.md');
const outPath = path.join(repoRoot, 'apps', 'www', 'app', 'data', 'changelog.json');

interface ChangeItem {
  scope: string;
  summary: string;
}

interface ChangeGroup {
  heading: string;
  items: ChangeItem[];
}

interface Release {
  version: string;
  date: string;
  groups: ChangeGroup[];
}

// release-please writes "## [0.2.1](compare-url) (2026-07-26)" for every
// release after the first and a bare "## 0.1.0 (2026-07-25)" for the initial
// one, so the bracket and link are both optional.
const RELEASE_HEADING = /^## \[?(?<version>\d+\.\d+\.\d+)\]?(?:\([^)]*\))?\s*\((?<date>[^)]+)\)/u;
const GROUP_HEADING = /^### (?<heading>.+)$/u;
// Entries end with "([abc1234](commit-url))"; the hash is noise on a web page.
const ENTRY = /^\* (?<body>.+?)\s*\(\[[0-9a-f]{7}\]\([^)]*\)\)\s*$/u;
// A conventional-commit scope arrives as "**rules:** summary", and the page
// renders text rather than markdown, so the emphasis has to come off here.
const SCOPED_BODY = /^\*\*(?<scope>[^*]+):\*\*\s*(?<summary>.+)$/u;

const parse = (markdown: string): Release[] => {
  const releases: Release[] = [];
  let release: Release | undefined;
  let group: ChangeGroup | undefined;

  for (const line of markdown.split('\n')) {
    const heading = RELEASE_HEADING.exec(line);
    if (heading?.groups !== undefined) {
      release = { version: heading.groups.version!, date: heading.groups.date!, groups: [] };
      releases.push(release);
      group = undefined;
      continue;
    }
    if (release === undefined) {
      continue;
    }
    const groupHeading = GROUP_HEADING.exec(line);
    if (groupHeading?.groups !== undefined) {
      group = { heading: groupHeading.groups.heading!, items: [] };
      release.groups.push(group);
      continue;
    }
    const entry = ENTRY.exec(line);
    if (entry?.groups !== undefined && group !== undefined) {
      const body = entry.groups.body!;
      const scoped = SCOPED_BODY.exec(body);
      group.items.push(
        scoped?.groups === undefined
          ? { scope: '', summary: body }
          : { scope: scoped.groups.scope!, summary: scoped.groups.summary! },
      );
    }
  }

  return releases;
};

const releases = parse(readFileSync(changelogPath, 'utf8'));
if (releases.length === 0) {
  throw new Error(`No releases parsed from ${changelogPath}`);
}

writeFileSync(outPath, `${JSON.stringify({ releases }, undefined, 2)}\n`);
process.stdout.write(`Wrote ${releases.length} releases to ${path.relative(repoRoot, outPath)}\n`);
