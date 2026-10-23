# reader-authors

Authors that write [reader](https://github.com/jzheaux/reader)-markdown.
Each makes a document, or a set of them, from what it's given: some
convert from a source, some invent, and some do both. The General
Conference packet invents its puzzles and transcribes its scriptures.

```console
$ npm install
$ npm link        # puts `author` on the path; or run bin/author.js
$ author gc --out ~/Documents/fam/gc-2027-april
```

Needs Node 22.13 or later.

## Authors

| | |
| --- | --- |
| `author gc` | a General Conference activity packet: a hundred puzzle pages, each a scripture, a puzzle reader plays, and a question to think about, with a page for each talk mixed in; and an answer key, every puzzle in it solved |
| `author recipe` | a recipe from a web page, added to a recipes file: its amounts scaling, its ingredients tied to its steps, its photo beside it, and credited to the site and cook it's from |

`author <name> --help` says what each one takes. Every author writes to
`--out <dir>` (the current directory if not given), and leaves alone
anything already there unless `--force`: a document may have been written
in, or played, since.

### gc

```console
$ author gc --out packet                      # October 2026's scriptures and questions
$ author gc --content april-2027.js --out packet
$ author gc --seed 7 --out packet             # the same puzzles as last time
```

It writes `packet.md`, `answers.md`, and `mazes/`, a board file for each
maze. What each page quotes and asks is in a content module,
[`authors/gc/content/2026-10.js`](authors/gc/content/2026-10.js) to start
with; copy it to make another conference's. Its scriptures are fetched the
first time from [bcbooks/scriptures-json](https://github.com/bcbooks/scriptures-json)
and kept in `~/.cache/reader-authors/scriptures`. Word mazes are drawn in
Arial Black (macOS's, or `--font`).

The seed is printed, and written at the top of the answer key, so a packet
can be made again.

### recipe

```console
$ author recipe https://www.bbcgoodfood.com/recipes/easy-pancakes --out ~/Documents/self/io
$ author recipe --html ~/Downloads/waffles.html https://thesaltymarshmallow.com/homemade-belgian-waffle-recipe/
```

It adds the recipe to the end of `recipes.md` (or `--file`), after a
`---`, and saves its photo as `images/recipe-<name>.jpg` beside it. A new
file gets front matter naming the ingredients' stages, `have, out, used`
(or `--stages`). A recipe whose page is in the file already isn't added
again.

There's no site's layout to learn: it reads the schema.org `Recipe` that
most recipe sites describe theirs with for search engines -- WordPress
Recipe Maker, Tasty, Mediavine Create, NYT Cooking, BBC Good Food and
more. A page without one isn't read. What a site keeps only on the page,
not in its `Recipe`, isn't either: WordPress Recipe Maker's notes, say.

Many sites turn a script away (Allrecipes, Serious Eats, and others behind
Cloudflare's bot checks). For those, save the page from a browser (Save
Page As…, HTML only is enough) and give it with `--html`, with its url to
credit; the photo is still fetched, and left out, with a word, if it
can't be.

Each ingredient's key, the `!word` its steps are found by, is a guess: the
last word naming it that a step says. reader flags one *in no step*; move
its `!` by hand.

**Credit isn't permission.** Each recipe is linked to its page and its
cook, as it should be. A list of ingredients isn't anyone's to own, but
the way the steps are written, and the photo, are, so this is for keeping
recipes you cook from, not for sharing or publishing what it writes;
`--no-image` leaves the photo out.

## Layout

| | |
| --- | --- |
| `bin/author.js` | the CLI: `author <name>` runs that author |
| `authors/index.js` | the authors, by name |
| `authors/<name>/` | an author: `index.js` (its `summary`, `usage` and `run`), what it does, and its tests |
| `lib/markdown.js` | reader-markdown, written: quotes, fields, fences, pages, and escaping text so it reads as text |
| `lib/puzzles/` | puzzles reader plays: each makes one and writes its fence, played or solved |
| `lib/scripture.js` | scripture looked up, never typed from memory |
| `lib/files.js` | writing what an author made, without writing over what's there |
| `test/reader.js` | reader, as what the authors write is checked against it |

## Keeping up with reader-markdown

What an author writes has to be what reader reads, and reader-markdown
keeps growing. Three ways they can come apart:

- **Its syntax changes**: a field or a fence is written another way, and an
  author goes on writing the old one.
- **Text reads as syntax**: a verse that starts `1.`, or has a `Q:` or a
  `[` in it, read as a list, an exchange or a link.
- **A puzzle's text changes**: what a kind's fence holds, or how it says
  it's solved.

So:

- **Only `lib/` spells out reader's syntax.** An author asks `lib/markdown.js`
  for a field or a quote, and `lib/puzzles/` for a fence, rather than
  typing them, so a change in reader is a change in one place.
- **The tests check against reader itself**, the version pinned in
  `package.json`: everything an author writes is rendered with reader's
  renderer, each puzzle is read with its kind's own rules (unsolved in the
  packet, solved in the answer key), each quote must read word for word as
  its verse, and nothing on a page may come out as a list, a link or an
  aside it wasn't meant to be. `test/reader.js` is the one place that
  knows where in reader those are.
- **Moving reader on is when we find out.** Bump the version in
  `package.json`, `npm install`, `npm test`.

The dependency goes one way: this repo uses reader (to test against, not
to run), and reader never uses this. Someday reader might publish its
syntax as a module of its own, say `escape`, `field` and each kind's
`format`, and `lib/markdown.js` would use that instead of writing its own.
