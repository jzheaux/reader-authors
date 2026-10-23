/**
 * Sudoku with exactly one answer, as a ```sudoku fence reader plays.
 *
 *   generate(seed, clues) -> { puzzle, solution }   (81 numbers, 0 for blank)
 *   board(puzzle, played) -> the fence's text
 */

import { random } from '../random.js';

function candidates(g, i) {
  const r = Math.floor(i / 9);
  const c = i % 9;
  const used = new Set();
  for (let k = 0; k < 9; k++) {
    used.add(g[r * 9 + k]);
    used.add(g[k * 9 + c]);
  }
  const br = 3 * Math.floor(r / 3);
  const bc = 3 * Math.floor(c / 3);
  for (let rr = br; rr < br + 3; rr++) for (let cc = bc; cc < bc + 3; cc++) used.add(g[rr * 9 + cc]);
  const out = [];
  for (let d = 1; d <= 9; d++) if (!used.has(d)) out.push(d);
  return out;
}

/** Counts answers up to `limit`; with `rng`, fills `g` with the first one found. */
function solve(g, limit, rng) {
  let best = -1;
  let cands = null;
  for (let i = 0; i < 81; i++) {
    if (g[i]) continue;
    const cs = candidates(g, i);
    if (best < 0 || cs.length < cands.length) {
      best = i;
      cands = cs;
      if (cs.length <= 1) break;
    }
  }
  if (best < 0) return 1;
  if (rng) rng.shuffle(cands);
  let count = 0;
  for (const d of cands) {
    g[best] = d;
    count += solve(g, limit - count, rng);
    if (count >= limit) {
      if (rng) return count; // keep the filled grid
      break;
    }
  }
  g[best] = 0;
  return count;
}

export function countSolutions(g, limit = 2) {
  return solve([...g], limit);
}

export function generate(seed, clues = 26) {
  const rng = random(seed);
  const solution = new Array(81).fill(0);
  solve(solution, 1, rng);
  const puzzle = [...solution];
  for (const i of rng.shuffle([...Array(81).keys()])) {
    if (puzzle.filter(Boolean).length <= clues) break;
    const j = 80 - i; // symmetric pairs, like a published puzzle
    const saved = [puzzle[i], puzzle[j]];
    puzzle[i] = puzzle[j] = 0;
    if (countSolutions(puzzle) !== 1) [puzzle[i], puzzle[j]] = saved;
  }
  return { puzzle, solution };
}

/**
 * Tries seeds after `seed` until one gets down to `clues` (some grids
 * can't), keeping the one with fewest.
 */
export function generateAtMost(seed, clues, tries = 40) {
  let best = null;
  for (let attempt = 0; attempt < tries; attempt++) {
    const p = generate(seed + 1000 * attempt, clues);
    p.clues = p.puzzle.filter(Boolean).length;
    if (!best || p.clues < best.clues) best = p;
    if (p.clues <= clues) break;
  }
  return best;
}

/**
 * The fence's text: each row the givens, then the board as played (the
 * givens, to start; the answer, for an answer key).
 */
export function board(puzzle, played = puzzle) {
  const row = (g, r) => [0, 1, 2]
    .map((b) => g.slice(r * 9 + b * 3, r * 9 + b * 3 + 3).map((v) => v || '.').join(' '))
    .join(' | ');
  const rule = '------+-------+------';
  const lines = [];
  for (let r = 0; r < 9; r++) {
    if (r === 3 || r === 6) lines.push(`${rule}    ${rule}`);
    lines.push(`${row(puzzle, r)}    ${row(played, r)}`);
  }
  return lines.join('\n');
}
