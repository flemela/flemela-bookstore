// Checks every legacy book we attached a PDF to: does the store's title match the title
// the uploaded file belongs to? Where it does not, the eBook option is taken off sale at
// once so nobody can buy the wrong download, and the book is listed for repair.
//
//   node audit-legacy.mjs [--dry-run] [--limit N]
//
// Why: the catalogue CSV and the store use different SKUs for the same titles, so matching
// by SKU attached the wrong file to about half of them.
//
// Outputs (in C:\BOOKS\tools):
//   audit-ok.tsv          - SKU, title           (right file, left alone)
//   audit-mismatch.tsv    - SKU, store title, file uploaded, action taken
//   audit-progress.tsv    - every SKU checked, so a re-run resumes

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STORE = 'https://www.thesunrisebookstore.com';
const here = path.dirname(fileURLToPath(import.meta.url));
const scratch = 'C:/Users/THESUN~1/AppData/Local/Temp/claude/C--Users-The-SunRise-Documents-flemela-bookstore/d609f9c5-3a84-46bb-889b-7e778d363495/scratchpad';
const flags = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');
const limitArg = flags.indexOf('--limit');
const limit = limitArg >= 0 ? Number(flags[limitArg + 1]) : Infinity;

const GAP_MS = 1200;
const THROTTLE_WAITS = [15000, 30000, 60000, 120000];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

const auth = JSON.parse(fs.readFileSync(path.join(here, 'auth.json'), 'utf8').replace(/^\uFEFF/, ''));
let token = auth.token || null;

async function signIn() {
  for (let attempt = 0; attempt < 6; attempt++) {
    const res = await fetch(`${STORE}/api/admin/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: auth.email, password: auth.password }),
    });
    if (res.ok) { token = (await res.json()).token; return true; }
    if (res.status === 429 || res.status >= 500) { await sleep(THROTTLE_WAITS[Math.min(attempt, 3)]); continue; }
    return false;
  }
  return false;
}

class Unauthorized extends Error {}
class Throttled extends Error {}

async function api(pathname, options = {}) {
  const res = await fetch(`${STORE}${pathname}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Cookie: `flemela_admin_session=${token}`,
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  if (res.status === 401 || res.status === 403) throw new Unauthorized();
  if (res.status === 429) throw new Throttled();
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.status === 204 ? null : res.json();
}

// SKU -> the title the uploaded file actually belongs to (from the catalogue CSV)
const csvRows = JSON.parse(fs.readFileSync(`${scratch}/legacy-pdf-rows.json`, 'utf8'));
const titleForSku = new Map(csvRows.map((r) => [r.sku, r.name]));
const fileForSku = JSON.parse(fs.readFileSync(`${scratch}/legacy-file-map.json`, 'utf8'));

const attached = fs.readFileSync('C:/BOOKS/PDF batches/attach-progress.tsv', 'utf8')
  .trim().split('\n').map((l) => l.split('\t')[0]).filter(Boolean);

const progressFile = path.join(here, 'audit-progress.tsv');
const checked = new Set(
  fs.existsSync(progressFile)
    ? fs.readFileSync(progressFile, 'utf8').split('\n').map((l) => l.split('\t')[0]).filter(Boolean)
    : []
);
const todo = [...new Set(attached)].filter((s) => !checked.has(s));

console.log(`${new Set(attached).size} books attached, ${checked.size} already audited, ${todo.length} to check`);
if (dryRun) { console.log('dry run. First 5:', todo.slice(0, 5).join(', ')); process.exit(0); }
if (!token && !(await signIn())) { console.error('Could not sign in.'); process.exit(1); }

let right = 0, wrong = 0, hidden = 0, gone = 0, n = 0;
const start = Date.now();

for (const sku of todo.slice(0, limit)) {
  n++;
  let attempt = 0, throttles = 0;
  while (attempt < 3) {
    try {
      const data = await api(`/api/admin/books?q=${encodeURIComponent(sku)}&limit=5`);
      const book = (data.products || []).find((p) => String(p.sku).toUpperCase() === sku);
      if (!book) {
        fs.appendFileSync(progressFile, `${sku}\tnot found\n`);
        gone++;
        break;
      }
      const expected = titleForSku.get(sku) || '';
      if (norm(book.name) === norm(expected)) {
        fs.appendFileSync(progressFile, `${sku}\tok\n`);
        fs.appendFileSync(path.join(here, 'audit-ok.tsv'), `${sku}\t${book.name}\n`);
        right++;
        break;
      }
      // Wrong file: take the eBook off sale now, repair later.
      const pdf = (book.formats || []).find((f) => f.format === 'pdf');
      let action = 'no pdf format to remove';
      if (pdf) {
        await api(`/api/admin/books/${book.id}/formats/${pdf.id}`, { method: 'DELETE' });
        action = `hidden (was ${pdf.price} KSh)`;
        hidden++;
      }
      fs.appendFileSync(progressFile, `${sku}\tmismatch\n`);
      fs.appendFileSync(
        path.join(here, 'audit-mismatch.tsv'),
        `${sku}\t${book.name}\t${fileForSku[sku] || '?'}\t${action}\n`
      );
      wrong++;
      break;
    } catch (err) {
      if (err instanceof Unauthorized) { if (await signIn()) continue; console.error('Sign-in failed; stopping.'); process.exit(1); }
      if (err instanceof Throttled) { await sleep(THROTTLE_WAITS[Math.min(throttles++, 3)]); continue; }
      if (++attempt >= 3) { fs.appendFileSync(progressFile, `${sku}\terror ${err.message}\n`); break; }
      await sleep(2000);
    }
  }
  if (n % 25 === 0) {
    const rate = n / ((Date.now() - start) / 60000);
    console.log(`${n}/${todo.length} - correct ${right}, wrong ${wrong} (hidden ${hidden}), missing ${gone}, ~${Math.round((todo.length - n) / rate)} min left`);
  }
  await sleep(GAP_MS);
}

console.log(`\naudit finished: correct ${right}, wrong ${wrong} (eBook hidden on ${hidden}), missing ${gone}`);
console.log(`mismatches listed in ${path.join(here, 'audit-mismatch.tsv')}`);
