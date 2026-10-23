import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { AMOUNT, plain, rendered } from '../../test/reader.js';
import * as md from '../../lib/markdown.js';
import { duration, read } from './schema.js';
import { ingredient, recipe } from './convert.js';
import { run, slug } from './index.js';

const page = (name) => fs.readFileSync(new URL(`./pages/${name}`, import.meta.url), 'utf8');
const graph = read(page('graph.html'));
const plainPage = read(page('plain.html'));
const STAGES = md.frontMatter({ multibox: { stages: 'have, out, used' } });

test('a recipe is read from a @graph, its author found by @id and its text decoded', () => {
  assert.equal(graph.name, 'Lemon Griddle Cakes');
  assert.equal(graph.author, 'Pat Cook');
  assert.equal(graph.site, 'Test Kitchen');
  assert.equal(graph.url, 'https://kitchen.example/lemon-griddle-cakes/');
  assert.equal(graph.image, 'https://kitchen.example/img/cakes.jpg');
  assert.deepEqual(graph.yield, { count: '6', label: 'Serves' });
  assert.equal(graph.prep, '10m');
  assert.equal(graph.cook, '1h 5m');
  assert.equal(graph.ingredients[4], '1½ cups buttermilk, cold');
  assert.deepEqual(graph.sections.map((s) => s.name), ['Batter', 'Cooking']);
  assert.equal(graph.sections[0].steps[1].text, 'In another bowl beat the eggs with the buttermilk, lemon zest & juice. Don’t over*mix* it!');
  assert.deepEqual(graph.sections[0].steps[1].tips, ['Cold buttermilk makes for a thicker batter.']);
  assert.equal(graph.sections[1].steps[0].text, 'Melt a little butter on a hot griddle and pour on 1/4 cup of batter per cake.');
  assert.equal(graph.sections[1].steps[1].text, 'Serve warm with maple syrup.', 'its own numbering taken off');
});

test('a recipe is read on its own, its steps one string and its image an object', () => {
  assert.equal(plainPage.name, 'Garlic Toast');
  assert.equal(plainPage.author, 'Sam and Ana');
  assert.equal(plainPage.site, 'Other Recipes');
  assert.equal(plainPage.url, 'https://other.example/recipes/toast');
  assert.equal(plainPage.image, 'https://other.example/toast.png');
  assert.deepEqual(plainPage.yield, { count: '8', label: 'Makes', what: 'slices' });
  assert.equal(plainPage.total, '15m');
  assert.deepEqual(plainPage.sections[0].steps.map((s) => s.text), ['Heat the oven.', 'Spread the garlic on the bread and toast 5 minutes.', 'Season with salt.']);
});

test('the url given is the one credited, and a page with no recipe is none', () => {
  assert.equal(read(page('graph.html'), 'https://given.example/').url, 'https://given.example/');
  assert.equal(read('<html><script type="application/ld+json">{"@type":"Article","name":"x"}</script></html>'), null);
  assert.equal(read('<html><script type="application/ld+json">{not json</script></html>'), null);
});

test('durations read as a cook writes them', () => {
  assert.equal(duration('PT90M'), '1h 30m');
  assert.equal(duration('PT2H'), '2h');
  assert.equal(duration('P0DT0H35M'), '35m');
  assert.equal(duration('PT0M'), '');
  assert.equal(duration(undefined), '');
});

test('an amount is one reader scales, as reader reads it', () => {
  for (const s of ['2 cups', '1 1/2 cups', '1/4 tsp', '½ cup', '1½ cups', '0.75 l', '2-3 tbsp', '1–2 chilies', '2 to 3 eggs', '100g flour', 'Salt', 'a pinch']) {
    assert.equal(md.leadingAmount(s), AMOUNT.exec(s)?.[0] ?? null, s);
  }
});

test('an ingredient\'s key is the word its steps call it, one no other ingredient took', () => {
  const steps = 'Whisk the flour and baking powder. Beat the egg whites. Add the vanilla extract and the oil, then the brown sugar and the sugar.';
  const keys = new Set();
  assert.equal(ingredient('2 1/4 Cups All Purpose Flour', steps, keys), 'count:2 1/4 cups all purpose !flour');
  assert.equal(ingredient('1 Tablespoon Baking Powder', steps, keys), 'count:1 tablespoon baking !powder');
  assert.equal(ingredient('2 Large Eggs (Separated)', steps, keys), 'count:2 large !eggs (separated)');
  assert.equal(ingredient('1 tsp vanilla extract', steps, keys), 'count:1 tsp vanilla !extract');
  assert.equal(ingredient('1 tbsp sunflower or vegetable oil plus extra for frying', steps, keys), 'count:1 tbsp sunflower or vegetable !oil plus extra for frying');
  assert.equal(ingredient('1 cup brown sugar', steps, keys), 'count:1 cup brown !sugar');
  assert.equal(ingredient('1/2 cup granulated sugar', steps, keys), 'count:1/2 cup !granulated sugar', 'sugar was taken');
  assert.equal(ingredient('Kosher salt, to taste', steps, keys), 'Kosher !salt, to taste', 'in no step, its last word');
  assert.equal(ingredient('2 Cups milk', '', new Set()), 'count:2 cups !milk', 'a unit in lower case');
  assert.equal(ingredient('1 BBQ Sauce', 'Add the sauce', new Set()), 'count:1 BBQ !sauce');
});

test('text from a page reads as text', () => {
  assert.equal(md.escapeKeys('Wow!Really, !great'), 'Wow!Really, \\!great');
  assert.equal(ingredient('1 * 2 _test_', 'test', new Set()), 'count:1 \\* 2 \\_!test\\_');
  assert.equal(md.image('A [b]', 'images/a b(1).jpg'), '![A \\[b\\]](images/a%20b%281%29.jpg)');
});

