/**
 * A General Conference activity packet, from its content (see
 * content/2026-10.js): puzzle pages, each a scripture, a puzzle and a
 * question to think about, with a page for each talk mixed in, and an
 * answer key with every puzzle solved.
 *
 *   build(content, { seed, books, font, log }) -> { 'packet.md': ..., 'answers.md': ..., 'mazes/01-heart.maze': ... }
 *
 * `books` looks up scripture (lib/scripture.js); `font` draws word mazes.
 */

import * as md from '../../lib/markdown.js';
import { bold, keywords } from '../../lib/scripture.js';
import * as coord from '../../lib/puzzles/coord.js';
import * as maze from '../../lib/puzzles/maze.js';
import * as sudoku from '../../lib/puzzles/sudoku.js';
import * as tracks from '../../lib/puzzles/tracks.js';
import * as wordsearch from '../../lib/puzzles/wordsearch.js';

/** A value going from lo to hi as i goes from 0 to count - 1. */
const ramp = (i, count, lo, hi) => lo + ((hi - lo) * i) / Math.max(1, count - 1);
/** Which third of its kind a puzzle is in: 0, 1 or 2. */
const third = (i, count) => Math.min(2, Math.floor((i * 3) / count));
const titleCase = (s) => s.toLowerCase().replace(/\b\w/g, (ch) => ch.toUpperCase());

const SEEDS = { wordsearch: 200, tracks: 100, mazes: 300, sudoku: 400 };

/**
 * A puzzle page: the scripture, how to play, the puzzle, and a question.
 * `text` is the scripture's, already markdown.
 */
function page({ ref, text }, { how, puzzle, question }) {
  const lines = text.split('\n').map(md.escapeLineStart).join('\n');
  return `${md.quote(lines, ref)}\n${how ? `${how}\n\n` : ''}${puzzle}\n:bulb: **Think about it:** ${question}\n\n${md.field('My Answer')}\n`;
}

const scripture = (books, e) => {
  const { ref, text } = books.lookup(e.ref, e.excerpt);
  return { ref, text: md.escape(text) };
};

const KINDS = {
  coord(e, i, { books }) {
    const picture = coord.PICTURES[e.picture];
    if (!picture) throw new Error(`no picture ${e.picture}: try ${Object.keys(coord.PICTURES).join(', ')}`);
    const title = `Mystery Picture #${i + 1}`;
    return {
      title: `${title}: ${titleCase(e.picture.replace(/-/g, ' ')).replace('Ctr', 'CTR')}`,
      page: page(scripture(books, e), {
        puzzle: `**${title}:** *Plot the points in order, connecting them. Lift your pencil at STOP.*\n\n${md.fence('coord', coord.board(picture))}`,
        question: e.question,
      }),
      answer: md.fence('coord', coord.board(picture, true)),
    };
  },

  wordsearch(e, i, { books, seed, count }) {
    const verse = scripture(books, e);
    let words = e.theme;
    let how = `*${e.note ?? 'Find the words in the puzzle.'}*`;
    if (!words) {
      words = e.words ?? keywords(books.lookup(e.ref, e.excerpt).text);
      verse.text = bold(verse.text, words);
      how = '*Find the **bold** words from the scripture.*';
    }
    const longest = Math.max(...words.map((w) => wordsearch.letters(w).length));
    const n = Math.max(longest + 1, i < 6 ? 13 : words.length <= 14 ? 15 : 16);
    const easy = i < Math.floor(count / 3);
    const { grid, placed } = wordsearch.generate(words, n, seed, easy ? wordsearch.FORWARD : wordsearch.DIRS);
    return {
      title: `Word Search: ${e.title} (${easy ? 'Easy' : 'Hard'})`,
      page: page(verse, { how, puzzle: `**${e.title}**\n\n${md.fence('wordsearch', wordsearch.board(grid, words))}`, question: e.question }),
      answer: md.fence('wordsearch', wordsearch.board(grid, words, placed)),
    };
  },

  tracks(e, i, { books, seed, count }) {
    const level = third(i, count);
    const p = tracks.generate([8, 9, 10][level], seed, [2, 1, 0][level]);
    const title = `Train Tracks #${i + 1}: ${['Medium', 'Hard', 'Expert'][level]}`;
    return {
      title,
      page: page(scripture(books, e), {
        how: "*Lay one track from **A** to **B**. It can't branch or cross itself. The numbers tell how many squares in each row and column have track.*",
        puzzle: `**${title}**\n\n${md.fence('tracks', tracks.board(p))}`,
        question: e.question,
      }),
      answer: md.fence('tracks', tracks.board(p, true)),
    };
  },

  mazes(e, i, { books, seed, font, all }) {
    let size = null;
    if (e.shape === 'rect') {
      const rects = all.filter((x) => x.shape === 'rect');
      const w = Math.round(ramp(rects.indexOf(e), rects.length, 32, 46));
      size = [w, Math.round(w * 1.3)];
    }
    const m = maze.generate(maze.mask(e.shape, size, { font }), seed);
    const name = e.shape.replace(/^word:/, '');
    const title = e.shape === 'rect' ? `Maze #${i + 1}` : `Maze #${i + 1}: ${titleCase(name)}`;
    const file = `mazes/${String(i + 1).padStart(2, '0')}-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.maze`;
    return {
      title,
      files: { [file]: maze.art(m) },
      page: page(scripture(books, e), {
        how: '*Find your way from **S** to **E**.*',
        puzzle: `**${title}**\n\n${md.fence('maze', 'path:\nnotes:', file)}`,
        question: e.question,
      }),
      answer: md.fence('maze', `path: ${maze.way(m)}\nnotes:`, file),
    };
  },

  sudoku(e, i, { books, seed, count }) {
    const { puzzle, solution } = sudoku.generateAtMost(seed, Math.round(ramp(i, count, 34, 23)));
    const title = `Sudoku #${i + 1}: ${['Medium', 'Hard', 'Expert'][third(i, count)]}`;
    return {
      title,
      page: page(scripture(books, e), {
        how: '*Fill every row, column, and 3×3 box with the numbers 1–9.*',
        puzzle: `**${title}**\n\n${md.fence('sudoku', sudoku.board(puzzle))}`,
        question: e.question,
      }),
      answer: md.fence('sudoku', sudoku.board(puzzle, solution)),
    };
  },
};

