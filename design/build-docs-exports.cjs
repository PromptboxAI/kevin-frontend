#!/usr/bin/env node
/**
 * Render the docs articles into their two published exports.
 *
 *     node build-docs-exports.cjs          # write
 *     node build-docs-exports.cjs --check  # verify only, exit 1 if stale (for CI)
 *
 * Why this exists: the same 45 articles lived in THREE hand-maintained copies —
 * components/docs-articles*.jsx (what the app renders), Kevin-docs.md (the
 * single-file handoff doc), and gitbook/ (the GitBook import). Nothing failed
 * when they disagreed, so they drifted: an item-allowance edit landed in the
 * components and in Kevin-docs.md but not in gitbook/, and nobody noticed until
 * a later pass happened to read the stale file. Same failure mode as the copy
 * that outlived a scrapped domain rule, which is what check-domain-rules.py is
 * for. This makes the components the single source and the other two derived.
 *
 * The article files are pure data (CLAUDE.md keeps them "data, not markup, so
 * they lift into GitBook or a CMS untouched"), so this EVALUATES them rather
 * than parsing them. A regex reader would be a second, subtly different
 * interpretation of the source — the exact class of bug this script removes.
 * Node is a dev-time tool here; it is not a build step for the app, which still
 * ships as Babel-in-the-browser with no bundler.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const BASE = __dirname;
const CHECK = process.argv.includes('--check');
const ARTICLE_FILES = ['docs-articles.jsx', 'docs-articles-2.jsx', 'docs-articles-3.jsx'];

/* ── read the source ────────────────────────────────────────────────── */

// docs.jsx contains JSX and cannot be evaluated whole, but DOC_NAV is a plain
// literal. Slice it by bracket depth rather than by a line count that would
// silently take the wrong range if the array grows.
function readDocNav() {
  const src = fs.readFileSync(path.join(BASE, 'components', 'docs.jsx'), 'utf8');
  const start = src.indexOf('const DOC_NAV = [');
  if (start < 0) throw new Error('DOC_NAV not found in components/docs.jsx');
  const open = src.indexOf('[', start);
  let depth = 0, end = -1;
  for (let i = open; i < src.length; i++) {
    const c = src[i];
    if (c === '[') depth++;
    else if (c === ']') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end < 0) throw new Error('DOC_NAV array is unterminated');
  return vm.runInNewContext('(' + src.slice(open, end + 1) + ')');
}

// The article files are `const X = {...}; window.X = X;` — run them against a
// window stub and take whatever they hang on it.
function readArticles() {
  const merged = {};
  const seen = {};
  for (const file of ARTICLE_FILES) {
    const src = fs.readFileSync(path.join(BASE, 'components', file), 'utf8');
    const sandbox = { window: {} };
    vm.runInNewContext(src, sandbox, { filename: file });
    for (const bag of Object.values(sandbox.window)) {
      if (!bag || typeof bag !== 'object') continue;
      for (const [slug, art] of Object.entries(bag)) {
        // Global scope is shared after transpile, so a duplicate slug across
        // parts would have one article silently win in the app too.
        if (merged[slug]) throw new Error(`duplicate article slug "${slug}" in ${file} and ${seen[slug]}`);
        merged[slug] = art;
        seen[slug] = file;
      }
    }
  }
  return merged;
}

/* ── slugs ──────────────────────────────────────────────────────────── */

// Matches the in-page anchors: punctuation is dropped rather than turned into a
// separator, so "Special-limits flags" is #speciallimits-flags.
const anchorSlug = (s) => s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim().replace(/\s+/g, '-');
// Folder names keep "&" as "and": "Claims & policies" -> claims-and-policies.
const folderSlug = (s) => s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9\s-]/g, '')
  .trim().replace(/\s+/g, '-').replace(/-+/g, '-');

/* ── block rendering ────────────────────────────────────────────────── */

const escapeCell = (s) => String(s).replace(/\|/g, '\\|');

// `headingLevel` differs per target: Kevin-docs.md nests articles under a
// section H1 so an article h2 becomes ###; a standalone gitbook page uses ##.
function renderBlocks(blocks, headingLevel) {
  const out = [];
  for (const [kind, payload] of blocks) {
    switch (kind) {
      case 'h2':
        out.push(`${'#'.repeat(headingLevel)} ${payload}`);
        break;
      case 'p':
        out.push(String(payload));
        break;
      case 'ul':
        out.push(payload.map((i) => `- ${i}`).join('\n'));
        break;
      case 'ol':
        out.push(payload.map((i, n) => `${n + 1}. ${i}`).join('\n'));
        break;
      case 'note':
        // Blockquote, so a multi-line note stays inside the quote.
        out.push(String(payload).split('\n').map((l) => `> ${l}`).join('\n'));
        break;
      case 'code':
        out.push('```\n' + payload + '\n```');
        break;
      case 'table': {
        const [head, ...rows] = payload;
        out.push([
          `| ${head.map(escapeCell).join(' | ')} |`,
          `| ${head.map(() => '---').join(' | ')} |`,
          ...rows.map((r) => `| ${r.map(escapeCell).join(' | ')} |`),
        ].join('\n'));
        break;
      }
      default:
        throw new Error(`unknown block kind "${kind}" — teach the generator before using it`);
    }
  }
  return out;
}