test('reader reads the recipe it writes: counts that scale, keys in its steps, boxes with stages', () => {
  const doc = `${STAGES}\n${recipe(graph, { image: 'images/recipe-lemon-griddle-cakes.jpg' })}`;
  assert.match(doc, /^## Lemon Griddle Cakes\n!\[Lemon Griddle Cakes\]\(images\/recipe-lemon-griddle-cakes\.jpg\)\nSource: \[Test Kitchen\]\(https:\/\/kitchen\.example\/lemon-griddle-cakes\/\), by Pat Cook\n\nServes: count:6 \| Prep: 10m \| Cook: 1h 5m\n/m);
  const body = rendered(doc, {}, 'recipes.md');
  assert.equal((body.match(/class="multiplier"/g) ?? []).length, 1);
  assert.equal((body.match(/class="count" data-multiplier=/g) ?? []).length, 1 + 7, 'the servings, and each ingredient with an amount');
  assert.equal((body.match(/<li[^>]*class="(?:[^"]* )?ingredient[ "]/g) ?? []).length, 8);
  assert.doesNotMatch(body, /ingredient-unused/, 'each ingredient is in a step');
  assert.equal((body.match(/class="stage-box"/g) ?? []).length, 8);
  assert.match(body, /class="stage-box"[^>]*title="not started; next, have"/, 'its stages named by the front matter');
  assert.equal((body.match(/<li[^>]*class="(?:[^"]* )?step[ "]/g) ?? []).length, 4);
  assert.match(body, /class="[^"]*alert-tip/);
  assert.match(body, /<a href="https:\/\/kitchen\.example\/lemon-griddle-cakes\/">Test Kitchen<\/a>/);
  assert.match(plain(body), /Don’t over\*mix\* it!/, 'as written, not emphasized');
  assert.match(body, /<h4[^>]*>Batter<\/h4>/);
});

test('one section of steps has no heading of its own', () => {
  const doc = recipe(plainPage, { stages: 1 });
  assert.doesNotMatch(doc, /^####/m);
  assert.match(doc, /^\* \[ \] count:8 slices !bread$/m);
  assert.match(doc, /^Makes: count:8 slices \| Total: 15m$/m);
  assert.match(doc, /^Source: \[Other Recipes\]\(https:\/\/other\.example\/recipes\/toast\), by Sam and Ana$/m);
});

test('names are files\' names', () => {
  assert.equal(slug('Crème Brûlée (Easy!)'), 'creme-brulee-easy');
  assert.equal(slug('!!!'), 'recipe');
});

const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0]);

function fakeFetch(pages) {
  const asked = [];
  const fetch = async (url) => {
    asked.push(url);
    const got = pages[url];
    if (!got) return new Response('', { status: 403, statusText: 'Forbidden' });
    return new Response(got.body, { status: 200, headers: { 'content-type': got.type } });
  };
  return { fetch, asked };
}

test('author recipe adds each recipe to the file, with its photo, and not one twice', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'recipe-'));
  const logged = [];
  const { fetch } = fakeFetch({
    'https://kitchen.example/lemon-griddle-cakes/': { body: page('graph.html'), type: 'text/html' },
    'https://kitchen.example/img/cakes.jpg': { body: JPEG, type: 'image/jpeg' },
  });
  const log = (s) => logged.push(s);

  await run(['https://kitchen.example/lemon-griddle-cakes/', '--out', dir], { fetch, log });
  const first = fs.readFileSync(path.join(dir, 'recipes.md'), 'utf8');
  assert.ok(first.startsWith(`${STAGES}\n## Lemon Griddle Cakes\n`));
  assert.deepEqual(fs.readFileSync(path.join(dir, 'images/recipe-lemon-griddle-cakes.jpg')), JPEG);

  await assert.rejects(run(['https://kitchen.example/lemon-griddle-cakes/', '--out', dir], { fetch, log }), /has https:\/\/kitchen\.example\/lemon-griddle-cakes\/ already/);

  // A saved page, its photo turned away: written without one.
  await run(['--html', new URL('./pages/plain.html', import.meta.url).pathname, '--out', dir], { fetch, log });
  const both = fs.readFileSync(path.join(dir, 'recipes.md'), 'utf8');
  assert.equal(both, `${first}\n---\n\n${recipe(plainPage)}`);
  assert.match(logged.join('\n'), /left out the photo, https:\/\/other\.example\/toast\.png: 403/);
  assert.equal(rendered(both, {}, 'recipes.md').match(/class="multiplier"/g).length, 2, 'a multiplier for each');
});

test('a site that turns the script away is told how to give the page instead', async () => {
  const { fetch } = fakeFetch({});
  await assert.rejects(run(['https://blocked.example/r', '--out', os.tmpdir()], { fetch, log: () => {} }), /403[\s\S]*author recipe --html page\.html https:\/\/blocked\.example\/r/);
  await assert.rejects(run([], { fetch }), { code: /^ERR_PARSE_ARGS/ });
  await assert.rejects(run(['not-a-url'], { fetch }), { code: /^ERR_PARSE_ARGS/ });
});

test('a file with no stages named is told how to name them', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'recipe-'));
  fs.writeFileSync(path.join(dir, 'recipes.md'), '## Toast\n\nBread, toasted.');
  const logged = [];
  await run(['--html', new URL('./pages/plain.html', import.meta.url).pathname, '--out', dir, '--no-image'], { fetch: fakeFetch({}).fetch, log: (s) => logged.push(s) });
  assert.ok(fs.readFileSync(path.join(dir, 'recipes.md'), 'utf8').startsWith('## Toast\n\nBread, toasted.\n\n---\n\n## Garlic Toast\nSource:'));
  assert.match(logged.join('\n'), /names no multibox stages/);
});
