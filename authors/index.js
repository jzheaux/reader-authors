/**
 * The authors, by the name `author` knows each by. Each exports `summary`,
 * `usage` and `run(argv)`.
 */

export const AUTHORS = {
  gc: () => import('./gc/index.js'),
  gutenberg: () => import('./gutenberg/index.js'),
  recipe: () => import('./recipe/index.js'),
};
