#!/usr/bin/env node
/**
 * Regenerates `packages/types/src/database.ts` from the linked Supabase project.
 *
 * This exists so the header survives. Piping `supabase gen types` straight into
 * the file silently drops the comment that tells the next reader not to edit it.
 */
import { execFileSync } from 'node:child_process';
import { writeFileSync } from 'node:fs';

const TARGET = 'packages/types/src/database.ts';

const HEADER = `// Generated from the live Supabase schema. Do not edit by hand.
//
// Regenerate after every migration:
//
//   npm run types:generate
//
// The domain modules in this package derive from these rows and narrow the jsonb
// columns, so this file is the single place where column shapes are described.
// It is excluded from Prettier so regenerated output stays byte-comparable.

`;

const generated = execFileSync(
  'npx',
  ['supabase', 'gen', 'types', 'typescript', '--linked'],
  { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 },
);

if (!generated.includes('export type Database')) {
  console.error('Refusing to write: the CLI output does not contain a Database type.');
  process.exit(1);
}

writeFileSync(TARGET, HEADER + generated.trimStart());
console.log(`Wrote ${TARGET} (${generated.split('\n').length} generated lines).`);
