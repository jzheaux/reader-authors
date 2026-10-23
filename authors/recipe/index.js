/**
 * `author recipe <url>`: a recipe from a page, added to a recipes file,
 * credited to where it's from. See schema.js for how it's found, and
 * convert.js for how it's written.
 */

import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import * as md from '../../lib/markdown.js';
import { append, refuseOver, write } from '../../lib/files.js';
import { read } from './schema.js';
import { recipe } from './convert.js';

export const summary = 'a recipe from a web page, added to a recipes file with its photo, and credited';

export const usage = `usage: author recipe <url> [--out <dir>] [--file <name>] [--stages <list>]
                     [--no-image] [--force]
       author recipe --html <file> [<url>] [options]

Adds the recipe at <url> to the end of <file> in <dir>, with a link to
where it's from and who wrote it, and saves its photo in <dir>/images/.
It's read from the schema.org Recipe that most recipe sites describe
theirs with. A site that turns the script away can be saved from a
browser (Save Page As…) and given with --html; <url>, if given, is what's
credited, or else the page's own.

  --out <dir>        where the recipes file is (default: .)
  --file <name>      the recipes file (default: recipes.md)
  --html <file>      read this saved page, - for stdin, instead of fetching
  --stages <list>    what each ingredient's box goes through, the file's
                     multibox stages if it's new (default: have, out, used);
                     '' for a plain box
  --no-image         leave the photo out
  --force            add it even if the file has it already, and write over
                     a photo of the same name
`;

const BROWSER = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36',
  'Accept-Language': 'en-US,en;q=0.9',
};

export async function run(argv, { log = (s) => process.stderr.write(`${s}\n`), fetch = globalThis.fetch, stdin = process.stdin } = {}) {
  const { values: opts, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    allowNegative: true,
    options: {
      out: { type: 'string', default: '.' },
      file: { type: 'string', default: 'recipes.md' },
      html: { type: 'string' },
      stages: { type: 'string', default: 'have, out, used' },
      image: { type: 'boolean', default: true },
      force: { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (opts.help) {
    process.stdout.write(usage);
    return;
  }
  if (positionals.length > 1) throw usageError(`one url, not ${positionals.length}`);
  const [url] = positionals;
  if (!url && !opts.html) throw usageError('a url, or --html and a saved page');
  if (url && !/^https?:\/\//i.test(url)) throw usageError(`${url} isn't a web address`);

  const html = opts.html ? await saved(opts.html, stdin) : await page(url, fetch);
  const r = read(html, url);
  if (!r) throw new Error(`${url || opts.html} describes no recipe that this can read: no schema.org Recipe in it`);
  if (!r.ingredients.length || !r.sections.length) throw new Error(`${r.name}: the page gives ${r.ingredients.length ? 'no steps' : 'no ingredients'}`);

  const file = path.join(opts.out, opts.file);
  const there = fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
  if (!opts.force && r.url && there.includes(`(${r.url})`)) {
    throw new Error(`${file} has ${r.url} already, so nothing was written (--force adds it again)`);
  }

  const stages = opts.stages.split(',').map((s) => s.trim()).filter(Boolean);
  const image = opts.image && r.image ? await photo(r, { dir: opts.out, force: opts.force, fetch, log }) : '';
  const section = recipe(r, { stages: stages.length, image });

  const start = there.trim()
    ? `${there.endsWith('\n') ? '' : '\n'}\n---\n\n`
    : stages.length > 1 ? `${md.frontMatter({ multibox: { stages: stages.join(', ') } })}\n` : '';
  append(opts.out, opts.file, `${start}${section}`);
  if (there.trim() && stages.length > 1 && !/^\s*stages:/m.test(there)) {
    log(`${file} names no multibox stages, so its boxes are numbered; its front matter can name them:\n${md.frontMatter({ multibox: { stages: stages.join(', ') } })}`);
  }
  log(`added ${r.name} to ${file}${image ? `, its photo in ${path.join(opts.out, image)}` : ''}, from ${r.site || r.url}`);
}

function usageError(message) {
  const err = new Error(message);
  err.code = 'ERR_PARSE_ARGS_RECIPE';
  return err;
}

async function saved(file, stdin) {
  if (file !== '-') return fs.readFileSync(file, 'utf8');
  let text = '';
  for await (const chunk of stdin) text += chunk;
  return text;
}

async function page(url, fetch) {
  const res = await fetch(url, { headers: { ...BROWSER, Accept: 'text/html,application/xhtml+xml' }, redirect: 'follow' });
  if (res.ok) return res.text();
  const away = [401, 403, 429, 503].includes(res.status);
  throw new Error(`${url}: ${res.status} ${res.statusText}${away
    ? '\nThe site turned the script away. Save the page from your browser (Save Page As…, HTML only is enough), and:\n'
      + `  author recipe --html page.html ${url}`
    : ''}`);
}

/**
 * The recipe's photo, saved as images/recipe-<name>.<ext> in `dir`; its
 * path from there, or '' if it couldn't be had, the recipe written without.
 */
async function photo(r, { dir, force, fetch, log }) {
  try {
    const res = await fetch(r.image, { headers: { ...BROWSER, Accept: 'image/*', ...(r.url ? { Referer: r.url } : {}) } });
    if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
    const type = res.headers.get('content-type') ?? '';
    if (!type.startsWith('image/')) throw new Error(`it's ${type || 'not an image'}`);
    const ext = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' }[type.split(';')[0]]
      ?? (/\.(jpe?g|png|webp|gif|avif)(?:$|\?)/i.exec(r.image)?.[1].toLowerCase() ?? 'jpg');
    const name = `images/recipe-${slug(r.name)}.${ext}`;
    if (!force) refuseOver(dir, [name]);
    write(dir, { [name]: Buffer.from(await res.arrayBuffer()) }, { force: true });
    return name;
  } catch (err) {
    if (err.code === 'EEXIST') throw err;
    log(`left out the photo, ${r.image}: ${err.message}`);
    return '';
  }
}

/** A name as a file's: lower case, letters and numbers, dashes between. */
export function slug(name) {
  return name.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'recipe';
}