/**
 * Each kind spread evenly through the packet, keeping its own order (which
 * is also the order it gets harder in).
 */
function order(content) {
  const slots = [];
  Object.keys(KINDS).forEach((kind, k) => {
    const items = content[kind] ?? [];
    items.forEach((_, i) => slots.push({ at: (i + 0.5) / items.length, k, kind, i }));
  });
  return slots.sort((a, b) => a.at - b.at || a.k - b.k);
}

function talkPage(talks) {
  const fields = talks.fields.map((f) => md.field(f)).join('\n');
  return `## 📝 Conference Talk\n\n${md.choiceField('Session', talks.sessions)}\n\n${fields}\n`;
}

export function build(content, { seed, books, font, log = () => {} }) {
  const puzzles = order(content);
  const talks = content.talks;
  const pageCount = talks?.pages ?? 0;
  // Talk pages go evenly between the puzzles.
  const after = new Set(Array.from({ length: pageCount }, (_, j) => Math.round(((j + 1) * puzzles.length) / (pageCount + 1))));
  const pages = [`# ${content.title}\n### ${content.subtitle}\n\n${content.intro}\n`];
  const answers = [];
  const files = {};
  let talksLeft = pageCount;
  puzzles.forEach(({ kind, i }, pos) => {
    const all = content[kind];
    const made = KINDS[kind](all[i], i, { books, font, all, count: all.length, seed: seed * 1000 + SEEDS[kind] + i });
    pages.push(made.page);
    answers.push(`### Page ${pages.length}: ${made.title}\n\n${made.answer}`);
    Object.assign(files, made.files);
    log(`page ${String(pages.length).padStart(3)}  ${made.title}`);
    if (after.has(pos + 1) && talksLeft) {
      pages.push(talkPage(talks));
      talksLeft--;
    }
  });
  for (; talksLeft; talksLeft--) pages.push(talkPage(talks));
  const made = `*${content.title}, ${content.subtitle}. \`author gc --seed ${seed}\` makes these same puzzles again.*\n`;
  return {
    'packet.md': md.pages(pages),
    'answers.md': md.pages([`# Answer Key\n\n${made}`, ...answers]),
    ...files,
  };
}
