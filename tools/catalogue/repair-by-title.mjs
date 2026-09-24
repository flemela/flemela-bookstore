// Re-attaches the correct PDF to legacy books, matching by TITLE rather than SKU.
// The catalogue CSV pairs each title with the right filename; only its SKU numbers
// disagree with the store's. So: store title -> CSV row with that title -> its file.
//
//   node repair-by-title.mjs <list.tsv> [--dry-run] [--limit N]
//
// <list.tsv>: SKU <tab> store title  (e.g. audit-mismatch.tsv)
// After each upload the book is re-read and its title and file size checked again.
// Books with no confident title match are left alone and listed in repair-unmatched.tsv.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STORE = 'https://www.thesunrisebookstore.com';
const LIBRARY = 'C:/BOOKS/E-Books';
const here = path.dirname(fileURLToPath(import.meta.url));
const scratch = 'C:/Users/THESUN~1/AppData/Local/Temp/claude/C--Users-The-SunRise-Documents-flemela-bookstore/d609f9c5-3a84-46bb-889b-7e778d363495/scratchpad';
const [listFile, ...flags] = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');
const limitArg = flags.indexOf('--limit');
const limit = limitArg >= 0 ? Number(flags[limitArg + 1]) : Infinity;

const GAP_MS = 1200;
const THROTTLE_WAITS = [15000, 30000, 60000, 120000];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');

// ---------- title -> file index ----------
const csvRows = JSON.parse(fs.readFileSync(`${scratch}/legacy-pdf-rows.json`, 'utf8'));
const libraryFiles = new Set(fs.readdirSync(LIBRARY));
const byTitle = new Map();          // normalised title -> [files]
for (const r of csvRows) {
  if (!/\.pdf$/i.test(r.file) || !libraryFiles.has(r.file)) continue;
  const k = norm(r.name);
  if (!byTitle.has(k)) byTitle.set(k, new Set());
  byTitle.get(k).add(r.file);
}

// Second source: the library's own filenames. "Mindset (2).pdf" is a re-download of
// "Mindset.pdf", so the "(n)" suffix is ignored when comparing.
const byFilename = new Map();       // normalised name -> [files]
for (const f of libraryFiles) {
  if (!/\.pdf$/i.test(f)) continue;
  const k = norm(f.replace(/\.pdf$/i, '').replace(/\s*\(\d+\)\s*$/, ''));
  if (!byFilename.has(k)) byFilename.set(k, []);
  byFilename.get(k).push(f);
}

// Several copies of one title are only safe to pick from when they are the same size,
// i.e. the same file downloaded twice. Otherwise a person has to choose.
function pickOne(files) {
  const list = [...files];
  if (list.length === 1) return { file: list[0] };
  const sizes = new Set(list.map((f) => fs.statSync(path.join(LIBRARY, f)).size));
  if (sizes.size === 1) return { file: list.sort((a, b) => a.length - b.length)[0] };
  return { file: null, why: `${list.length} different files: ${list.join(' | ')}` };
}

// Exact title match only (ignoring case and punctuation). Never a partial or fuzzy match:
// guessing is how the wrong files got attached in the first place.
function fileForTitle(title) {
  const fromCsv = byTitle.get(norm(title));
  if (fromCsv) return pickOne(fromCsv);
  const fromLibrary = byFilename.get(norm(title));
  if (fromLibrary) return pickOne(fromLibrary);
  return { file: null, why: 'no file with exactly this title' };
}

// ---------- auth / api ----------
const auth = JSON.parse(fs.readFileSync(path.join(here, 'auth.json'), 'utf8').replace(/^\uFEFF/, ''));
let token = null;

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

async function findBook(sku) {
  const data = await api(`/api/admin/books?q=${encodeURIComponent(sku)}&limit=5`);
  return (data.products || []).find((p) => String(p.sku).toUpperCase() === sku) || null;
}

