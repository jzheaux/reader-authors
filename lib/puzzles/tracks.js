/**
 * Train tracks with exactly one answer, as a ```tracks fence reader plays.
 *
 * One track runs from the left edge (A) to the bottom (B), never branching
 * or crossing itself; the numbers say how many squares in each row and
 * column it runs through. Some pieces are given.
 *
 *   generate(n, seed, extraGivens) -> { n, rows, cols, path, givens }
 *   board(p, solved)               -> the fence's text
 *
 * A square is `r * n + c`; a piece is the directions it joins, as bits.
 */

import { random } from '../random.js';

const N = 1;
const S = 2;
const W = 4;
const E = 8;
const DIRS = [N, S, W, E];
const STEP = { [N]: [-1, 0], [S]: [1, 0], [W]: [0, -1], [E]: [0, 1] };
const OPP = { [N]: S, [S]: N, [W]: E, [E]: W };

const straight = (piece) => piece === (N | S) || piece === (W | E);

function dirTo([r1, c1], [r2, c2]) {
  if (r2 < r1) return N;
  if (r2 > r1) return S;
  return c2 < c1 ? W : E;
}

const step = ([r, c], d) => [r + STEP[d][0], c + STEP[d][1]];

/** Each square of the path, and the piece it holds. */
function piecesOf(path, n) {
  const ext = [step(path[0], W), ...path, step(path.at(-1), S)];
  const pieces = new Map();
  for (let i = 1; i < ext.length - 1; i++) {
    pieces.set(ext[i][0] * n + ext[i][1], dirTo(ext[i], ext[i - 1]) | dirTo(ext[i], ext[i + 1]));
  }
  return pieces;
}

function makePath(n, rng, target) {
  const r0 = rng.int(n - 1);
  const c1 = 1 + rng.int(n - 1);
  const path = [];
  for (let c = 0; c <= c1; c++) path.push([r0, c]);
  for (let r = r0 + 1; r < n; r++) path.push([r, c1]);
  const on = new Set(path.map(([r, c]) => r * n + c));
  let stall = 0;
  while (path.length < target && stall < 5000) {
    const i = rng.int(path.length - 1);
    const [a, b] = [path[i], path[i + 1]];
    const off = rng.choice(a[0] === b[0] ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]]);
    const c = [a[0] + off[0], a[1] + off[1]];
    const e = [b[0] + off[0], b[1] + off[1]];
    if ([c, e].every(([r, cc]) => r >= 0 && r < n && cc >= 0 && cc < n && !on.has(r * n + cc))) {
      path.splice(i + 1, 0, c, e);
      on.add(c[0] * n + c[1]);
      on.add(e[0] * n + e[1]);
      stall = 0;
    } else {
      stall++;
    }
  }
  return path;
}

/**
 * Up to `limit` answers (each its squares in order), or null if the search
 * ran past `budget` steps, which isn't proof there's only one.
 */
export function solve(n, rows, cols, start, end, givens, { limit = 2, budget = 300000 } = {}) {
  let nodes = 0;
  const total = rows.reduce((a, b) => a + b, 0);
  const rc = new Array(n).fill(0);
  const cc = new Array(n).fill(0);
  const visited = new Uint8Array(n * n);
  const path = [];
  const sols = [];
  const [er, ec] = [Math.floor(end / n), end % n];
  const next = (k, d) => {
    const r = Math.floor(k / n) + STEP[d][0];
    const c = (k % n) + STEP[d][1];
    return r >= 0 && r < n && c >= 0 && c < n ? r * n + c : -1;
  };
  // A square, and the given squares whose pieces point into it.
  const pointedAt = new Map();
  for (const [g, piece] of givens) {
    for (const d of DIRS) {
      if (!(piece & d)) continue;
      const k = next(g, d);
      if (k >= 0) pointedAt.set(k, [...(pointedAt.get(k) ?? []), g]);
    }
  }
  const enter = (k) => {
    visited[k] = 1;
    path.push(k);
    rc[Math.floor(k / n)]++;
    cc[k % n]++;
  };
  const leave = (k) => {
    visited[k] = 0;
    path.pop();
    rc[Math.floor(k / n)]--;
    cc[k % n]--;
  };
  const full = (k) => rc[Math.floor(k / n)] >= rows[Math.floor(k / n)] || cc[k % n] >= cols[k % n];

  // From `cur`, over squares still free: the exit, every given not yet
  // reached, and every row and column still short must all be in reach.
  function feasible(cur) {
    const seen = new Uint8Array(n * n);
    seen[cur] = 1;
    const stack = [cur];
    const rr = new Array(n).fill(0);
    const cr = new Array(n).fill(0);
    while (stack.length) {
      const p = stack.pop();
      for (const d of DIRS) {
        const q = next(p, d);
        if (q < 0 || seen[q] || visited[q] || full(q)) continue;
        seen[q] = 1;
        rr[Math.floor(q / n)]++;
        cr[q % n]++;
        stack.push(q);
      }
    }
    if (!seen[end]) return false;
    for (const g of givens.keys()) if (!visited[g] && !seen[g]) return false;
    for (let i = 0; i < n; i++) if (rows[i] - rc[i] > rr[i] || cols[i] - cc[i] > cr[i]) return false;
    return true;
  }

  function dfs(cur, came) { // came: the way back to the square before
    if (sols.length >= limit || nodes > budget) return;
    nodes++;
    if (cur === end) {
      if (rc.every((v, i) => v === rows[i]) && cc.every((v, i) => v === cols[i]) && [...givens.keys()].every((g) => visited[g])) {
        sols.push([...path]);
      }
      return;
    }
    const remaining = total - path.length;
    if (remaining <= 0) return;
    const outs = givens.has(cur) ? givens.get(cur) & ~came : 15 & ~came;
    const prev = next(cur, came);
    for (const d of DIRS) {
      if (!(outs & d)) continue;
      const nxt = next(cur, d);
      if (nxt < 0 || visited[nxt] || full(nxt)) continue;
      if (givens.has(nxt) && !(givens.get(nxt) & OPP[d])) continue;
      if ((pointedAt.get(cur) ?? []).some((g) => g !== prev && g !== nxt)) continue;
      if (Math.abs(Math.floor(nxt / n) - er) + Math.abs((nxt % n) - ec) > remaining - 1) continue;
      if (nxt === end && remaining !== 1) continue;
      enter(nxt);
      if (nxt === end || feasible(nxt)) dfs(nxt, OPP[d]);
      leave(nxt);
    }
  }

  enter(start);
  dfs(start, W);
  return nodes > budget ? null : sols;
}

