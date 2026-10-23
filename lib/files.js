/**
 * What an author made, written where it was asked to go.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Writes `files` (path in `dir` -> text). A file already there is left
 * alone, and nothing is written, unless `force`: what's in it may have been
 * written in by hand, or played.
 */
export function write(dir, files, { force = false } = {}) {
  if (!force) refuseOver(dir, Object.keys(files));
  for (const [f, text] of Object.entries(files)) {
    const out = path.join(dir, f);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, text);
  }
  return Object.keys(files);
}

/**
 * Throws if any of `names` is already in `dir`: before the work of making
 * them, as well as before writing them.
 */
export function refuseOver(dir, names) {
  const there = names.filter((f) => fs.existsSync(path.join(dir, f)));
  if (there.length) {
    const err = new Error(`already in ${dir}, so nothing was written (--force writes over them):\n  ${there.join('\n  ')}`);
    err.code = 'EEXIST';
    throw err;
  }
}