// ---------- plan ----------
const rows = fs.readFileSync(listFile, 'utf8').trim().split('\n').map((l) => l.split('\t'));
const doneFile = path.join(here, 'repair-done.tsv');
const done = new Set(
  fs.existsSync(doneFile) ? fs.readFileSync(doneFile, 'utf8').split('\n').map((l) => l.split('\t')[0]).filter(Boolean) : []
);

const plan = [], unmatched = [];
for (const [sku, storeTitle] of rows) {
  if (!sku || done.has(sku)) continue;
  const { file, why } = fileForTitle(storeTitle);
  if (file) plan.push({ sku, storeTitle, file });
  else unmatched.push(`${sku}\t${storeTitle}\t${why}`);
}
fs.writeFileSync(path.join(here, 'repair-unmatched.tsv'), 'SKU\tstore title\twhy not repaired\n' + unmatched.join('\n') + '\n');

console.log(`${rows.length} books listed: ${plan.length} have exactly one matching file, ${unmatched.length} left for a human (repair-unmatched.tsv), ${done.size} already repaired`);
if (dryRun) {
  for (const p of plan.slice(0, 8)) console.log(`  ${p.sku}  "${p.storeTitle}"  <-  ${p.file}`);
  process.exit(0);
}
if (!(await signIn())) { console.error('Could not sign in.'); process.exit(1); }

// ---------- repair ----------
let fixed = 0, failed = 0, n = 0;
for (const { sku, storeTitle, file } of plan.slice(0, limit)) {
  n++;
  let attempt = 0, throttles = 0;
  while (attempt < 3) {
    try {
      const book = await findBook(sku);
      if (!book) throw new Error('book not found');
      // The title must still be the one we planned for; never trust a SKU on its own again.
      if (norm(book.name) !== norm(storeTitle)) throw new Error(`title changed to "${book.name}"`);

      const bytes = fs.readFileSync(path.join(LIBRARY, file));
      const slot = await api('/api/admin/books/upload-url', {
        method: 'POST',
        body: JSON.stringify({ filename: `${sku}.pdf`, format: 'pdf', contentType: 'application/pdf' }),
      });
      const put = await fetch(slot.uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'application/pdf' }, body: bytes });
      if (!put.ok) throw new Error(`R2 upload HTTP ${put.status}`);

      const fields = { file_url: slot.fileUrl || slot.key, file_public_id: slot.key, file_size_bytes: bytes.length };
      const pdf = (book.formats || []).find((f) => f.format === 'pdf');
      if (pdf) {
        await api(`/api/admin/books/${book.id}/formats/${pdf.id}`, { method: 'PATCH', body: JSON.stringify({ price: Number(pdf.price) || 100, ...fields }) });
      } else {
        await api(`/api/admin/books/${book.id}/formats`, { method: 'POST', body: JSON.stringify({ format: 'pdf', price: 100, ...fields }) });
      }

      // Read it back: same title, and the stored size is this file's size.
      const check = await findBook(sku);
      const after = (check?.formats || []).find((f) => f.format === 'pdf');
      if (norm(check?.name) !== norm(storeTitle) || Number(after?.file_size_bytes) !== bytes.length) {
        throw new Error('verification after upload did not match');
      }
      fs.appendFileSync(doneFile, `${sku}\t${storeTitle}\t${file}\t${slot.key}\t${bytes.length}\n`);
      fixed++;
      break;
    } catch (err) {
      if (err instanceof Unauthorized) { if (await signIn()) continue; console.error('Sign-in failed; stopping.'); process.exit(1); }
      if (err instanceof Throttled) { await sleep(THROTTLE_WAITS[Math.min(throttles++, 3)]); continue; }
      if (++attempt >= 3) {
        fs.appendFileSync(path.join(here, 'repair-failed.tsv'), `${sku}\t${storeTitle}\t${file}\t${err.message}\n`);
        failed++;
      } else await sleep(2000);
    }
  }
  if (n % 25 === 0) console.log(`${n}/${plan.length} - repaired ${fixed}, failed ${failed}`);
  await sleep(GAP_MS);
}

console.log(`\nrepair finished: ${fixed} books now have the right PDF, ${failed} failed (repair-failed.tsv)`);
