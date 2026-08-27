#!/usr/bin/env node
/**
 * Fails if anything that must stay on the server appears in what ships to a
 * browser.
 *
 * Next.js inlines any environment variable named `NEXT_PUBLIC_*` into the client
 * bundle. The failure mode this guards against is someone renaming a secret to
 * carry that prefix, or pasting a key into a component to "test something" — the
 * kind of mistake that is invisible in review and permanent once deployed.
 *
 * Only `.next/static` is scanned: that directory is exactly the set of files a
 * browser downloads. The server bundle legitimately reads secrets at runtime.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const STATIC_DIR = 'apps/web/.next/static';

/** Each pattern is something that must never reach a browser. */
const FORBIDDEN = [
  { name: 'Supabase secret key', pattern: /sb_secret_[A-Za-z0-9_-]+/ },
  { name: 'Supabase service role key name', pattern: /service_role/ },
  { name: 'Service role env var', pattern: /SUPABASE_SERVICE_ROLE_KEY/ },
  { name: 'Supabase secret env var', pattern: /SUPABASE_SECRET_KEY/ },
  { name: 'Gemini API key env var', pattern: /GEMINI_API_KEY/ },
  { name: 'Gemini API key', pattern: /AIza[0-9A-Za-z_-]{35}/ },
  { name: 'Meta app secret env var', pattern: /META_APP_SECRET/ },
  { name: 'Meta webhook token env var', pattern: /META_WEBHOOK_VERIFY_TOKEN/ },
  // A JWT whose payload names the service_role. The publishable key is not a
  // JWT, so any JWT at all in the browser bundle deserves a look.
  { name: 'JSON Web Token', pattern: /eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}/ },
];

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      yield* walk(path);
    } else {
      yield path;
    }
  }
}

let scanned = 0;
const findings = [];

try {
  statSync(STATIC_DIR);
} catch {
  console.error(`${STATIC_DIR} does not exist. Run "npm run build --workspace @apex/web" first.`);
  process.exit(1);
}

for (const file of walk(STATIC_DIR)) {
  if (!/\.(js|mjs|css|json|map)$/.test(file)) continue;
  scanned += 1;
  const contents = readFileSync(file, 'utf8');
  for (const { name, pattern } of FORBIDDEN) {
    const match = contents.match(pattern);
    if (match) {
      findings.push({ file, name, sample: match[0].slice(0, 24) });
    }
  }
}

if (findings.length > 0) {
  console.error(`Found ${findings.length} forbidden value(s) in the client bundle:\n`);
  for (const { file, name, sample } of findings) {
    console.error(`  ${name}\n    in ${file}\n    near "${sample}…"\n`);
  }
  process.exit(1);
}

console.log(`Scanned ${scanned} client files in ${STATIC_DIR}. No server-only values found.`);
