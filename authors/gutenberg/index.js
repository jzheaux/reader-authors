/**
 * `author gutenberg <book>`: a book from Project Gutenberg, in
 * reader-markdown. See books.js for the books it knows how to read, and
 * convert.js for how one is written.
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { refuseOver, write } from '../../lib/files.js';
import { BOOKS } from './books.js';
import { convert, describe } from './convert.js';

export const summary = 'a book from Project Gutenberg, without its pictures, contents or Gutenberg\'s pages';

export const usage = `usage: author gutenberg <book> ... [--out <dir>] [--cache <dir>] [--force]
       author gutenberg --all [options]
       author gutenberg <book> [--file <name>] [--html <file>] [how it's read]
       author gutenberg --list

Writes each <book> to <dir>/<slug>.md, from its HTML on gutenberg.org,
fetched once into <cache>. A <book> is its eBook number there, its
gutenberg.org address, or the slug of one of the books it knows (--list).
A book it knows is read as books.js says; any other as prose from the top
of its page, its title, author and translator as Gutenberg catalogs them,
unless told otherwise:

  --out <dir>          where to write them (default: .)
  --cache <dir>        where pages are kept, fetched there the first time
                       (default: ${defaultCache().replace(os.homedir(), '~')})
  --all                every book it knows
  --list               the books it knows, and how each is cited
  --force              write over files already there

For one book:

  --file <name>        the file to write, in <dir> (default: <slug>.md)
  --html <file>        read this saved page instead of fetching
  --kind <kind>        prose, play (speakers in bold, directions in
                       italics) or verse (its lines kept)
  --start <where>      where the work starts: a CSS selector, or text: and
                       the words its first heading or paragraph starts with
                       (text:CHAPTER I.)
  --end <where>        where it ends, as --start, not itself included
  --drop <where>       something in it to leave out; again for more
  --cite <how>         how a place in it is cited (chapter.paragraph)
  --title, --author, --translator, --published, --edition <text>
                       what its front matter says
`;

const HOW = ['kind', 'start', 'end', 'drop', 'cite', 'title', 'author', 'translator', 'published', 'edition'];
const KINDS = ['prose', 'play', 'verse'];
const AGENT = 'reader-authors (author gutenberg)';

export function defaultCache() {
  const cache = process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache');
  return path.join(cache, 'reader-authors', 'gutenberg');
}

export async function run(argv, {
  log = (s) => process.stderr.write(`${s}\n`),
  fetch = globalThis.fetch,
  wait = (ms) => new Promise((r) => setTimeout(r, ms)),
} = {}) {
  const { values: opts, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      out: { type: 'string', default: '.' },
      cache: { type: 'string', default: defaultCache() },
      all: { type: 'boolean', default: false },
      list: { type: 'boolean', default: false },
      force: { type: 'boolean', default: false },
      file: { type: 'string' },
      html: { type: 'string' },
      ...Object.fromEntries(HOW.map((k) => [k, { type: 'string', ...(k === 'drop' ? { multiple: true } : {}) }])),
      help: { type: 'boolean', short: 'h' },
    },
  });
  if (opts.help) {
    process.stdout.write(usage);
    return;
  }
  if (opts.list) {
    process.stdout.write(BOOKS.map((b) => `${String(b.id).padStart(5)}  ${b.slug.padEnd(36)}${b.cite}\n`).join(''));
    return;
  }

  const asked = opts.all ? BOOKS.map((b) => String(b.id)) : positionals;
  if (opts.all && positionals.length) throw usageError('--all, or books, not both');
  if (!asked.length && !opts.html) throw usageError('a book: its number on gutenberg.org, or one of --list');
  const how = HOW.filter((k) => opts[k] !== undefined);
  if (asked.length > 1) {
    const one = [...how, ...['file', 'html'].filter((k) => opts[k] !== undefined)];
    if (one.length) throw usageError(`--${one[0]} is for one book, not ${asked.length}`);
  }
  if (opts.kind && !KINDS.includes(opts.kind)) throw usageError(`--kind is ${KINDS.join(', ')}, not ${opts.kind}`);

  const books = asked.length ? asked.map(known) : [{ id: null }];
  // What's there already, before the work of fetching.
  if (!opts.force) refuseOver(opts.out, books.filter((b) => b.slug).map((b) => opts.file ?? `${b.slug}.md`));

  let fetched = false;
  for (let book of books) {
    let html;
    if (opts.html) {
      html = fs.readFileSync(opts.html, 'utf8');
    } else {
      const cached = path.join(opts.cache, String(book.id), `pg${book.id}.html`);
      if (!fs.existsSync(cached)) {
        // Gently: one book at a time, a pause between them.
        if (fetched) await wait(2000);
        html = await page(book.id, fetch, log, opts.cache);
        fs.mkdirSync(path.dirname(cached), { recursive: true });
        fs.writeFileSync(cached, html);
        fetched = true;
      } else {
        html = fs.readFileSync(cached, 'utf8');
      }
    }

    const unknown = !book.slug;
    if (unknown) book = { ...book, kind: 'prose', cite: 'chapter.paragraph', ...describe(html) };
    for (const k of how) book[k] = opts[k];
    if (unknown) {
      book.title ??= book.id ? `Project Gutenberg eBook #${book.id}` : 'Untitled';
      // Filed under its author's last name and its title, without its subtitle, as the books it knows are.
      const surname = book.author?.split(/\s+/).at(-1);
      book.slug = [surname && slug(surname), slug(book.title.split(/[;:]/)[0])].filter(Boolean).join('/');
      if (!opts.start) log(`${book.slug}: read from the top of its page, as it isn't one of --list; --start says where the work starts`);
      if (!opts.force && !opts.file) refuseOver(opts.out, [`${book.slug}.md`]);
    }

    const { markdown, stats } = convert(html, book);
    const file = opts.file ?? `${book.slug}.md`;
    write(opts.out, { [file]: markdown }, { force: true });
    const words = markdown.split(/\n-----\n/).slice(1).join('').split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
    log(`wrote ${path.join(opts.out, file)}: ${words} words, ${stats.headings} headings, ${stats.paragraphs} paragraphs, ${stats.pages} pages, ${stats.lines} lines`);
  }
}

/**
 * The book `arg` names, as books.js reads it, or just its number if it's
 * one books.js doesn't have.
 */
function known(arg) {
  const id = /^\d+$/.test(arg) ? arg : /gutenberg\.org\/(?:ebooks|cache\/epub|files)\/(\d+)/.exec(arg)?.[1];
  const book = BOOKS.find((b) => String(b.id) === id || b.slug === arg);
  if (book) return { ...book };
  if (!id) throw usageError(`no book ${arg}: give its number on gutenberg.org, or one of --list`);
  return { id: Number(id) };
}

async function page(id, fetch, log, cache) {
  const url = `https://www.gutenberg.org/cache/epub/${id}/pg${id}-images.html`;
  log(`fetching ${url} into ${cache}`);
  const res = await fetch(url, { headers: { 'User-Agent': AGENT } });
  if (!res.ok) throw new Error(`${url}: ${res.status} ${res.statusText}${res.status === 404 ? `\nGutenberg has no HTML for eBook #${id}` : ''}`);
  return res.text();
}

function usageError(message) {
  const err = new Error(message);
  err.code = 'ERR_PARSE_ARGS_GUTENBERG';
  return err;
}

/** A name as a file's: lower case, letters and numbers, dashes between. */
function slug(name) {
  return name.normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'book';
}
