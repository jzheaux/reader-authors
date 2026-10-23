/**
 * reader, as what the authors write is checked against it: its renderer,
 * and each kind of puzzle's rules, loaded as its preview loads them. The
 * version is pinned in package.json; moving it on is when an author finds
 * out what changed in reader-markdown.
 */

import fs from 'node:fs';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { render } from 'reader/src/render.js';

export { render };

const kinds = {};

/** A kind of puzzle's `parse`, `format` and `solved`, as reader plays it. */
export function kind(name) {
  if (!kinds[name]) {
    const file = fileURLToPath(import.meta.resolve(`reader/features/puzzles/kinds/${name}.js`));
    const Puzzles = { register: (n, impl) => { kinds[n] = impl; }, owns: () => true, frame: () => ({}) };
    vm.runInNewContext(fs.readFileSync(file, 'utf8'), { Puzzles });
  }
  return kinds[name];
}

/**
 * `markdown` rendered as reader renders `file`, its board files read from
 * `files` (path -> text).
 */
export function rendered(markdown, files = {}, file = 'packet.md') {
  const read = (p) => {
    if (Object.hasOwn(files, p)) return files[p];
    throw new Error(`no such file: ${p}`);
  };
  return render(markdown, { file, read }).body;
}

/**
 * Each puzzle in `markdown`, as its kind reads it: its board file, if it
 * has one, and then its fence.
 */
export function puzzles(markdown, files = {}) {
  const found = [];
  for (const [, name, board, own] of markdown.matchAll(/^```(\w+)(?: (\S+))?\n([\s\S]*?)^```$/gm)) {
    const text = board ? `${files[board].replace(/\n+$/, '')}\n${own}` : own;
    found.push({ name, board, text, state: kind(name).parse(text) });
  }
  return found;
}

/** Text, as it reads with the tags taken out. */
export function plain(html) {
  return html.replace(/<[^>]+>/g, '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'").replace(/&amp;/g, '&');
}
