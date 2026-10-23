import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import * as md from './markdown.js';
import { write } from './files.js';
import { random } from './random.js';
import { bold, fromVerses, keywords } from './scripture.js';

test('the same seed gives the same numbers', () => {
  const a = random(7);
  const b = random(7);
  const xs = Array.from({ length: 5 }, () => a.next());
  assert.deepEqual(Array.from({ length: 5 }, () => b.next()), xs);
  assert.notDeepEqual(Array.from({ length: 5 }, () => random(8).next()), xs);
  assert.ok(xs.every((x) => x >= 0 && x < 1));
  assert.deepEqual(random(1).shuffle([1, 2, 3, 4]).sort(), [1, 2, 3, 4]);
  assert.equal(new Set(random(1).sample([1, 2, 3, 4], 3)).size, 3);
});

test('markdown: text reads as text', () => {
  assert.equal(md.escape('a *b* _c_ `d` <e> [f]'), 'a \\*b\\* \\_c\\_ \\`d\\` \\<e> [f]');
  assert.equal(md.escape('see [this](x) and scripture:[John 1:1]'), 'see [this\\](x) and scripture:\\[John 1:1]');
  assert.equal(md.escapeLineStart('1. And it came to pass'), '\\1. And it came to pass');
  assert.equal(md.escapeLineStart('Q: who?'), '\\Q: who?');
  assert.equal(md.escapeLineStart('And it came to pass'), 'And it came to pass');
});

test('markdown: quotes, fields, fences and pages', () => {
  assert.equal(md.quote('one\ntwo', 'John 1:1'), '> one\n> two\n>\n> — *John 1:1*\n');
  assert.equal(md.field('Name'), '@ Name:');
  assert.equal(md.field('Notes', { lines: 3, value: 'hi' }), '@ Notes::: hi');
  assert.equal(md.choiceField('Session', ['Sat AM', 'Sun PM']), '@ Session: ( ) Sat AM ( ) Sun PM');
  assert.equal(md.fence('maze', 'path:\n', 'mazes/a.maze'), '```maze mazes/a.maze\npath:\n```\n');
  assert.equal(md.pages(['# One\n\n', 'Two']), '# One\n\n---\n\nTwo\n');
});

const books = fromVerses(new Map([
  ['Proverbs 3:5', 'Trust in the LORD with all thine heart;'],
  ['Proverbs 3:6', 'and he shall direct thy paths.'],
  ['D&C 4:6', 'Remember faith, virtue, knowledge.'],
  ['Psalms 46:10', 'Be still, and know that I am God: I will be exalted.'],
]));

test('scripture is looked up, a range of verses or an excerpt', () => {
  assert.deepEqual(books.lookup('Proverbs 3:5-6'), { ref: 'Proverbs 3:5–6', text: 'Trust in the LORD with all thine heart; and he shall direct thy paths.' });
  assert.equal(books.lookup('D&C 4:6').ref, 'Doctrine and Covenants 4:6');
  assert.deepEqual(books.lookup('Psalms 46:10', 'Be still, and know that I am God'), { ref: 'Psalm 46:10', text: 'Be still, and know that I am God…' });
  assert.equal(books.lookup('Proverbs 3:5-6', 'he shall direct thy paths.').text, '…he shall direct thy paths.');
  assert.throws(() => books.lookup('Proverbs 3:7'), /no verse Proverbs 3:7/);
  assert.throws(() => books.lookup('Psalms 46:10', 'not there'), /doesn't say/);
  assert.throws(() => books.lookup('Proverbs'), /can't read/);
});

test('a verse\'s words to find: none common, none twice, none inside another', () => {
  assert.deepEqual(keywords('Love one another, as I have loved you; love one another.'), ['ONE', 'ANOTHER', 'LOVED']);
  assert.equal(keywords('alpha bravo charlie delta', { max: 2 }).length, 2);
  assert.equal(bold('Love one another', ['LOVE', 'another']), '**Love** one **another**');
});

test('files already there are left alone, unless forced', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'authors-'));
  write(dir, { 'a.md': 'one', 'sub/b.maze': 'two' });
  assert.equal(fs.readFileSync(path.join(dir, 'sub/b.maze'), 'utf8'), 'two');
  fs.writeFileSync(path.join(dir, 'a.md'), 'played');
  assert.throws(() => write(dir, { 'a.md': 'new', 'c.md': 'three' }), (err) => err.code === 'EEXIST' && /a\.md/.test(err.message));
  assert.equal(fs.readFileSync(path.join(dir, 'a.md'), 'utf8'), 'played');
  assert.equal(fs.existsSync(path.join(dir, 'c.md')), false, 'nothing is written');
  write(dir, { 'a.md': 'new' }, { force: true });
  assert.equal(fs.readFileSync(path.join(dir, 'a.md'), 'utf8'), 'new');
  fs.rmSync(dir, { recursive: true });
});
