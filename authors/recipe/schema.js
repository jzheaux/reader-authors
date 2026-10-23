/**
 * A recipe as a page describes it for search engines: schema.org's
 * `Recipe`, in a `<script type="application/ld+json">`. Most recipe sites
 * write one -- WordPress Recipe Maker, Tasty, Mediavine Create, and the
 * big sites' own -- so one reading covers them, with no site's layout to
 * learn.
 *
 *   read(html, url) -> { name, yield, prep, cook, total, ingredients,
 *                        sections, image, author, site, url }
 *
 * Text comes out plain: tags taken out, entities read, spaces collapsed.
 */

/** The recipe in `html`, or null if it describes none. `url` is where it was found. */
export function read(html, url) {
  const nodes = jsonLd(html).flatMap((d) => walk(d));
  const byId = new Map(nodes.filter((n) => n['@id']).map((n) => [n['@id'], n]));
  const ref = (n) => (n && typeof n === 'object' && n['@id'] && !n['@type'] && byId.get(n['@id'])) || n;
  const recipe = nodes.find((n) => types(n).includes('Recipe'));
  if (!recipe) return null;

  const website = nodes.find((n) => types(n).includes('WebSite'));
  const source = url || meta(html, 'og:url') || canonical(html) || first(recipe.url) || first(recipe.mainEntityOfPage?.['@id'] ?? recipe.mainEntityOfPage);
  return {
    name: text(recipe.name) || 'Untitled recipe',
    yield: servings(recipe.recipeYield),
    prep: duration(recipe.prepTime),
    cook: duration(recipe.cookTime),
    total: duration(recipe.totalTime),
    ingredients: list(recipe.recipeIngredient ?? recipe.ingredients).map(text).filter(Boolean),
    sections: instructions(recipe.recipeInstructions, ref),
    image: imageUrl(ref(first(recipe.image)), ref),
    author: names(recipe.author, ref),
    site: text(meta(html, 'og:site_name')) || text(website?.name) || names(recipe.publisher, ref) || hostname(source),
    url: source,
  };
}

/** Each JSON-LD block's data, those that don't parse left out. */
function jsonLd(html) {
  const found = [];
  for (const [, body] of html.matchAll(/<script\b[^>]*\btype\s*=\s*["']?application\/ld\+json["']?[^>]*>([\s\S]*?)<\/script>/gi)) {
    const json = body.trim().replace(/^<!\[CDATA\[|\]\]>$/g, '');
    try {
      found.push(JSON.parse(json));
    } catch {
      // Line breaks left raw in a string are the usual fault.
      try {
        found.push(JSON.parse(escapeRaw(json)));
      } catch {
        // Not the page's recipe, as far as anyone can tell.
      }
    }
  }
  return found;
}

/** `json` with what's raw in its strings -- a line break, a tab -- escaped, as JSON has it. */
function escapeRaw(json) {
  let out = '';
  let quoted = false;
  for (let i = 0; i < json.length; i++) {
    const c = json[i];
    if (quoted && c === '\\') {
      out += c + (json[++i] ?? '');
      continue;
    }
    if (c === '"') quoted = !quoted;
    out += quoted && c < ' ' ? `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}` : c;
  }
  return out;
}

/** Every object in `d` with a type, through arrays and `@graph`s. */
function walk(d) {
  if (Array.isArray(d)) return d.flatMap(walk);
  if (!d || typeof d !== 'object') return [];
  const own = d['@type'] || d['@id'] ? [d] : [];
  return [...own, ...walk(d['@graph'] ?? [])];
}

const types = (n) => [].concat(n?.['@type'] ?? []);
const list = (v) => (v == null ? [] : [].concat(v));
const first = (v) => list(v)[0];

/**
 * The steps, in sections: a `HowToSection`'s name and its steps, or steps
 * with no section, as `{ name, steps: [{ text, tips }] }`. Written as one
 * string, each line is a step.
 */
function instructions(v, ref) {
  const sections = [];
  const loose = () => {
    if (!sections.length || sections.at(-1).name) sections.push({ name: '', steps: [] });
    return sections.at(-1);
  };
  const add = (into, item) => {
    item = ref(item);
    if (typeof item === 'string') {
      for (const line of item.split(/\n+|<\/p>|<br\s*\/?>|<\/li>/i)) {
        const t = unnumbered(text(line));
        if (t) into().steps.push({ text: t, tips: [] });
      }
    } else if (types(item).includes('HowToSection')) {
      const section = { name: text(item.name), steps: [] };
      sections.push(section);
      for (const step of list(item.itemListElement)) add(() => section, step);
    } else if (types(item).includes('HowToTip')) {
      const step = into().steps.at(-1);
      const t = text(item.text ?? item.name);
      if (step && t) step.tips.push(t);
    } else if (item && typeof item === 'object') {
      const t = unnumbered(text(item.text ?? item.name ?? ''));
      if (t) into().steps.push({ text: t, tips: [] });
      // A step's own directions and tips, as some sites nest them.
      for (const part of list(item.itemListElement)) add(into, part);
    }
  };
  for (const item of list(v)) add(loose, item);
  return sections.filter((s) => s.steps.length);
}

const unnumbered = (t) => t.replace(/^(?:step\s*)?\d+[.):]\s+/i, '');

/** Servings as `{ count, label }`: 'Serves' for people, or what it makes ('cookies'). */
function servings(v) {
  for (const y of list(v)) {
    const m = /^(\D*?)(\d+(?:\s*[-–]\s*\d+)?)\s*(.*)$/.exec(text(String(y)));
    if (!m) continue;
    const count = m[2].replace(/\s*[-–]\s*/, '–');
    const what = m[3].replace(/[.)]+$/, '').trim();
    if (/serv/i.test(m[1]) || !what || /^(?:servings?|serves|people|persons|portions?)$/i.test(what)) return { count, label: 'Serves' };
    return { count, label: 'Makes', what };
  }
  return null;
}

