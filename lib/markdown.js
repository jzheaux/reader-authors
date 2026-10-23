/**
 * reader-markdown, written. Every author writes reader's syntax through
 * these, so when reader-markdown changes, this is the one place to change
 * with it. See reader's docs/ for what each one is.
 */

/** Pages, as reader splits them for slides, printing and Work. */
export function pages(list) {
  return list.map((p) => p.replace(/\n*$/, '\n')).join('\n---\n\n');
}

/**
 * Markdown's characters, and reader's, as text. Brackets only where they
 * could start something: a link or image, a style (`]{`), a reference, or
 * a scheme's (`scripture:[`); on their own, `[Exit.]` reads as written.
 */
export function escape(t) {
  return t.replace(/[\\`*_~<]/g, '\\$&').replace(/(?<=[:!])\[|\](?=[({[:])/g, '\\$&');
}

/**
 * Escapes what reader would read at the start of a line as its own
 * syntax: a heading, a quote, a list, an aside, a definition, an exchange
 * or a retro card, a vote, a field, a style block or a pane.
 */
export function escapeLineStart(line) {
  return LINE_START.test(line) ? `\\${line}` : line;
}

const LINE_START = /^(?:\[[^\]]*\]:|#{1,6}[ \t]|>|[-+*][ \t]|\d+[.)][ \t]|!|@[ \t]|:::|\+\+\+|\+1\b|-{3,}\s*$|(?:Q|A|Good|Bad|Try)(?:[ \t]*\([^)]*\))?:)/;

/** A quote, and who or where it's from under it. `text` is markdown. */
export function quote(text, cite) {
  const body = text.split('\n').map((line) => `> ${line}`).join('\n');
  return cite ? `${body}\n>\n> — *${cite}*\n` : `${body}\n`;
}

/**
 * A form field: `@ Label:` and what's filled in, if anything. Each colon is
 * a line of blank, for a longer answer.
 */
export function field(label, { lines = 1, value = '' } = {}) {
  return `@ ${label}${':'.repeat(lines)}${value ? ` ${value}` : ''}`;
}

/** A field to pick one of `choices` in, its radio buttons in a row. */
export function choiceField(label, choices) {
  return `@ ${label}: ${choices.map((c) => `( ) ${c}`).join(' ')}`;
}

/** A fenced block named for `kind`, as a puzzle is: ```kind info. */
export function fence(kind, body, info = '') {
  return `\`\`\`${kind}${info ? ` ${info}` : ''}\n${body.replace(/\n*$/, '\n')}\`\`\`\n`;
}

/**
 * Front matter: each of `entries` a key and its value, or a key and the
 * entries under it (`multibox: { stages: 'have, used' }`).
 */
export function frontMatter(entries) {
  const lines = [];
  for (const [k, v] of Object.entries(entries)) {
    if (typeof v !== 'object') lines.push(`${k}: ${v}`);
    else lines.push(`${k}:`, ...Object.entries(v).map(([k2, v2]) => `  ${k2}: ${v2}`));
  }
  return `---\n${lines.join('\n')}\n---\n`;
}

// An amount as reader's count reads one: a mixed fraction, a fraction, a
// glyph, a decimal or a whole number, or a range of two.
const GLYPHS = '½⅓⅔¼¾⅕⅖⅗⅘⅙⅚⅛⅜⅝⅞';
const ONE = `(?:\\d+[ \\u00a0]\\d+/\\d+|\\d+/\\d+|\\d*[${GLYPHS}]|\\d+(?:\\.\\d+)?|\\.\\d+)`;
const AMOUNT = new RegExp(`^${ONE}(?:(?:[ \\u00a0]?[-–—][ \\u00a0]?|[ \\u00a0]to[ \\u00a0])${ONE})?(?![\\d/${GLYPHS}])`);

/** The amount `text` starts with, as `count:` would scale it, or null. */
export function leadingAmount(text) {
  return AMOUNT.exec(text)?.[0] ?? null;
}

/** An amount that scales with its section's multiplier. */
export function count(amount) {
  return `count:${amount}`;
}

/** Buttons to multiply a section's counts: 1×, 2× and 3×. */
export function multiplier() {
  return 'multiplier:[]';
}

/** A Start over button, clearing a section's boxes. */
export function reset() {
  return 'reset:[]';
}

/** A box, or one box with `stages` stages, a `[ ]` for each. */
export function box(stages = 1) {
  return '[ ]'.repeat(Math.max(1, stages));
}

/** An ingredient's key: the word its steps are found by. */
export function ingredientKey(word) {
  return `!${word}`;
}

/** Text with a `!` before a word kept as typed, not read as an ingredient's key. */
export function escapeKeys(t) {
  return t.replace(/(?<![\p{L}\p{N}_])!(?=\p{L})/gu, '\\!');
}

/** A callout: `kind` is note, tip, important, warning or caution. */
export function callout(kind, text) {
  return `> [!${kind.toUpperCase()}]\n${text.split('\n').map((l) => `> ${l}`).join('\n')}\n`;
}

/** A link; `text` is markdown. */
export function link(text, url) {
  return `[${text}](${destination(url)})`;
}

/** An image, `alt` read as text. */
export function image(alt, src) {
  return `![${alt.replace(/[\\[\]]/g, '\\$&')}](${destination(src)})`;
}

const ENCODED = { ' ': '%20', '(': '%28', ')': '%29', '<': '%3C', '>': '%3E' };
const destination = (url) => url.replace(/[ ()<>]/g, (c) => ENCODED[c]);
