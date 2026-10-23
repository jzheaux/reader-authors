/**
 * `author gc`: a General Conference activity packet. See packet.js.
 */

import path from 'node:path';
import { parseArgs } from 'node:util';
import { pathToFileURL } from 'node:url';
import { refuseOver, write } from '../../lib/files.js';
import { anySeed } from '../../lib/random.js';
import { defaultDir, scriptures } from '../../lib/scripture.js';
import { FONT, loadFont } from '../../lib/puzzles/maze.js';
import { build } from './packet.js';

const CONTENT = new URL('./content/2026-10.js', import.meta.url);

export const summary = 'a General Conference activity packet: puzzles with scriptures, and a page for each talk';

export const usage = `usage: author gc [--out <dir>] [--content <file>] [--seed <n>] [--talks <n>]
                 [--scriptures <dir>] [--font <file>] [--force]

Writes packet.md, answers.md and the mazes' boards (mazes/) to <dir>.

  --out <dir>          where to write them (default: .)
  --content <file>     the scriptures, questions and puzzles, a module like
                       authors/gc/content/2026-10.js (default: that one)
  --seed <n>           the same seed makes the same puzzles (default: any)
  --talks <n>          how many talk pages (default: the content's, 32)
  --scriptures <dir>   where the scriptures are kept, fetched there the
                       first time (default: ${defaultDir().replace(process.env.HOME, '~')})
  --font <file>        what word mazes are drawn in (default: Arial Black)
  --force              write over files already there
`;

export async function run(argv, { log = (s) => process.stderr.write(`${s}\n`) } = {}) {
  const { values: opts } = parseArgs({
    args: argv,
    options: {
      out: { type: 'string', default: '.' },
      content: { type: 'string' },
      seed: { type: 'string' },
      talks: { type: 'string' },
      scriptures: { type: 'string' },
      font: { type: 'string', default: FONT },
      force: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (opts.help) {
    process.stdout.write(usage);
    return;
  }
  if (!opts.force) refuseOver(opts.out, ['packet.md', 'answers.md']);
  const seed = opts.seed == null ? anySeed() : whole('--seed', opts.seed);
  const url = opts.content ? pathToFileURL(path.resolve(opts.content)) : CONTENT;
  const content = { ...(await import(url)).default };
  if (opts.talks != null) content.talks = { ...content.talks, pages: whole('--talks', opts.talks) };
  const books = await scriptures(opts.scriptures, { log });
  const words = Object.values(content).flat().some((e) => e?.shape?.startsWith('word:'));
  const font = words ? loadFont(opts.font) : null;

  const files = build(content, { seed, books, font, log });
  const written = write(opts.out, files, { force: opts.force });
  log(`wrote ${written.length} files to ${opts.out}, seed ${seed}`);
}

function whole(name, value) {
  if (!/^\d+$/.test(value)) throw new Error(`${name} must be a whole number, not ${value}`);
  return Number(value);
}