export function generate(n, seed, extraGivens = 0) {
  const rng = random(seed);
  let path;
  for (;;) {
    path = makePath(n, rng, Math.floor(n * n * 0.6));
    const pieces = piecesOf(path, n);
    const turns = path.filter(([r, c]) => !straight(pieces.get(r * n + c))).length;
    if (turns >= path.length * 0.4) break;
  }
  const keys = path.map(([r, c]) => r * n + c);
  const pieces = piecesOf(path, n);
  const rows = Array.from({ length: n }, (_, r) => path.filter((p) => p[0] === r).length);
  const cols = Array.from({ length: n }, (_, c) => path.filter((p) => p[1] === c).length);
  const [start, end] = [keys[0], keys.at(-1)];
  let givens = new Map([[start, pieces.get(start)], [end, pieces.get(end)]]);
  for (const k of rng.sample(keys.slice(1, -1), Math.floor(n / 2))) givens.set(k, pieces.get(k));
  const unique = (g, budget) => {
    const sols = solve(n, rows, cols, start, end, g, { budget });
    return sols !== null && sols.length === 1;
  };
  // Give pieces till there's one answer.
  for (;;) {
    const sols = solve(n, rows, cols, start, end, givens);
    if (sols !== null && sols.length === 1) break;
    let differ;
    if (sols === null) {
      differ = keys.filter((k) => !givens.has(k));
    } else {
      const other = sols.find((s) => s.some((k, i) => k !== keys[i]));
      const theirs = piecesOf(other.map((k) => [Math.floor(k / n), k % n]), n);
      differ = keys.filter((k) => !givens.has(k) && theirs.get(k) !== pieces.get(k));
    }
    const k = rng.choice(differ);
    givens.set(k, pieces.get(k));
  }
  // Then take back the ones it doesn't need.
  for (const k of rng.sample([...givens.keys()], givens.size)) {
    if (k === start || k === end) continue;
    const trial = new Map(givens);
    trial.delete(k);
    if (unique(trial)) givens = trial;
  }
  // And give some back, for an easier puzzle.
  const spare = keys.filter((k) => !givens.has(k));
  for (const k of rng.sample(spare, Math.min(extraGivens, spare.length))) givens.set(k, pieces.get(k));
  if (!unique(givens, 1e7)) throw new Error(`tracks ${n}x${n} seed ${seed} has more than one answer`);
  return { n, rows, cols, path: keys, givens, pieces };
}

const HEAVY = { [W | E]: '━', [N | S]: '┃', [S | E]: '┏', [S | W]: '┓', [N | E]: '┗', [N | W]: '┛' };
const LIGHT = { [W | E]: '─', [N | S]: '│', [S | E]: '┌', [S | W]: '┐', [N | E]: '└', [N | W]: '┘' };

/**
 * The fence's text: the column counts, each row's squares (given pieces
 * heavy, the rest `·`) and its count, then where the track comes in and
 * goes out. Solved, the rest of the track is laid, light.
 */
export function board(p, solved = false) {
  const { n } = p;
  const [start, end] = [p.path[0], p.path.at(-1)];
  const on = new Set(p.path);
  const lines = [p.cols.join(' ')];
  for (let r = 0; r < n; r++) {
    const cells = [];
    for (let c = 0; c < n; c++) {
      const k = r * n + c;
      cells.push(p.givens.has(k) ? HEAVY[p.givens.get(k)] : solved && on.has(k) ? LIGHT[p.pieces.get(k)] : '·');
    }
    lines.push(`${cells.join(' ')}  ${p.rows[r]}`);
  }
  lines.push(`A: left ${Math.floor(start / n) + 1}  B: bottom ${(end % n) + 1}`);
  return lines.join('\n');
}
