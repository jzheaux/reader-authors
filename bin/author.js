#!/usr/bin/env node
/**
 * author <name> [options]: writes reader-markdown, by the author named.
 */

import { AUTHORS } from '../authors/index.js';

const [name, ...argv] = process.argv.slice(2);

async function usage() {
  const lines = [];
  for (const [n, load] of Object.entries(AUTHORS)) lines.push(`  ${n.padEnd(10)}${(await load()).summary}`);
  return `usage: author <name> [options]
       author <name> --help

authors:
${lines.join('\n')}
`;
}

if (!name || name === '-h' || name === '--help') {
  process.stdout.write(await usage());
  process.exit(name ? 0 : 2);
}
if (!Object.hasOwn(AUTHORS, name)) {
  process.stderr.write(`author: no author ${name}\n\n${await usage()}`);
  process.exit(2);
}

const author = await AUTHORS[name]();
try {
  await author.run(argv);
} catch (err) {
  const usageError = err.code?.startsWith('ERR_PARSE_ARGS');
  process.stderr.write(`author ${name}: ${err.message}\n${usageError ? `\n${author.usage}` : ''}`);
  process.exit(usageError ? 2 : 1);
}
