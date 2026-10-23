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
