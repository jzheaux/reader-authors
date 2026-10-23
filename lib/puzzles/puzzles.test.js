import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { kind } from '../../test/reader.js';
import * as coord from './coord.js';
import * as maze from './maze.js';
import * as sudoku from './sudoku.js';
import * as tracks from './tracks.js';
import * as wordsearch from './wordsearch.js';

const solved = (name, text) => kind(name).solved(kind(name).parse(text));

test('sudoku: one answer, as few clues as asked, the answer filled in when solved', () => {
  const { puzzle, solution } = sudoku.generate(5, 30);
  assert.equal(sudoku.countSolutions(puzzle), 1);
  assert.ok(puzzle.filter(Boolean).length <= 32);
  assert.ok(puzzle.every((v, i) => !v || v === solution[i]));
  assert.equal(solved('sudoku', sudoku.board(puzzle)), false);
  assert.equal(solved('sudoku', sudoku.board(puzzle, solution)), true);
  assert.ok(sudoku.generateAtMost(5, 26).clues <= 28);
});

test('word search: each word in the grid once, found where it was put', () => {
  const words = ['believe', 'honest', 'Holy Ghost', 'true'];
  const { grid, placed } = wordsearch.generate(words, 11, 3, wordsearch.FORWARD);
  assert.equal(grid.length, 11);
  assert.deepEqual([...placed.keys()].sort(), ['BELIEVE', 'HOLYGHOST', 'HONEST', 'TRUE']);
  const text = wordsearch.board(grid, words, placed);
  assert.match(text, /\nwords: BELIEVE, HOLY GHOST, HONEST, TRUE\nfound: BELIEVE r\d+c\d+-r\d+c\d+, HOLY GHOST /);
  assert.equal(solved('wordsearch', wordsearch.board(grid, words)), false);
  assert.equal(solved('wordsearch', text), true);
  assert.throws(() => wordsearch.generate(['toolongforthis'], 5, 1), /couldn't fit/);
});

test('tracks: one answer, from the left to the bottom, laid light when solved', () => {
  const p = tracks.generate(6, 2, 1);
  const sols = tracks.solve(p.n, p.rows, p.cols, p.path[0], p.path.at(-1), p.givens, { budget: 1e7 });
  assert.deepEqual(sols, [p.path]);
  assert.equal(p.path[0] % p.n, 0, 'comes in on the left');
  assert.equal(Math.floor(p.path.at(-1) / p.n), p.n - 1, 'goes out at the bottom');
  assert.equal(p.rows.reduce((a, b) => a + b), p.path.length);
  assert.match(tracks.board(p), /^[\d ]+\n/);
  assert.doesNotMatch(tracks.board(p), /[─│┌┐└┘]/);
  assert.equal(solved('tracks', tracks.board(p)), false);
  assert.equal(solved('tracks', tracks.board(p, true)), true);
});

test('coord: every point, a stroke to a line, all plotted when solved', () => {
  const temple = coord.PICTURES.temple;
  const text = coord.board(temple);
  assert.match(text, /^grid: 20 x 24\n\(3, 1\) \(17, 1\)/);
  assert.match(text, /\nplotted: 0$/);
  assert.equal(coord.points(temple), 51);
  assert.equal(solved('coord', text), false);
  assert.equal(solved('coord', coord.board(temple, true)), true);
  for (const [name, pic] of Object.entries(coord.PICTURES)) {
    assert.ok(kind('coord').parse(coord.board(pic)), `reader reads ${name}`);
  }
});

test('maze: one piece, every cell reached, S at the top and E at the bottom', () => {
  const m = maze.generate(maze.mask('heart', [20, 18]), 4);
  const links = [...m.links.values()].reduce((n, s) => n + s.size, 0) / 2;
  assert.equal(links, m.cells.size - 1, 'a tree: one way between any two cells');
  const board = maze.art(m);
  assert.match(board.split('\n')[0], /S/);
  assert.match(board.trimEnd().split('\n').at(-1), /E/);
  assert.equal(solved('maze', `${board}path:`), false);
  assert.equal(solved('maze', `${board}path: ${maze.way(m)}`), true);
});

test('maze: every shape has cells, and a word needs a font', { skip: !fs.existsSync(maze.FONT) && 'no Arial Black here' }, () => {
  for (const shape of [...Object.keys(maze.DEFAULT_SIZES), 'word:LOVE']) {
    const rows = maze.mask(shape);
    assert.deepEqual([rows[0].length, rows.length], maze.defaultSize(shape), shape);
    assert.ok(rows.flat().filter(Boolean).length > rows.flat().length / 4, `${shape} is mostly shape`);
  }
  assert.throws(() => maze.mask('blob'), /no maze shape blob/);
});
