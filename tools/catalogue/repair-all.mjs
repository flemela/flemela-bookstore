// Puts the right PDF on every legacy paid title (SR-B0001..SR-B2533), matched by EXACT title.
//
//   node repair-all.mjs [--dry-run] [--limit N]
//
// For each legacy book in the store:
//   - already verified correct (audit-ok.tsv)      -> left alone
//   - exactly one library file with its title      -> upload it, attach it
//   - no file / several different files            -> make sure no broken eBook is on sale,
//                                                    and list it for a person (repair-review.tsv)
// Afterwards run with --verify to re-read the catalogue and check every repaired book's
// title and file size against what was uploaded.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const STORE = 'https://www.thesunrisebookstore.com';
const LIBRARY = 'C:/BOOKS/E-Books';
const here = path.dirname(fileURLToPath(import.meta.url));
const scratch = 'C:/Users/THESUN~1/AppData/Local/Temp/claude/C--Users-The-SunRise-Documents-flemela-bookstore/d609f9c5-3a84-46bb-889b-7e778d363495/scratchpad';
const flags = process.argv.slice(2);
const dryRun = flags.includes('--dry-run');
const verifyOnly = flags.includes('--verify');
const limitArg = flags.indexOf('--limit');
const limit = limitArg >= 0 ? Number(flags[limitArg + 1]) : Infinity;
const LAST_LEGACY = 2533;

const GAP_MS = 1000;
const THROTTLE_WAITS = [15000, 30000, 60000, 120000];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
const skuNum = (s) => (/^SR-B(\d+)$/i.exec(s) ? Number(RegExp.$1) : null);
const out = (name) => path.join(here, name);
const readTsvKeys = (f) =>
  fs.existsSync(f) ? new Set(fs.readFileSync(f, 'utf8').split('\n').map((l) => l.split('\t')[0]).filter(Boolean)) : new Set();

