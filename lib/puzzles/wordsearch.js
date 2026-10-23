/**
 * Word searches, each word in the grid exactly once, as a ```wordsearch
 * fence reader plays.
 *
 *   generate(words, n, seed, dirs) -> { grid, placed }
 *   board(grid, words, found)      -> the fence's text
 */

import { random } from '../random.js';

export const DIRS = [[0, 1], [1, 0], [1, 1], [-1, 1], [0, -1], [-1, 0], [-1, -1], [1, -1]];
/** Easier: left to right, top to bottom, and diagonally down. */
export const FORWARD = [[0, 1], [1, 0], [1, 1]];

/** A word as it's hidden: capitals, no spaces. */
export const letters = (w) => w.toUpperCase().replace(/\s+/g, '');

function ray(n, r, c, [dr, dc], len) {
  const cells = [];
  for (let k = 0; k < len; k++) {
    const a = r + dr * k;
    const b = c + dc * k;
    if (a < 0 || a >= n || b < 0 || b >= n) return null;
    cells.push([a, b]);
  }
  return cells;
}

function findAll(grid, word) {
  const n = grid.length;
  const hits = [];
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      for (const d of DIRS) {
        const cells = ray(n, r, c, d, word.length);
        if (cells && cells.every(([a, b], k) => grid[a][b] === word[k])) hits.push(cells);
      }
    }
  }
  return hits;
}

export function generate(words, n, seed, dirs = DIRS) {
  const rng = random(seed);
  const hidden = words.map(letters);
  for (let attempt = 0; attempt < 500; attempt++) {
    const grid = Array.from({ length: n }, () => new Array(n).fill(null));
    const placed = new Map();
    let ok = true;
    for (const w of [...hidden].sort((a, b) => b.length - a.length)) {
      const spots = [];
      for (let r = 0; r < n; r++) {
        for (let c = 0; c < n; c++) {
          for (const d of dirs) {
            const cells = ray(n, r, c, d, w.length);
            if (!cells || !cells.every(([a, b], k) => grid[a][b] === null || grid[a][b] === w[k])) continue;
            const overlap = cells.filter(([a, b]) => grid[a][b] !== null).length;
            spots.push({ overlap, tie: rng.next(), cells });
          }
        }
      }
      if (!spots.length) {
        ok = false;
        break;
      }
      // Favour some overlap, but keep it random.
      spots.sort((x, y) => Math.min(y.overlap, 2) - Math.min(x.overlap, 2) || x.tie - y.tie);
      const { cells } = rng.choice(spots.slice(0, Math.max(1, Math.floor(spots.length / 4))));
      cells.forEach(([a, b], k) => { grid[a][b] = w[k]; });
      placed.set(w, cells);
    }
    if (!ok) continue;
    const pool = hidden.join('');
    for (const row of grid) for (let c = 0; c < n; c++) if (row[c] === null) row[c] = rng.choice(pool);
    if (hidden.every((w) => findAll(grid, w).length === 1)) return { grid, placed };
  }
  throw new Error(`couldn't fit ${words.length} words in ${n}x${n}`);
}

/**
 * The fence's text: the letters a row to a line, the words to find, and,
 * for an answer key, every one of them found.
 */
export function board(grid, words, placed = null) {
  const shown = [...words].map((w) => w.toUpperCase()).sort((a, b) => a.localeCompare(b));
  const lines = grid.map((row) => row.join(' '));
  lines.push(`words: ${shown.join(', ')}`);
  if (placed) {
    const at = ([r, c]) => `r${r + 1}c${c + 1}`;
    lines.push(`found: ${shown.map((w) => {
      const cells = placed.get(letters(w));
      return `${w} ${at(cells[0])}-${at(cells.at(-1))}`;
    }).join(', ')}`);
  }
  return lines.join('\n');
}