/** An ISO 8601 duration, `PT1H30M`, as a cook writes it: `1h 30m`; '' for none. */
export function duration(v) {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+(?:\.\d+)?)H)?(?:(\d+(?:\.\d+)?)M)?(?:\d+(?:\.\d+)?S)?)?$/i.exec(String(first(v) ?? '').trim());
  if (!m) return '';
  const minutes = Math.round(Number(m[1] ?? 0) * 1440 + Number(m[2] ?? 0) * 60 + Number(m[3] ?? 0));
  if (!minutes) return '';
  const [h, min] = [Math.floor(minutes / 60), minutes % 60];
  return [h && `${h}h`, min && `${min}m`].filter(Boolean).join(' ');
}

function imageUrl(img, ref) {
  if (typeof img === 'string') return img;
  if (img && typeof img === 'object') return imageUrl(ref(first(img.url ?? img.contentUrl)), ref);
  return '';
}

/** A person's or organization's name, or several's, joined. */
function names(v, ref) {
  const all = list(v).map((p) => ref(p)).map((p) => text(typeof p === 'string' ? p : p?.name ?? '')).filter(Boolean);
  return all.length > 2 ? `${all.slice(0, -1).join(', ')} and ${all.at(-1)}` : all.join(' and ');
}

/** The `content` of a `<meta>` named or with the property `name`. */
function meta(html, name) {
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const a = attrs(tag);
    if (a.property === name || a.name === name) return a.content ?? '';
  }
  return '';
}

function canonical(html) {
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    const a = attrs(tag);
    if (a.rel?.toLowerCase() === 'canonical') return a.href ?? '';
  }
  return '';
}

function attrs(tag) {
  const a = {};
  for (const [, k, v1, v2, v3] of tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/g)) a[k.toLowerCase()] = decode(v1 ?? v2 ?? v3);
  return a;
}

function hostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/** Text as it reads: tags out, entities in, spaces collapsed. */
export function text(v) {
  if (v == null) return '';
  let t = String(v);
  // Entities are sometimes written twice over: `&amp;#8217;`.
  for (let i = 0; i < 2; i++) t = decode(t.replace(/<[^>]*>/g, ' '));
  return t.replace(/\s+/g, ' ').replace(/(\d) ([½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞])/g, '$1$2').trim();
}

const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', ndash: '–', mdash: '—', hellip: '…',
  lsquo: '‘', rsquo: '’', ldquo: '“', rdquo: '”', deg: '°', times: '×', frac12: '½', frac14: '¼', frac34: '¾',
  eacute: 'é', egrave: 'è', ntilde: 'ñ', uuml: 'ü', ouml: 'ö', auml: 'ä', ccedil: 'ç',
};

function decode(t) {
  return t.replace(/&(#x[\da-f]+|#\d+|[a-z]\w*);/gi, (all, e) => {
    if (e[0] === '#') {
      const n = e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : Number(e.slice(1));
      return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : all;
    }
    return ENTITIES[e.toLowerCase()] ?? all;
  });
}