// ---------- auth / api ----------
const auth = JSON.parse(fs.readFileSync(out('auth.json'), 'utf8').replace(/^\uFEFF/, ''));
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
  for (let throttles = 0, errors = 0; ; ) {
    const res = await fetch(`${STORE}${pathname}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Cookie: `flemela_admin_session=${token}`,
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    if (res.status === 401 || res.status === 403) { if (await signIn()) continue; throw new Error('sign-in failed'); }
    if (res.status === 429) { await sleep(THROTTLE_WAITS[Math.min(throttles++, 3)]); continue; }
    if (res.status >= 500 && errors++ < 2) { await sleep(3000); continue; }
    if (!res.ok) throw new Error(`HTTP ${res.status} on ${pathname}`);
    return res.status === 204 ? null : res.json();
  }
}

// ---------- read every legacy book, fresh ----------
async function readLegacy() {
  const books = {};
  for (let page = 1; ; page++) {
    const data = await api(`/api/admin/books?limit=100&page=${page}`);
    const list = data.products || [];
    if (!list.length) break;
    for (const b of list) {
      const n = skuNum(b.sku);
      if (n === null || n < 1 || n > LAST_LEGACY) continue;
      const pdf = (b.formats || []).find((f) => f.format === 'pdf') || null;
      books[b.sku] = { id: b.id, name: b.name, pdf: pdf && { id: pdf.id, price: pdf.price, key: pdf.file_public_id, size: pdf.file_size_bytes } };
    }
    if (page % 50 === 0) console.log(`read page ${page}, ${Object.keys(books).length} legacy books so far`);
    await sleep(700);
  }
  return books;
}

// ---------- title -> file ----------
const csvRows = JSON.parse(fs.readFileSync(`${scratch}/legacy-pdf-rows.json`, 'utf8'));
const libraryFiles = fs.readdirSync(LIBRARY).filter((f) => /\.pdf$/i.test(f));
const librarySet = new Set(libraryFiles);
const index = (pairs) => {
  const m = new Map();
  for (const [k, f] of pairs) { if (!m.has(k)) m.set(k, new Set()); m.get(k).add(f); }
  return m;
};
const byCsvTitle = index(csvRows.filter((r) => librarySet.has(r.file)).map((r) => [norm(r.name), r.file]));
const byFilename = index(libraryFiles.map((f) => [norm(f.replace(/\.pdf$/i, '').replace(/\s*\(\d+\)\s*$/, '')), f]));

function pickOne(files) {
  const list = [...files];
  if (list.length === 1) return { file: list[0] };
  const sizes = new Set(list.map((f) => fs.statSync(path.join(LIBRARY, f)).size));
  if (sizes.size === 1) return { file: list.sort((a, b) => a.length - b.length)[0] };
  return { file: null, why: `several different files: ${list.join(' | ')}` };
}
function fileForTitle(title) {
  const k = norm(title);
  if (byCsvTitle.has(k)) return pickOne(byCsvTitle.get(k));
  if (byFilename.has(k)) return pickOne(byFilename.get(k));
  return { file: null, why: 'no file with exactly this title' };
}

// ---------- main ----------
if (!(await signIn())) { console.error('Could not sign in.'); process.exit(1); }
console.log('reading the catalogue (about 15 minutes)...');
const books = await readLegacy();
fs.writeFileSync(out('legacy-snapshot.json'), JSON.stringify(books));
console.log(`${Object.keys(books).length} legacy books in the store`);

const doneFile = out('repair-done.tsv');

if (verifyOnly) {
  let ok = 0, bad = [];
  for (const line of fs.readFileSync(doneFile, 'utf8').trim().split('\n')) {
    const [sku, title, , , size] = line.split('\t');
    const b = books[sku];
    if (b && norm(b.name) === norm(title) && Number(b.pdf?.size) === Number(size) && String(b.pdf?.key).startsWith('ebooks/')) ok++;
    else bad.push(`${sku}\texpected "${title}" ${size} bytes\tstore has "${b?.name}" ${b?.pdf?.size}`);
  }
  fs.writeFileSync(out('repair-verify-failed.tsv'), bad.join('\n') + '\n');
  console.log(`verified: ${ok} correct, ${bad.length} problems (repair-verify-failed.tsv)`);
  process.exit(0);
}

const verifiedOk = readTsvKeys(out('audit-ok.tsv'));
const alreadyRepaired = readTsvKeys(doneFile);
const upload = [], review = [], hideOnly = [];
let leftAlone = 0;

for (const [sku, b] of Object.entries(books)) {
  if (verifiedOk.has(sku) || alreadyRepaired.has(sku)) { leftAlone++; continue; }
  const { file, why } = fileForTitle(b.name);
  if (file) upload.push({ sku, ...b, file });
  else {
    review.push(`${sku}\t${b.name}\t${why}`);
    // A pdf entry that is not a real upload is a download that will fail: take it off sale.
    if (b.pdf && !String(b.pdf.key || '').startsWith('ebooks/')) hideOnly.push({ sku, ...b });
    // A real upload that isn't verified correct is suspect too (it came from the SKU mix-up).
    else if (b.pdf && String(b.pdf.key || '').startsWith('ebooks/')) hideOnly.push({ sku, ...b });
  }
}
fs.writeFileSync(out('repair-review.tsv'), 'SKU\tstore title\twhy it needs a person\n' + review.join('\n') + '\n');

console.log(`\nplan:`);
console.log(`  left alone (verified correct or already repaired): ${leftAlone}`);
console.log(`  upload the right file (exact title match)        : ${upload.length}`);
console.log(`  no safe match - listed in repair-review.tsv      : ${review.length}`);
console.log(`    of which still selling a broken eBook, to hide : ${hideOnly.length}`);
if (dryRun) {
  for (const u of upload.slice(0, 6)) console.log(`   ${u.sku}  "${u.name}"  <-  ${u.file}`);
  process.exit(0);
}

let hidden = 0;
for (const b of hideOnly) {
  await api(`/api/admin/books/${b.id}/formats/${b.pdf.id}`, { method: 'DELETE' });
  fs.appendFileSync(out('hidden-ebooks.tsv'), `${b.sku}\t${b.name}\t${b.pdf.price}\t${b.pdf.key}\n`);
  hidden++;
  await sleep(700);
}
if (hidden) console.log(`took ${hidden} broken eBooks off sale`);

let fixed = 0, failed = 0, n = 0;
for (const b of upload.slice(0, limit)) {
  n++;
  try {
    const bytes = fs.readFileSync(path.join(LIBRARY, b.file));
    const slot = await api('/api/admin/books/upload-url', {
      method: 'POST',
      body: JSON.stringify({ filename: `${b.sku}.pdf`, format: 'pdf', contentType: 'application/pdf' }),
    });
    const put = await fetch(slot.uploadUrl, { method: 'PUT', headers: { 'Content-Type': 'application/pdf' }, body: bytes });
    if (!put.ok) throw new Error(`R2 upload HTTP ${put.status}`);
    const fields = { file_url: slot.fileUrl || slot.key, file_public_id: slot.key, file_size_bytes: bytes.length };
    if (b.pdf) {
      await api(`/api/admin/books/${b.id}/formats/${b.pdf.id}`, { method: 'PATCH', body: JSON.stringify({ price: Number(b.pdf.price) || 100, ...fields }) });
    } else {
      await api(`/api/admin/books/${b.id}/formats`, { method: 'POST', body: JSON.stringify({ format: 'pdf', price: 100, ...fields }) });
    }
    fs.appendFileSync(doneFile, `${b.sku}\t${b.name}\t${b.file}\t${slot.key}\t${bytes.length}\n`);
    fixed++;
  } catch (err) {
    fs.appendFileSync(out('repair-failed.tsv'), `${b.sku}\t${b.name}\t${b.file}\t${err.message}\n`);
    failed++;
  }
  if (n % 25 === 0) console.log(`${n}/${upload.length} - repaired ${fixed}, failed ${failed}`);
  await sleep(GAP_MS);
}
console.log(`\nrepair finished: ${fixed} right PDFs attached, ${failed} failed. Now run with --verify.`);
