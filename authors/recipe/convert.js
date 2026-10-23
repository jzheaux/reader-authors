/**
 * A recipe, as schema.js reads one, written as reader's recipes are: its
 * amounts counts that scale, each ingredient a box with stages and a key
 * its steps are found by, and the steps boxes to mark done.
 *
 *   ## Belgian Waffles
 *   ![Belgian Waffles](images/recipe-belgian-waffles.jpg)
 *   Source: [The Salty Marshmallow](https://…), by Jane Doe
 *
 *   Serves: count:8 | Prep: 15m | Cook: 20m
 *   multiplier:[]
 *
 *   reset:[]
 *
 *   ### Ingredients
 *   * [ ][ ][ ] count:2 1/4 cups all purpose !flour
 *
 *   ### Steps
 *   1) [ ] In a large bowl whisk together the flour, …
 */

import * as md from '../../lib/markdown.js';

/** The recipe's section of a recipes file. `image` is its path from there, if it has one. */
export function recipe(r, { stages = 3, image = '' } = {}) {
  const steps = r.sections.flatMap((s) => s.steps.flatMap((step) => [step.text, ...step.tips])).join('\n');
  const keys = new Set();
  const out = [`## ${text(r.name)}`];
  if (image) out.push(md.image(r.name, image));
  out.push(`Source: ${credit(r)}`, '');

  const facts = [];
  if (r.yield) facts.push(`${r.yield.label}: ${md.count(r.yield.count)}${r.yield.what ? ` ${text(r.yield.what)}` : ''}`);
  if (r.prep) facts.push(`Prep: ${r.prep}`);
  if (r.cook) facts.push(`Cook: ${r.cook}`);
  if (r.total && !(r.prep && r.cook)) facts.push(`Total: ${r.total}`);
  if (facts.length) out.push(facts.join(' | '));
  out.push(md.multiplier(), '', md.reset(), '');

  out.push('### Ingredients');
  for (const i of r.ingredients) out.push(`* ${md.box(stages)} ${ingredient(i, steps, keys)}`);
  out.push('');

  out.push('### Steps');
  for (const section of r.sections) {
    if (section.name && r.sections.length > 1) out.push('', `#### ${text(section.name)}`);
    section.steps.forEach((step, n) => {
      out.push(`${n + 1}) ${md.box()} ${text(step.text)}`);
      for (const tip of step.tips) out.push(md.callout('tip', text(tip)).trimEnd());
    });
  }
  return `${out.join('\n')}\n`;
}

/** Where it's from, and who wrote it: the site linked to the page. */
export function credit(r) {
  const where = r.url ? md.link(text(r.site || r.url), r.url) : text(r.site);
  return r.author && r.author !== r.site ? `${where}, by ${text(r.author)}` : where;
}

/** Text from a page, as reader reads it: as text, never as syntax. */
const text = (t) => md.escapeKeys(md.escape(t));

// Words that say how much or what state an ingredient is in, not what it is.
const UNITS = new Set(`cup cups c tablespoon tablespoons tbsp tbs tbl teaspoon teaspoons tsp ounce ounces oz pound
  pounds lb lbs gram grams g kilogram kilograms kg milliliter milliliters millilitre millilitres ml liter liters
  litre litres l pint pints quart quarts gallon gallons pinch pinches dash dashes clove cloves can cans jar jars
  package packages pkg stick sticks slice slices bunch bunches handful handfuls sprig sprigs head heads piece pieces
  inch inches cm drop drops`.split(/\s+/));
const NOT_IT = new Set(`of and or a an the to for with in into at on as about plus more extra large medium small
  big fresh freshly ground whole chopped diced minced sliced finely roughly thinly coarsely melted softened beaten
  divided sifted packed lightly firmly drained rinsed peeled grated shredded crushed cubed halved quartered separated
  room temperature cold warm hot optional taste needed serving garnish heaping level scant good quality`.split(/\s+/));

// Words that end what an ingredient is, and start what it's for: 'oil plus
// extra for frying', 'lemon wedges to serve'.
const ENDS = new Set(['plus', 'for', 'to']);

/**
 * An ingredient as an item: its amount a count, its unit in lower case, and
 * a key on the word its steps use for it -- the last word naming it, before
 * any comma or 'plus', 'for' or 'to', that a step says, and that no other
 * ingredient already took.
 * If no step says one, its last word: reader flags that it's in no step.
 */
export function ingredient(line, steps, keys = new Set()) {
  const amount = md.leadingAmount(line);
  let rest = amount ? line.slice(amount.length) : line;
  rest = lowered(rest);

  const words = [];
  let depth = 0;
  for (const m of rest.matchAll(/[()[\]]|,|;|\p{L}[\p{L}'’-]*/gu)) {
    const w = m[0];
    if (w === '(' || w === '[') depth++;
    else if (w === ')' || w === ']') depth = Math.max(0, depth - 1);
    else if (depth === 0 && (w === ',' || w === ';' || ENDS.has(w.toLowerCase()))) break;
    else if (depth === 0 && !UNITS.has(w.toLowerCase()) && !NOT_IT.has(w.toLowerCase())) words.push(m);
  }
  const said = words.filter((m) => says(steps, m[0]));
  const pick = [...said].reverse().find((m) => !keys.has(m[0].toLowerCase()))
    ?? [...words].reverse().find((m) => !keys.has(m[0].toLowerCase()))
    ?? words.at(-1);

  const before = pick ? rest.slice(0, pick.index) : rest;
  const after = pick ? rest.slice(pick.index + pick[0].length) : '';
  if (pick) keys.add(pick[0].toLowerCase());
  const key = pick ? md.ingredientKey(pick[0]) : '';
  return `${amount ? md.count(amount) : ''}${text(before)}${key}${text(after)}`;
}

/**
 * Title Case, as some sites write ingredients ('All Purpose Flour'), in
 * lower case, as the rest of a recipe reads; and a unit, after an amount,
 * in lower case. A word in capitals ('BBQ') stays.
 */
function lowered(rest) {
  const words = rest.match(/\p{L}[\p{L}'’-]*/gu) ?? [];
  const title = words.length && words.every((w) => /^\p{Lu}/u.test(w) || NOT_IT.has(w));
  const lower = (w) => (/^\p{Lu}[\p{Ll}'’-]*$/u.test(w) ? w.toLowerCase() : w);
  if (title) return rest.replace(/\p{L}[\p{L}'’-]*/gu, lower);
  return rest.replace(/^(\s*)(\p{L}+)/u, (all, space, w) => (UNITS.has(w.toLowerCase()) ? space + lower(w) : all));
}

/** Whether `steps` says `word`, as reader finds a key: as is, plural or singular. */
function says(steps, word) {
  const k = word.toLowerCase();
  const forms = new Set([k, `${k}s`, `${k}es`]);
  if (k.endsWith('y')) forms.add(`${k.slice(0, -1)}ies`);
  if (k.endsWith('ies')) forms.add(`${k.slice(0, -3)}y`);
  if (k.endsWith('es')) forms.add(k.slice(0, -2));
  if (k.endsWith('s')) forms.add(k.slice(0, -1));
  const any = [...forms].map((f) => f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
  return new RegExp(`(?<![\\p{L}\\p{N}_])(?:${any})(?![\\p{L}\\p{N}_])`, 'iu').test(steps);
}
