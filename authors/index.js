/**
 * The authors, by the name `author` knows each by. Each exports `summary`,
 * `usage` and `run(argv)`.
 */

export const AUTHORS = {
  gc: () => import('./gc/index.js'),
  recipe: () => import('./recipe/index.js'),
};
