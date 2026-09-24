// Fast version of audit-legacy.mjs. Reads the legacy books 100 at a time from the admin
// list (which returns them in SKU order with their formats), compares titles locally, and
// only calls the store again to take a wrong eBook off sale. ~30 reads instead of ~2,000.
//
//   node fast-audit.mjs [--dry-run]
//
// Also writes legacy-snapshot.json (SKU -> id, title, pdf format) so the repair can skip
// its per-book searches too. Appends to the same audit-*.tsv files as audit-legacy.mjs.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STORE = 'https://www.thesunrisebookstore.com';
const here = path.dirname(fileURLToPath(import.meta.url));
const scratch = 'C:/Users/THESUN~1/AppData/Local/Temp/claude/C--Users-The-SunRise-Documents-flemela-bookstore/d609f9c5-3a84-46bb-889b-7e778d363495/scratchpad';
const dryRun = process.argv.includes('--dry-run');
const LAST_LEGACY = 2533;                               // SR-B0001 .. SR-B2533

const THROTTLE_WAITS = [15000, 30000, 60000, 120000];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const skuNum = (s) => (/^SR-B(\d+)$/i.exec(s) ? Number(RegExp.$1) : null);

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

async function api(pathname, options = {}) {
  for (let throttles = 0; ; ) {
    const res = await fetch(`${STORE}${pathname}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Cookie: `flemela_admin_session=${token}`,
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    if (res.status === 401 || res.status === 403) {
      if (await signIn()) continue;
      throw new Error('sign-in failed');
    }
    if (res.status === 429) { await sleep(THROTTLE_WAITS[Math.min(throttles++, 3)]); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status} on ${pathname}`);
    return res.status === 204 ? null : res.json();
  }
}

// What each SKU's uploaded file was meant to be (the CSV's pairing).
const csvRows = JSON.parse(fs.readFileSync(`${scratch}/legacy-pdf-rows.json`, 'utf8'));
const titleForSku = new Map(csvRows.map((r) => [r.sku, r.name]));
const fileForSku = JSON.parse(fs.readFileSync(`${scratch}/legacy-file-map.json`, 'utf8'));

// Books we uploaded a file to (from the uploader's ledger), and those already audited.
const attached = new Set(
  fs.readFileSync('C:/BOOKS/PDF batches/attach-progress.tsv', 'utf8').trim().split('\n').map((l) => l.split('\t')[0])
);
const progressFile = path.join(here, 'audit-progress.tsv');
const audited = new Set(
  fs.existsSync(progressFile) ? fs.readFileSync(progressFile, 'utf8').split('\n').map((l) => l.split('\t')[0]).filter(Boolean) : []
);

if (!(await signIn())) { console.error('Could not sign in.'); process.exit(1); }

// ---------- read the legacy range in pages ----------
const snapshot = {};
for (let page = 1; ; page++) {
  const data = await api(`/api/admin/books?limit=100&page=${page}`);
  const books = data.products || [];
  if (!books.length) break;
  for (const b of books) {
    const n = skuNum(b.sku);
    if (n === null || n > LAST_LEGACY) continue;
    const pdf = (b.formats || []).find((f) => f.format === 'pdf') || null;
    snapshot[b.sku] = {
      id: b.id,
      name: b.name,
      pdf: pdf && { id: pdf.id, price: pdf.price, key: pdf.file_public_id, size: pdf.file_size_bytes },
    };
  }
  // The list is in creation order, not SKU order (part of the legacy range was added
  // later), so keep reading until every book we uploaded to has turned up.
  const missing = [...attached].filter((s) => !snapshot[s]).length;
  if (page % 10 === 0) console.log(`page ${page}: ${Object.keys(snapshot).length} legacy books found, ${missing} uploaded-to books still to find`);
  if (missing === 0) break;
  await sleep(800);
}
fs.writeFileSync(path.join(here, 'legacy-snapshot.json'), JSON.stringify(snapshot));
console.log(`\n${Object.keys(snapshot).length} legacy books read into legacy-snapshot.json`);

// ---------- compare locally ----------
const toHide = [];
let right = 0, notInStore = 0;
for (const sku of attached) {
  if (audited.has(sku)) continue;
  const book = snapshot[sku];
  if (!book) { notInStore++; continue; }
  if (norm(book.name) === norm(titleForSku.get(sku))) {
    right++;
    if (!dryRun) {
      fs.appendFileSync(progressFile, `${sku}\tok\n`);
      fs.appendFileSync(path.join(here, 'audit-ok.tsv'), `${sku}\t${book.name}\n`);
    }
  } else toHide.push(sku);
}
console.log(`unaudited attached books: ${right} correct, ${toHide.length} wrong, ${notInStore} not in store`);
if (dryRun) { console.log('dry run - nothing hidden. First wrong:', toHide.slice(0, 5).join(', ')); process.exit(0); }

// ---------- hide the wrong ones ----------
let hidden = 0;
for (const sku of toHide) {
  const book = snapshot[sku];
  let action = 'no pdf format to remove';
  if (book.pdf) {
    await api(`/api/admin/books/${book.id}/formats/${book.pdf.id}`, { method: 'DELETE' });
    action = `hidden (was ${book.pdf.price} KSh)`;
    hidden++;
  }
  fs.appendFileSync(progressFile, `${sku}\tmismatch\n`);
  fs.appendFileSync(path.join(here, 'audit-mismatch.tsv'), `${sku}\t${book.name}\t${fileForSku[sku] || '?'}\t${action}\n`);
  if (hidden % 50 === 0) console.log(`hidden ${hidden}/${toHide.length}`);
  await sleep(700);
}
console.log(`\ndone: ${right} correct left selling, ${hidden} wrong eBooks taken off sale`);
