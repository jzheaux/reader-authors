/**
 * Scripture looked up, never typed from memory: the standard works as JSON
 * from github.com/bcbooks/scriptures-json, fetched once into a cache.
 *
 *   const books = await scriptures(dir);
 *   books.lookup('Proverbs 3:5-6')        -> { ref: 'Proverbs 3:5–6', text }
 *   books.lookup('Joshua 24:15', 'choose') -> the excerpt, with ellipses
 */

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

// The commit they're fetched from, so a quote reads the same next time.
const SOURCE = 'https://raw.githubusercontent.com/bcbooks/scriptures-json/3bda76e40add4582165340ea6b1198dc6ad26ae1';
export const WORKS = ['old-testament', 'new-testament', 'book-of-mormon', 'doctrine-and-covenants', 'pearl-of-great-price'];
const DISPLAY = { 'D&C': 'Doctrine and Covenants', Psalms: 'Psalm' };

export function defaultDir() {
  const cache = process.env.XDG_CACHE_HOME || path.join(os.homedir(), '.cache');
  return path.join(cache, 'reader-authors', 'scriptures');
}

/** Each work's JSON in `dir`, fetched first if it isn't there. */
export async function scriptures(dir = defaultDir(), { log = () => {} } = {}) {
  const verses = new Map();
  for (const work of WORKS) {
    const file = path.join(dir, `${work}.json`);
    let json;
    if (fs.existsSync(file)) {
      json = JSON.parse(fs.readFileSync(file, 'utf8'));
    } else {
      log(`fetching ${work} into ${dir}`);
      const res = await fetch(`${SOURCE}/flat/${work}-flat.json`);
      if (!res.ok) throw new Error(`${work}: ${res.status} ${res.statusText}`);
      const text = await res.text();
      json = JSON.parse(text);
      if (!Array.isArray(json.verses)) throw new Error(`${work}: no verses in what was fetched`);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(file, text);
    }
    for (const v of json.verses) verses.set(v.reference, v.text);
  }
  return fromVerses(verses);
}

/** Lookups over `verses`, a map from 'Book 1:2' to its text. */
export function fromVerses(verses) {
  return {
    /**
     * `ref` like 'Proverbs 3:5-6' or 'D&C 4:6'. `excerpt`, if given, must be
     * in the text word for word; it's quoted with ellipses.
     */
    lookup(ref, excerpt) {
      const m = /^(.+) (\d+):(\d+)(?:[-–](\d+))?$/.exec(ref);
      if (!m) throw new Error(`can't read the reference ${ref}`);
      const [book, ch, v1] = [m[1], Number(m[2]), Number(m[3])];
      const v2 = m[4] ? Number(m[4]) : v1;
      const parts = [];
      for (let v = v1; v <= v2; v++) {
        const key = `${book} ${ch}:${v}`;
        if (!verses.has(key)) throw new Error(`no verse ${key}`);
        parts.push(verses.get(key));
      }
      let text = parts.join(' ');
      if (excerpt) {
        if (!text.includes(excerpt)) throw new Error(`${ref} doesn't say: ${excerpt}`);
        text = `${text.startsWith(excerpt) ? '' : '…'}${excerpt}${text.trimEnd().endsWith(excerpt.trimEnd()) ? '' : '…'}`;
      }
      return { ref: `${DISPLAY[book] ?? book} ${ch}:${v2 !== v1 ? `${v1}–${v2}` : v1}`, text };
    },
  };
}

const STOP = new Set(`the and unto that thee thou thy thine shall with have hath for them they their
which this from will upon also you your are were was him his her all not but into even yea
behold may might every things thing more much being been did doth hast art wherefore therefore
because saith said there these those what when who whom whose then than shalt wilt would should
could let made make unto ye our ours over under after before again any some such only very own
same thereof whither whatsoever whosoever lest neither nor yet how why where here thus also
upon toward towards amongst among about above shall cometh hath hast doth didst tell against
must having shewed come given giveth came pass
the and for you are was him his her not but all any can did has had how its nor out
say she too use who why yet thy art saw let get got put now off way`.split(/\s+/));

/**
 * A verse's words worth finding in a word search: no common words, none
 * twice, and none inside another (so each is found exactly once).
 */
export function keywords(text, { max = 16, longest = 15 } = {}) {
  const seen = new Set();
  let words = [];
  for (const w of text.match(/[A-Za-z]+/g) ?? []) {
    const u = w.toUpperCase();
    if (u.length < 3 || u.length > longest || STOP.has(u.toLowerCase()) || seen.has(u)) continue;
    seen.add(u);
    words.push(u);
  }
  words = words.filter((w) => !words.some((o) => o !== w && o.includes(w)));
  if (words.length > max) {
    const keep = new Set([...words].sort((a, b) => b.length - a.length).slice(0, max));
    words = words.filter((w) => keep.has(w));
  }
  return words;
}

/** `text` (markdown) with each of `words` in it bold. */
export function bold(text, words) {
  const alts = [...words].sort((a, b) => b.length - a.length).map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return text.replace(new RegExp(`\\b(${alts.join('|')})\\b`, 'gi'), '**$1**');
}
