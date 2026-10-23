import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { kind, plain, puzzles, rendered } from '../../test/reader.js';
import { defaultDir, fromVerses, scriptures, WORKS } from '../../lib/scripture.js';
import { FONT, loadFont } from '../../lib/puzzles/maze.js';
import { build } from './packet.js';
import CONTENT from './content/2026-10.js';

const VERSES = new Map([
  ['Proverbs 3:5', 'Trust in the LORD with all thine heart; and lean not unto thine own understanding.'],
  ['Proverbs 3:6', 'In all thy ways acknowledge him, and he shall direct thy paths.'],
  ['John 13:34', 'A new commandment I give unto you, That ye love one another; as I have loved you, that ye also love one another.'],
  ['Mosiah 4:27', 'And see that all these things are done in wisdom and order; for it is not requisite that a man should run faster than he has strength.'],
  ['D&C 88:119', 'Organize yourselves; prepare every needful thing; and establish a house, even a house of prayer, a house of fasting, a house of faith, a house of learning, a house of glory, a house of order, a house of God;'],
  ['Joshua 24:15', 'And if it seem evil unto you to serve the LORD, choose you this day whom ye will serve; but as for me and my house, we will serve the LORD.'],
  ['Matthew 5:14', 'Ye are the light of the world. A city that is set on an hill cannot be hid.'],
]);
const books = fromVerses(VERSES);
const hasFont = fs.existsSync(FONT);

const CONTENT_SMALL = {
  title: 'Test Packet',
  subtitle: 'April 2027',
  intro: 'Answers are in the answer key.',
  talks: { pages: 2, sessions: ['Sat AM', 'Sun PM'], fields: ["Speaker's Name", 'Topic'] },
  coord: [{ picture: 'temple', ref: 'D&C 88:119', question: 'What can you *organize*?' }],
  wordsearch: [
    { ref: 'Matthew 5:14', title: 'Light', question: 'How can you shine?' },
    { ref: 'Joshua 24:15', excerpt: 'choose you this day whom ye will serve', title: 'Words', theme: ['prophet', 'Holy Ghost', 'temple'], note: 'Find the words.', question: 'Which word?' },
  ],
  tracks: [{ ref: 'Proverbs 3:5-6', question: 'When did you need courage?' }],
  mazes: [
    { shape: 'rect', ref: 'John 13:34', question: 'Who can you include?' },
    { shape: hasFont ? 'word:HI' : 'heart', ref: 'John 13:34', question: 'Who?' },
  ],
  sudoku: [{ ref: 'Mosiah 4:27', question: 'What helps you rest?' }],
};

const font = hasFont ? loadFont() : null;
const small = build(CONTENT_SMALL, { seed: 3, books, font });
const pageOf = (md) => md.split('\n---\n\n');

