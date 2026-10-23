/**
 * Random numbers from a seed, so the same seed makes the same puzzles.
 *
 *   const rng = random(7);
 *   rng.next()          // [0, 1)
 *   rng.int(6)          // 0..5
 *   rng.choice(xs)      // one of xs
 *   rng.shuffle(xs)     // xs, shuffled in place
 *   rng.sample(xs, k)   // k of xs, in a random order
 */

export function random(seed) {
  let a = seed >>> 0;
  // mulberry32
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const int = (n) => Math.floor(next() * n);
  const shuffle = (xs) => {
    for (let i = xs.length - 1; i > 0; i--) {
      const j = int(i + 1);
      [xs[i], xs[j]] = [xs[j], xs[i]];
    }
    return xs;
  };
  return {
    next,
    int,
    choice: (xs) => xs[int(xs.length)],
    shuffle,
    sample: (xs, k) => shuffle([...xs]).slice(0, k),
  };
}

/** A seed for when none is given. */
export function anySeed() {
  return Math.floor(Math.random() * 1_000_000);
}
