import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { plain, rendered } from '../../test/reader.js';
import { BOOKS } from './books.js';
import { convert, describe } from './convert.js';
import { defaultCache, run } from './index.js';

const page = (body) => `<html><body><header class="pg-boilerplate">*** START ***</header>${body}<footer class="pg-boilerplate">*** END ***</footer></body></html>`;
const book = (more) => ({ slug: 'x/y', title: 'Y', author: 'X', cite: 'chapter.paragraph', kind: 'prose', ...more });
/** The converted text, after its front matter. */
const text = (html, more) => convert(page(html), book(more)).markdown.split('-----\n\n')[1];

test('front matter says what the book is and how it is cited', () => {
  const { markdown } = convert(page('<p>x</p>'), book({ translator: 'T', published: 1800, edition: 'E' }));
  assert.equal(markdown, '-----\ntitle: Y\nauthor: X\ntranslator: T\npublished: 1800\nedition: E\ncite: chapter.paragraph\n-----\n\nx\n');
});

test('from the start to the end, Gutenberg\'s pages, pictures and contents left out', () => {
  const md = text(`<h1>Title page</h1><table><tr><td>Contents</td></tr></table>
    <p><span class="pagenum"><a id="page_1">{1}</a></span></p>
    <h2><a id="Chapter_I"></a><img src="a.jpg">Chapter I.</h2>
    <p class="nind"><span class="letra">I</span>T is a truth, <i>universally</i> acknowledged.</p>
    <div class="figcenter"><img src="b.jpg"><div class="caption"><p>A picture<span class="pagenum">{2}</span></p></div></div>
    <p>Still<span class="pagenum">{3}</span> more.</p>
    <p class="fint">PRINTED BY</p>`, { start: '#Chapter_I', end: '.fint' });
  assert.equal(md, '{p.1}\n\n## Chapter I\n\nIt is a truth, *universally* acknowledged.\n\n{p.2}\n\nStill{p.3} more.\n');
});

test('a start or end can be named by the words a heading starts with, before a contents line that names it too', () => {
  const md = text('<p class="toc"><a>PART 1.</a></p><h2>PART 1.</h2><p>in</p><div><b>Notes</b><p>out</p></div>', { start: 'text:PART 1.', end: 'text:Notes' });
  assert.equal(md, '## PART 1\n\nin\n');
});

test('a play: speeches with their speaker, lines kept, stage directions in italics', () => {
  const md = text(`<p class="scenedesc">Enter <span class="charname">Polonius</span>.</p>
    <p class="drama">POLONIUS.<br>Give him this money,<br>and these notes.<br></p>
    <p class="right">[<i>Exit.</i>]</p>`, { kind: 'play' });
  assert.equal(md, '*Enter Polonius.*\n\n**POLONIUS**\\\nGive him this money,\\\nand these notes.\n\n*[Exit.]*\n');
});

test('verse keeps a line\'s indent, as no-break spaces', () => {
  const md = text('<p class="poem">\nFrom fairest creatures,<br>\nThat thereby beauty,<br>\n    Pity the world.<br>\n</p>', { kind: 'verse' });
  assert.equal(md, 'From fairest creatures,\\\nThat thereby beauty,\\\n    Pity the world.\n');
});

test('a <pre> is a poem: its lines, their indents, a paragraph to each stanza', () => {
  const md = text('<pre>\n     “Which to secure,\n       no skill\n\n     Mote him\n</pre>');
  assert.equal(md, '“Which to secure,\\\n  no skill\n\nMote him\n');
});

test('chapters numbered before their verses, told from verses by counting', () => {
  const md = text(`<p>Ch. 1. 1. The Tao that can be trodden.</p><p>2. Having no name.</p>
    <p>2. 1. All in the world.</p><p>2.</p><pre>A poem</pre><p>3. The next verse, not chapter 3.</p>`, { chapters: 'Chapter' });
  assert.equal(md, [
    '### Chapter 1', '\\1. The Tao that can be trodden.', '\\2. Having no name.',
    '### Chapter 2', '\\1. All in the world.', '\\2. A poem', '\\3. The next verse, not chapter 3.',
  ].join('\n\n') + '\n');
  // One more than the chapter, where the next verse would be one more than the last.
  const one = text('<p>10. 1. A.</p><p>2. B.</p><p>11. The thirty spokes.</p><p>12.</p><p>1.</p><pre>Colour</pre>', { chapters: 'Chapter' });
  assert.equal(one, '### Chapter 10\n\n\\1. A.\n\n\\2. B.\n\n### Chapter 11\n\nThe thirty spokes.\n\n### Chapter 12\n\n\\1. Colour\n');
});

