/**
 * Mazes in a shape -- a rectangle, a heart, a word, a cross -- as a board
 * reader plays in a ```maze fence.
 *
 * The shape is drawn on a grid of cells. Whatever cells of it can't be
 * reached from the rest are left out, so the maze is always one piece. It
 * starts at the top (S) and ends at the bottom (E).
 *
 *   mask(shape, size, { font })  -> rows of true/false, true in the shape
 *   generate(mask, seed)         -> the maze
 *   art(maze)                    -> its board, drawn with + - |
 *   way(maze)                    -> its answer, as `path:` moves
 */

import fs from 'node:fs';
import opentype from 'opentype.js';
import { random } from '../random.js';

export const FONT = '/System/Library/Fonts/Supplemental/Arial Black.ttf';

// Shapes as unions of polygons in unit coordinates (x right, y down, 0..1).
function star(cx, cy, ro, ri, n = 5) {
  const pts = [];
  for (let k = 0; k < 2 * n; k++) {
    const a = (Math.PI * k) / n - Math.PI / 2;
    const r = k % 2 === 0 ? ro : ri;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

export const SHAPES = {
  cross: [[[0.36, 0], [0.64, 0], [0.64, 1], [0.36, 1]],
    [[0.08, 0.2], [0.92, 0.2], [0.92, 0.44], [0.08, 0.44]]],
  star: [star(0.5, 0.54, 0.52, 0.23)],
  temple: [[[0.04, 0.56], [0.96, 0.56], [0.96, 1], [0.04, 1]],
    [[0.3, 0.32], [0.7, 0.32], [0.7, 0.57], [0.3, 0.57]],
    [[0.38, 0.19], [0.62, 0.19], [0.62, 0.33], [0.38, 0.33]],
    [[0.4, 0.2], [0.5, 0.0], [0.6, 0.2]]],
  shield: [[[0.04, 0.06], [0.5, 0], [0.96, 0.06], [0.96, 0.5], [0.82, 0.78], [0.5, 1],
    [0.18, 0.78], [0.04, 0.5]]],
  church: [[[0.04, 0.46], [0.72, 0.46], [0.72, 1], [0.04, 1]],
    [[0.0, 0.48], [0.36, 0.2], [0.73, 0.48]],
    [[0.7, 0.3], [0.96, 0.3], [0.96, 1], [0.7, 1]],
    [[0.7, 0.31], [0.83, 0.0], [0.96, 0.31]]],
  book: [[[0.02, 0.1], [0.26, 0.03], [0.5, 0.1], [0.5, 0.97], [0.26, 0.9], [0.02, 0.97]],
    [[0.98, 0.1], [0.74, 0.03], [0.5, 0.1], [0.5, 0.97], [0.74, 0.9], [0.98, 0.97]]],
};

// Width and height, in cells, when no size is given. A word is 16 wide a letter.
export const DEFAULT_SIZES = { rect: [40, 52], heart: [60, 53], ...Object.fromEntries(Object.keys(SHAPES).map((k) => [k, [50, 58]])) };
export const WORD_WIDTH = 16;
export const WORD_HEIGHT = 30;

const grid = (w, h, inside) => Array.from({ length: h }, (_, r) => Array.from({ length: w }, (_, c) => inside(r, c)));

function heart(w, h) {
  return grid(w, h, (r, c) => {
    const x = ((c + 0.5) / w) * 2.6 - 1.3;
    const y = 1.22 - ((r + 0.5) / h) * 2.27;
    return (x * x + y * y - 1) ** 3 - x * x * y ** 3 <= 0;
  });
}

/** Even-odd: inside `poly` if a ray from (x, y) crosses it an odd number of times. */
function inside(x, y, poly) {
  let hit = false;
  for (let i = 0; i < poly.length; i++) {
    const [x1, y1] = poly.at(i - 1);
    const [x2, y2] = poly[i];
    if ((y1 > y) !== (y2 > y) && x < x1 + ((y - y1) * (x2 - x1)) / (y2 - y1)) hit = !hit;
  }
  return hit;
}

function polygons(polys, w, h) {
  return grid(w, h, (r, c) => polys.some((p) => inside((c + 0.5) / w, (r + 0.5) / h, p)));
}

/** Nonzero winding, as a font's outlines are filled. */
function winding(x, y, contours) {
  let n = 0;
  for (const poly of contours) {
    for (let i = 0; i < poly.length; i++) {
      const [x1, y1] = poly.at(i - 1);
      const [x2, y2] = poly[i];
      const side = (x2 - x1) * (y - y1) - (x - x1) * (y2 - y1);
      if (y1 <= y && y2 > y && side > 0) n++;
      else if (y1 > y && y2 <= y && side < 0) n--;
    }
  }
  return n !== 0;
}

/** A font's outlines of `text`, curves flattened into polygons. */
function outlines(text, font) {
  const contours = [];
  let cur = null;
  let at = [0, 0];
  const SEG = 8;
  for (const cmd of font.getPath(text, 0, 0, 200).commands) {
    if (cmd.type === 'M') {
      cur = [[cmd.x, cmd.y]];
      contours.push(cur);
    } else if (cmd.type === 'L') {
      cur.push([cmd.x, cmd.y]);
    } else if (cmd.type === 'Q') {
      for (let k = 1; k <= SEG; k++) {
        const t = k / SEG;
        const u = 1 - t;
        cur.push([u * u * at[0] + 2 * u * t * cmd.x1 + t * t * cmd.x, u * u * at[1] + 2 * u * t * cmd.y1 + t * t * cmd.y]);
      }
    } else if (cmd.type === 'C') {
      for (let k = 1; k <= SEG; k++) {
        const t = k / SEG;
        const u = 1 - t;
        cur.push([
          u ** 3 * at[0] + 3 * u * u * t * cmd.x1 + 3 * u * t * t * cmd.x2 + t ** 3 * cmd.x,
          u ** 3 * at[1] + 3 * u * u * t * cmd.y1 + 3 * u * t * t * cmd.y2 + t ** 3 * cmd.y,
        ]);
      }
    }
    if (cmd.type !== 'Z') at = [cmd.x, cmd.y];
  }
  return contours.filter((c) => c.length > 2);
}

/**
 * `text` stretched over w x h cells: a cell is in if most of it is ink
 * (sampled 3 x 3; at least 4 of 9).
 */
function lettering(text, w, h, font) {
  const contours = outlines(text, font);
  const xs = contours.flat().map((p) => p[0]);
  const ys = contours.flat().map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  return grid(w, h, (r, c) => {
    let ink = 0;
    for (const dy of [1 / 6, 1 / 2, 5 / 6]) {
      for (const dx of [1 / 6, 1 / 2, 5 / 6]) {
        ink += winding(x0 + ((c + dx) / w) * (x1 - x0), y0 + ((r + dy) / h) * (y1 - y0), contours);
      }
    }
    return ink >= 4;
  });
}

/** Letters joined by a bar along the bottom, so the whole word is one maze. */
function word(text, w, h, font, bar = 3) {
  const rows = lettering(text, w, h - bar + 1, font);
  const cols = [...Array(w).keys()].filter((c) => rows.some((row) => row[c]));
  for (let k = 0; k < bar - 1; k++) rows.push(Array.from({ length: w }, (_, c) => c >= cols[0] && c <= cols.at(-1)));
  return rows;
}

export function loadFont(file = FONT) {
  const buf = fs.readFileSync(file);
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
}

/** Width and height when no size is given. */
export function defaultSize(shape) {
  if (shape.startsWith('word:')) return [WORD_WIDTH * shape.slice(5).length, WORD_HEIGHT];
  if (!DEFAULT_SIZES[shape]) throw new Error(`no maze shape ${shape}: try ${[...Object.keys(DEFAULT_SIZES), 'word:TEXT'].join(', ')}`);
  return DEFAULT_SIZES[shape];
}

/**
 * 'rect', 'heart', 'word:LOVE', or a SHAPES key, `size` ([w, h]) cells
 * wide and tall. A word needs `font` (loadFont()).
 */
export function mask(shape, size = null, { font } = {}) {
  const [w, h] = size ?? defaultSize(shape);
  if (shape === 'rect') return grid(w, h, () => true);
  if (shape === 'heart') return heart(w, h);
  if (shape.startsWith('word:')) return word(shape.slice(5), w, h, font ?? loadFont());
  if (!SHAPES[shape]) defaultSize(shape);
  return polygons(SHAPES[shape], w, h);
}

const MOVES = [[1, 0, 'D'], [-1, 0, 'U'], [0, 1, 'R'], [0, -1, 'L']];

/** The cells next to `k` that are in the maze, as keys. */
function neighbors(m, k) {
  const r = Math.floor(k / m.w);
  const c = k % m.w;
  return MOVES.map(([dr, dc]) => [r + dr, c + dc])
    .filter(([a, b]) => a >= 0 && a < m.h && b >= 0 && b < m.w && m.cells.has(a * m.w + b))
    .map(([a, b]) => a * m.w + b);
}

function largest(rows, w, h) {
  const seen = new Set();
  let best = new Set();
  for (let k = 0; k < w * h; k++) {
    if (!rows[Math.floor(k / w)][k % w] || seen.has(k)) continue;
    const part = new Set([k]);
    const queue = [k];
    seen.add(k);
    while (queue.length) {
      const p = queue.shift();
      const [r, c] = [Math.floor(p / w), p % w];
      for (const [dr, dc] of MOVES) {
        const [a, b] = [r + dr, c + dc];
        const q = a * w + b;
        if (a >= 0 && a < h && b >= 0 && b < w && rows[a][b] && !seen.has(q)) {
          seen.add(q);
          part.add(q);
          queue.push(q);
        }
      }
    }
    if (part.size > best.size) best = part;
  }
  return best;
}

/**
 * A maze over the largest piece of `rows`: `cells` and the `links` between
 * them, as keys (`r * w + c`), from `start` (top row, left-most) to `end`
 * (bottom row, right-most, or its middle if it's a tip).
 */
export function generate(rows, seed) {
  const rng = random(seed);
  const [w, h] = [rows[0].length, rows.length];
  const m = { w, h, cells: largest(rows, w, h), links: new Map() };
  if (!m.cells.size) throw new Error('the shape has no cells at that size');
  for (const k of m.cells) m.links.set(k, new Set());
  const first = Math.min(...m.cells);
  const stack = [first];
  const seen = new Set([first]);
  while (stack.length) { // recursive backtracker, without the recursion
    const cur = stack.at(-1);
    const open = neighbors(m, cur).filter((k) => !seen.has(k));
    if (!open.length) {
      stack.pop();
      continue;
    }
    const next = rng.choice(open);
    m.links.get(cur).add(next);
    m.links.get(next).add(cur);
    seen.add(next);
    stack.push(next);
  }
  m.start = first;
  const bottom = Math.floor(Math.max(...m.cells) / w);
  const row = [...m.cells].filter((k) => Math.floor(k / w) === bottom).sort((a, b) => a - b);
  m.end = row.length > 2 ? row.at(-1) : row[Math.floor(row.length / 2)];
  return m;
}

/** The way from start to end, as keys. */
export function solve(m) {
  const prev = new Map([[m.start, null]]);
  const queue = [m.start];
  while (queue.length) {
    const p = queue.shift();
    for (const q of m.links.get(p)) {
      if (!prev.has(q)) {
        prev.set(q, p);
        queue.push(q);
      }
    }
  }
  const way = [];
  for (let p = m.end; p !== null; p = prev.get(p)) way.push(p);
  return way.reverse();
}

/** The answer as reader's `path:` moves: U, D, L and R, a count after one for more of it. */
export function way(m) {
  const cells = solve(m);
  const runs = [];
  for (let i = 1; i < cells.length; i++) {
    const d = cells[i] - cells[i - 1];
    const move = d === m.w ? 'D' : d === -m.w ? 'U' : d === 1 ? 'R' : 'L';
    if (runs.length && runs.at(-1)[0] === move) runs.at(-1)[1]++;
    else runs.push([move, 1]);
  }
  return runs.map(([move, n]) => (n > 1 ? `${move}${n}` : move)).join(' ');
}

/**
 * The maze drawn with + corners, - and | walls: the board reader plays (see
 * reader's features/puzzles/kinds/maze.js). It's open at both ends, S in the
 * gap in the wall over the start and E in the gap under the end. Cells
 * outside the shape are blank.
 */
export function art(m) {
  const has = (r, c) => r >= 0 && r < m.h && c >= 0 && c < m.w && m.cells.has(r * m.w + c);
  const wall = (r1, c1, r2, c2) => has(r1, c1) !== has(r2, c2) || (has(r1, c1) && !m.links.get(r1 * m.w + c1).has(r2 * m.w + c2));
  const [sr, sc] = [Math.floor(m.start / m.w), m.start % m.w];
  const [er, ec] = [Math.floor(m.end / m.w), m.end % m.w];
  let lines = [];
  for (let r = 0; r <= m.h; r++) {
    let top = '';
    for (let c = 0; c <= m.w; c++) {
      top += has(r - 1, c - 1) || has(r - 1, c) || has(r, c - 1) || has(r, c) ? '+' : ' ';
      if (c < m.w) {
        top += r === sr && c === sc ? 'S '
          : r - 1 === er && c === ec ? 'E '
            : wall(r - 1, c, r, c) ? '--' : '  ';
      }
    }
    lines.push(top);
    if (r === m.h) break;
    let row = '';
    for (let c = 0; c <= m.w; c++) {
      row += wall(r, c - 1, r, c) ? '|' : ' ';
      if (c < m.w) row += '  ';
    }
    lines.push(row);
  }
  lines = lines.map((line) => line.trimEnd());
  while (lines.length && !lines[0]) lines.shift();
  while (lines.length && !lines.at(-1)) lines.pop();
  const lead = Math.min(...lines.filter(Boolean).map((line) => line.length - line.trimStart().length));
  return `${lines.map((line) => line.slice(lead)).join('\n')}\n`;
}