/* ── the two exports ────────────────────────────────────────────────── */

function buildSingleFile(nav, articles, counts) {
  const L = [
    '# Kevin — Documentation',
    '',
    'Help documentation for Kevin: photo-to-inventory for insurance content adjusters and',
    `estate-sale professionals. ${counts.articles} articles across ${counts.sections} sections.`,
    '',
    '---',
    '',
    '## Contents',
    '',
  ];
  for (const { section, items } of nav) {
    L.push(`**${section}**`, '');
    for (const [, title] of items) L.push(`- [${title}](#${anchorSlug(title)})`);
    L.push('');
  }
  for (const { section, items } of nav) {
    L.push('---', '', `# ${section}`, '');
    for (const [slug, title] of items) {
      const art = articles[slug];
      L.push(`## ${title}`, '');
      if (art.summary) L.push(`_${art.summary}_`, '');
      for (const chunk of renderBlocks(art.blocks || [], 3)) L.push(chunk, '');
    }
  }
  return L.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n';
}

function buildGitbook(nav, articles, counts) {
  const files = new Map();

  const readme = [
    '# Kevin documentation',
    '',
    'Help documentation for [Kevin](https://kevin.co) — photo-to-inventory for insurance',
    'content adjusters and estate-sale professionals.',
    '',
    `${counts.articles} articles across ${counts.sections} sections. \`SUMMARY.md\` is the GitBook table of`,
    'contents; each section is a folder and each article a Markdown file.',
    '',
    '## Importing into GitBook',
    '',
    'Point GitBook at this folder. `SUMMARY.md` defines the structure.',
    '',
    '> Generated by `build-docs-exports.js` from `components/docs-articles*.jsx`.',
    '> Edit the articles there, not these files — anything changed here is overwritten.',
    '',
  ].join('\n');
  files.set('README.md', readme);

  const summary = ['# Table of contents', ''];
  for (const { section, items } of nav) {
    summary.push(`## ${section}`, '');
    for (const [slug, title] of items) {
      summary.push(`* [${title}](${folderSlug(section)}/${slug}.md)`);
    }
    summary.push('');
  }
  files.set('SUMMARY.md', summary.join('\n').trimEnd() + '\n');

  for (const { section, items } of nav) {
    for (const [slug, title] of items) {
      const art = articles[slug];
      const L = [`# ${title}`, ''];
      if (art.summary) L.push(`_${art.summary}_`, '');
      for (const chunk of renderBlocks(art.blocks || [], 2)) L.push(chunk, '');
      files.set(
        `${folderSlug(section)}/${slug}.md`,
        L.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd() + '\n'
      );
    }
  }
  return files;
}

/* ── run ────────────────────────────────────────────────────────────── */

function main() {
  const nav = readDocNav();
  const articles = readArticles();

  // Fail loudly on a nav entry with no article: in the app that is a dead link.
  const navSlugs = nav.flatMap((s) => s.items.map(([slug]) => slug));
  const missing = navSlugs.filter((s) => !articles[s]);
  if (missing.length) throw new Error(`nav entries with no article: ${missing.join(', ')}`);

  const counts = { articles: navSlugs.length, sections: nav.length };
  const orphans = Object.keys(articles).filter((s) => !navSlugs.includes(s));

  const outputs = new Map([['Kevin-docs.md', buildSingleFile(nav, articles, counts)]]);
  for (const [rel, body] of buildGitbook(nav, articles, counts)) {
    outputs.set(path.join('gitbook', rel), body);
  }

  // Anything under gitbook/ this run did not produce is drift — a renamed or
  // removed article leaves its old file behind, and a stale file reads exactly
  // like a current one.
  const stale = [];
  const gitbookDir = path.join(BASE, 'gitbook');
  if (fs.existsSync(gitbookDir)) {
    for (const entry of fs.readdirSync(gitbookDir, { withFileTypes: true, recursive: true })) {
      if (!entry.isFile() || !entry.name.endsWith('.md')) continue;
      const rel = path.relative(BASE, path.join(entry.parentPath || entry.path, entry.name));
      if (!outputs.has(rel)) stale.push(rel);
    }
  }

  let changed = 0;
  for (const [rel, body] of outputs) {
    const abs = path.join(BASE, rel);
    const before = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
    if (before === body) continue;
    changed++;
    if (CHECK) { console.log(`  STALE  ${rel}`); continue; }
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, body, 'utf8');
    console.log(`  ${before === null ? 'new    ' : 'updated'} ${rel}`);
  }

  console.log(
    `\n${counts.articles} articles · ${counts.sections} sections · ${outputs.size} files` +
    ` · ${changed || 'no'} change${changed === 1 ? '' : 's'}`
  );
  if (orphans.length) console.log(`\nArticles with no nav entry (unreachable in the app): ${orphans.join(', ')}`);
  if (stale.length) console.log(`\nFiles under gitbook/ this run did not generate — delete if obsolete:\n  ${stale.join('\n  ')}`);

  if (CHECK && changed) {
    console.log('\nExports are behind the articles. Run: node build-docs-exports.cjs');
    process.exit(1);
  }
}

try {
  main();
} catch (err) {
  console.error(`build-docs-exports: ${err.message}`);
  process.exit(1);
}