test('verses numbered chapter:verse get a heading where a chapter starts, counted afresh in each book', () => {
  const md = text('<h2>Genesis</h2><p>1:1 In the beginning</p><p>1:2 And the earth</p><p>2:1 Thus</p><h2>Exodus</h2><p>1:1 Now these</p>', { verseChapters: true });
  assert.equal(md, '## Genesis\n\n### Chapter 1\n\n1:1 In the beginning\n\n1:2 And the earth\n\n### Chapter 2\n\n2:1 Thus\n\n## Exodus\n\n### Chapter 1\n\n1:1 Now these\n');
});

test('what reader would read as its own is escaped; brackets only where they\'d start something', () => {
  const md = text('<p>A: not an answer</p><p>~ not an aside</p><p>1. not a list</p><p>*stars* and [Exit.] and [this]{red} and see:[x]</p>');
  assert.equal(md, '\\A: not an answer\n\n\\~ not an aside\n\n\\1. not a list\n\n\\*stars\\* and [Exit.] and [this\\]{red} and see:\\[x]\n');
});

// Rendered, a book should be headings, paragraphs and quotes, and nothing of reader's own.
const STRANGE = {
  list: /<(?:ul|ol)\b/g,
  aside: /class="gm-aside-cell/g,
  definition: /class="defs"/g,
  exchange: /class="qa\b/g,
  field: /class="field\b/g,
  code: /<code\b/g,
  link: /<a\b/g,
  rule: /<hr\b/g,
};

/** What in `markdown`, rendered by reader, reads as reader's own syntax rather than the book's text. */
function strange(markdown, file) {
  const body = rendered(markdown, {}, file);
  return Object.entries(STRANGE).map(([what, re]) => [what, (body.match(re) ?? []).length]).filter(([, n]) => n);
}

test('a book, as reader renders it, is its text and none of reader\'s syntax', () => {
  const { markdown } = convert(page(`<h2>Chapter I.</h2><p>A: not an answer, Q: nor a question</p>
    <p>~ not an aside</p><p>1. not a list</p><p>- nor this</p><p>! not a definition</p><p>@ not a field</p>
    <p>*stars*, <i>emphasis</i>, \`ticks\` and [a](link) and see:[x]</p><p>---</p>
    <p class="drama">HAMLET.<br>Q: To be,<br>1. or not to be.</p>`), book({ kind: 'play' }));
  assert.deepEqual(strange(markdown, 'x/y.md'), []);
  const body = plain(rendered(markdown, {}, 'x/y.md'));
  for (const s of ['A: not an answer', '~ not an aside', '1. not a list', '! not a definition', '*stars*, emphasis, `ticks` and [a](link) and see:[x]', 'Q: To be,']) {
    assert.ok(body.includes(s), `${s} reads as printed`);
  }
});

test('what a Gutenberg page says of a book not in books.js', () => {
  const head = (metas) => `<html><head><title>T | Project Gutenberg</title>${metas}</head><body></body></html>`;
  assert.deepEqual(describe(head(`<meta name="dc.title" content="Frankenstein; or,
    The modern Prometheus"><meta name="dc.creator" content="Shelley, Mary Wollstonecraft, 1797-1851">`)),
  { title: 'Frankenstein; or, The modern Prometheus', author: 'Mary Wollstonecraft Shelley', translator: undefined });
  assert.deepEqual(describe(head(`<meta name="dc.title" content="The Art of War"><meta name="dc.creator" content="Sunzi, active 6th century B.C.">
    <meta name="marcrel.trl" content="Giles, Lionel, 1875-1958">`)), { title: 'The Art of War', author: 'Sunzi', translator: 'Lionel Giles' });
  assert.deepEqual(describe(head('')), { title: 'T', author: undefined, translator: undefined });
});

/** A place to write to and keep pages in, and a fetch that serves `pages` (id -> html) and counts what it's asked. */
function setup(pages) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gutenberg-'));
  const asked = [];
  const fetch = async (url) => {
    asked.push(url);
    const id = /\/epub\/(\d+)\//.exec(url)[1];
    return pages[id] ? new Response(pages[id]) : new Response('', { status: 404, statusText: 'Not Found' });
  };
  const logged = [];
  const opts = { fetch, log: (s) => logged.push(s), wait: async () => {} };
  const args = (...more) => [...more, '--out', path.join(dir, 'out'), '--cache', path.join(dir, 'cache')];
  return { dir, out: path.join(dir, 'out'), asked, logged, opts, args };
}