test('a packet is its pages, an answer key and the mazes\' boards', () => {
  assert.deepEqual(Object.keys(small).sort(), ['answers.md', 'mazes/01-rect.maze', `mazes/02-${hasFont ? 'hi' : 'heart'}.maze`, 'packet.md']);
  const pages = pageOf(small['packet.md']);
  assert.equal(pages.length, 1 + 7 + 2, 'the intro, a page a puzzle, and the talks');
  assert.match(pages[0], /^# Test Packet\n### April 2027\n\nAnswers are in the answer key\.\n$/);
  assert.equal(pages.filter((p) => p.startsWith('## 📝 Conference Talk')).length, 2);
  assert.equal(pageOf(small['answers.md']).length, 1 + 7);
});

test('the same seed makes the same packet, and another seed another', () => {
  assert.deepEqual(build(CONTENT_SMALL, { seed: 3, books, font }), small);
  assert.notEqual(build(CONTENT_SMALL, { seed: 4, books, font })['packet.md'], small['packet.md']);
});

test('each puzzle is one reader plays, unplayed in the packet and solved in the answer key', () => {
  const played = puzzles(small['packet.md'], small);
  const answered = puzzles(small['answers.md'], small);
  // Each kind spread through it: two of a kind a quarter and three quarters in, one halfway.
  assert.deepEqual(played.map((p) => p.name), ['wordsearch', 'maze', 'coord', 'tracks', 'sudoku', 'wordsearch', 'maze']);
  assert.deepEqual(answered.map((p) => p.name), played.map((p) => p.name), 'an answer for each, in order');
  for (const [i, p] of played.entries()) {
    assert.ok(p.state, `reader reads ${p.name}:\n${p.text}`);
    assert.ok(answered[i].state, `reader reads the answer to ${p.name}:\n${answered[i].text}`);
    assert.equal(solved(p), false, `${p.name} isn't solved to start`);
    assert.equal(solved(answered[i]), true, `the answer to ${p.name} is solved`);
    assert.equal(answered[i].board, p.board, 'an answer plays the same board');
  }
});

const solved = (p) => kind(p.name).solved(p.state);

test('reader draws every puzzle, its board files found', () => {
  for (const md of [small['packet.md'], small['answers.md']]) {
    const body = rendered(md, small);
    assert.equal((body.match(/<div class="puzzle" data-kind=/g) ?? []).length, 7);
    assert.doesNotMatch(body, /data-source-error/);
  }
});

test('each scripture reads as it was written, and says where it is from', () => {
  const body = rendered(small['packet.md'], small);
  const quotes = [...body.matchAll(/<blockquote>\n<p>([\s\S]*?)<\/p>\n<p class="quote-by"><em>([^<]*)<\/em><\/p>/g)];
  assert.equal(quotes.length, 7);
  const curly = (s) => s.replace(/’/g, "'");
  const said = new Map(quotes.map(([, text, ref]) => [ref, curly(plain(text))]));
  assert.equal(said.get('Doctrine and Covenants 88:119'), VERSES.get('D&C 88:119'));
  assert.equal(said.get('Proverbs 3:5–6'), `${VERSES.get('Proverbs 3:5')} ${VERSES.get('Proverbs 3:6')}`);
  assert.equal(said.get('Joshua 24:15'), '…choose you this day whom ye will serve…');
  assert.equal(said.get('Matthew 5:14'), VERSES.get('Matthew 5:14'), 'bold words read as the verse does');
});

test('the page has nothing on it reader would read as more than text', () => {
  const body = rendered(small['packet.md'], small);
  for (const [what, re] of Object.entries({ list: /<(?:ul|ol)\b/, aside: /gm-aside-cell/, exchange: /class="qa\b/, definition: /class="defs"/, link: /<a\b/ })) {
    assert.doesNotMatch(body, re, what);
  }
  assert.equal((body.match(/class="field"/g) ?? []).length, 7 + 2 * 3, 'an answer a puzzle; a session, a name and a topic a talk');
  assert.equal((body.match(/type="radio"/g) ?? []).length, 2 * 2);
});

test('a word search bolds the verse\'s words to find, or lists a theme of its own', () => {
  const pages = pageOf(small['packet.md']);
  const light = pages.find((p) => p.includes('**Light**'));
  assert.match(light, /\*\*light\*\* of the \*\*world\*\*/);
  assert.match(light, /\*Find the \*\*bold\*\* words from the scripture\.\*/);
  const theme = pages.find((p) => p.includes('**Words**'));
  assert.match(theme, /words: HOLY GHOST, PROPHET, TEMPLE\n/);
  assert.match(theme, /\*Find the words\.\*/);
  assert.doesNotMatch(theme, /\*\*choose\*\*/);
});

test('every reference in the October 2026 packet is in the scriptures', { skip: !WORKS.every((w) => fs.existsSync(`${defaultDir()}/${w}.json`)) && 'the scriptures aren\'t fetched yet (run author gc once)' }, async () => {
  const all = await scriptures();
  for (const kind of ['coord', 'wordsearch', 'tracks', 'mazes', 'sudoku']) {
    for (const e of CONTENT[kind]) assert.doesNotThrow(() => all.lookup(e.ref, e.excerpt), `${kind}: ${e.ref}`);
  }
});