const ART = page(`<h1>THE ART OF WAR</h1><h2>Chapter I. LAYING PLANS</h2><p>1. Sun Tzŭ said: The art of war.</p>
  <p>Transcriber’s Notes</p>`);

test('a book it knows is fetched once, written to its slug, and read as books.js says', async () => {
  const { out, asked, logged, opts, args } = setup({ 132: ART });
  await run(args('132'), opts);
  const md = fs.readFileSync(path.join(out, 'sun-tzu/art-of-war.md'), 'utf8');
  assert.equal(md, '-----\ntitle: The Art of War\nauthor: Sun Tzŭ\ntranslator: Lionel Giles\npublished: 1910\ncite: chapter.verse\n-----\n\n'
    + '## Chapter I. LAYING PLANS\n\n\\1. Sun Tzŭ said: The art of war.\n');
  assert.deepEqual(asked, ['https://www.gutenberg.org/cache/epub/132/pg132-images.html']);
  assert.match(logged.at(-1), /art-of-war\.md: 12 words, 1 headings, 1 paragraphs/);

  // Again, by its slug or its address: kept, not fetched, and not written over unless --force.
  await assert.rejects(run(args('sun-tzu/art-of-war'), opts), { code: 'EEXIST' });
  await run(args('https://www.gutenberg.org/ebooks/132', '--force'), opts);
  assert.equal(asked.length, 1);
});

test('a book it doesn\'t know is read as prose, as its page describes it, unless told otherwise', async () => {
  const html = `<html><head><meta name="dc.title" content="Frankenstein; or, The modern Prometheus">
    <meta name="dc.creator" content="Shelley, Mary Wollstonecraft, 1797-1851"></head>
    <body><h1>Frankenstein</h1><h2>Letter 1</h2><p>You will rejoice.</p></body></html>`;
  const { out, logged, opts, args } = setup({ 84: html });
  await run(args('84'), opts);
  assert.equal(fs.readFileSync(path.join(out, 'shelley/frankenstein.md'), 'utf8'),
    '-----\ntitle: Frankenstein; or, The modern Prometheus\nauthor: Mary Wollstonecraft Shelley\ncite: chapter.paragraph\n-----\n\n'
    + '## Frankenstein\n\n## Letter 1\n\nYou will rejoice.\n');
  assert.match(logged.join('\n'), /--start says where the work starts/);

  await run(args('84', '--start', 'text:Letter', '--title', 'Frankenstein', '--published', '1818', '--cite', 'letter.paragraph', '--file', 'f.md'), opts);
  assert.equal(fs.readFileSync(path.join(out, 'f.md'), 'utf8'),
    '-----\ntitle: Frankenstein\nauthor: Mary Wollstonecraft Shelley\npublished: 1818\ncite: letter.paragraph\n-----\n\n## Letter 1\n\nYou will rejoice.\n');
});

test('a saved page is read instead of fetched', async () => {
  const { dir, out, asked, opts, args } = setup({});
  fs.writeFileSync(path.join(dir, 'art.html'), ART);
  await run(args('132', '--html', path.join(dir, 'art.html')), opts);
  assert.ok(fs.existsSync(path.join(out, 'sun-tzu/art-of-war.md')));
  assert.deepEqual(asked, []);
});

test('what it isn\'t given, or can\'t be had, is said', async () => {
  const { opts, args } = setup({});
  await assert.rejects(run(args(), opts), { code: 'ERR_PARSE_ARGS_GUTENBERG', message: /a book/ });
  await assert.rejects(run(args('emma'), opts), { message: /no book emma/ });
  await assert.rejects(run(args('132', '216', '--start', 'x'), opts), { message: /--start is for one book, not 2/ });
  await assert.rejects(run(args('--all', '132'), opts), { message: /not both/ });
  await assert.rejects(run(args('132', '--kind', 'poem'), opts), { message: /--kind is prose, play, verse/ });
  await assert.rejects(run(args('99999999'), opts), { message: /404 Not Found\nGutenberg has no HTML for eBook #99999999/ });
});

// The books themselves, where their pages have been fetched (author gutenberg --all).
for (const b of BOOKS) {
  const file = path.join(defaultCache(), String(b.id), `pg${b.id}.html`);
  test(`${b.slug}, as reader renders it, is its text and none of reader's syntax`, { skip: !fs.existsSync(file) && 'not fetched' }, () => {
    const { markdown } = convert(fs.readFileSync(file, 'utf8'), b);
    assert.deepEqual(strange(markdown, `${b.slug}.md`), []);
  });
}
